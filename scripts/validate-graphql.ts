/**
 * Validates every GraphQL operation exported from src/api against the AniList
 * schema snapshot in docs/anilist-schema.json, and checks that the enum unions
 * in src/api/types.ts match the schema exactly.
 *
 *   bun run scripts/validate-graphql.ts
 *
 * Refresh the schema snapshot with:
 *   bun run scripts/validate-graphql.ts --refresh-schema
 */
import {
  buildClientSchema,
  getIntrospectionQuery,
  isEnumType,
  parse,
  validate,
  type GraphQLSchema,
  type IntrospectionQuery,
} from 'graphql';

// Minimal typing of the Bun runtime so this file typechecks without adding
// @types/bun / @types/node to the React Native project.
interface BunRuntime {
  file(path: string): { text(): Promise<string> };
  write(path: string, data: string): Promise<number>;
  Glob: new (pattern: string) => { scan(opts: { cwd: string }): AsyncIterable<string> };
}
const Bun = (globalThis as unknown as { Bun: BunRuntime }).Bun;
const join = (...parts: string[]) => parts.join('/').replace(/\/+/g, '/');
const relative = (from: string, to: string) => (to.startsWith(from + '/') ? to.slice(from.length + 1) : to);
const readFileText = (path: string) => Bun.file(path).text();

const ROOT = join((import.meta as unknown as { dir: string }).dir, '..').replace(/\/[^/]+\/\.\.$/, '');
const SCHEMA_PATH = join(ROOT, 'docs/anilist-schema.json');
const API_DIR = join(ROOT, 'src/api');
/** Modules that do not export operations, or pull in React. */
const SKIP = new Set(['client.ts', 'document.ts', 'types.ts', 'index.ts']);

async function refreshSchema() {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: getIntrospectionQuery({ descriptions: true }) }),
  });
  const json = await res.json();
  if (!json.data) throw new Error(`Introspection failed: ${JSON.stringify(json).slice(0, 500)}`);
  await Bun.write(SCHEMA_PATH, JSON.stringify(json, null, 1));
  console.log(`Saved schema to ${relative(ROOT, SCHEMA_PATH)}`);
}

async function loadSchema(): Promise<GraphQLSchema> {
  const json = JSON.parse(await readFileText(SCHEMA_PATH)) as { data: IntrospectionQuery };
  return buildClientSchema(json.data);
}

const OPERATION_RE = /^\s*(query|mutation|subscription)\b/;

async function collectOperations() {
  const ops: { file: string; name: string; source: string }[] = [];
  const seen = new Set<string>();
  const add = (file: string, name: string, source: string) => {
    if (seen.has(source)) return; // same document re-exported (e.g. in a lookup map)
    seen.add(source);
    ops.push({ file, name, source });
  };
  const glob = new Bun.Glob('**/*.ts');
  for await (const rel of glob.scan({ cwd: API_DIR })) {
    if (SKIP.has(rel) || rel.startsWith('queries/')) continue;
    const mod = (await import(join(API_DIR, rel))) as Record<string, unknown>;
    for (const [name, value] of Object.entries(mod)) {
      if (typeof value === 'string' && OPERATION_RE.test(value)) {
        add(rel, name, value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Maps of operations, e.g. USER_FAVOURITES_QUERIES.
        for (const [k, v] of Object.entries(value)) {
          if (typeof v === 'string' && OPERATION_RE.test(v)) add(rel, `${name}.${k}`, v);
        }
      }
    }
  }
  return ops;
}

async function checkEnums(schema: GraphQLSchema): Promise<string[]> {
  const errors: string[] = [];
  const src = await readFileText(join(API_DIR, 'types.ts'));
  const re = /export type (\w+) =((?:\s*\|\s*'[A-Z0-9_]+')+);/g;
  let found = 0;
  for (const m of src.matchAll(re)) {
    const [, name, body] = m;
    const type = schema.getType(name);
    if (!type || !isEnumType(type)) continue;
    found++;
    const ts = [...body.matchAll(/'([A-Z0-9_]+)'/g)].map((x) => x[1]).sort();
    const gql = type.getValues().map((v) => v.name).sort();
    const missing = gql.filter((v) => !ts.includes(v));
    const extra = ts.filter((v) => !gql.includes(v));
    if (missing.length || extra.length) {
      errors.push(`types.ts enum ${name}: missing [${missing.join(', ')}] extra [${extra.join(', ')}]`);
    }
  }
  if (found === 0) errors.push('types.ts: no enum unions found');
  console.log(`Checked ${found} enum unions in types.ts`);
  return errors;
}

async function main() {
  if (process.argv.includes('--refresh-schema')) await refreshSchema();
  const schema = await loadSchema();
  const ops = await collectOperations();
  const errors: string[] = [];
  const names = new Map<string, string>();

  for (const op of ops) {
    const where = `${op.file} ${op.name}`;
    try {
      const doc = parse(op.source);
      const opNames = doc.definitions.flatMap((d) =>
        d.kind === 'OperationDefinition' ? [d.name?.value ?? '(anonymous)'] : [],
      );
      if (opNames.length !== 1) errors.push(`${where}: expected exactly one operation, found ${opNames.length}`);
      for (const n of opNames) {
        const prev = names.get(n);
        if (prev && prev !== where) errors.push(`${where}: operation name "${n}" also used by ${prev}`);
        names.set(n, where);
      }
      for (const e of validate(schema, doc)) {
        const loc = e.locations?.[0];
        errors.push(`${where}${loc ? ` (${loc.line}:${loc.column})` : ''}: ${e.message}`);
      }
    } catch (e) {
      errors.push(`${where}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  errors.push(...(await checkEnums(schema)));

  console.log(`Validated ${ops.length} operations from src/api`);
  if (errors.length) {
    console.error(`\n${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('0 errors');
}

await main();
