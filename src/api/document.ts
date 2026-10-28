/**
 * Tiny GraphQL document builder.
 *
 * Fragments declare their own fragment dependencies, and `operation()` appends
 * the transitive closure of fragments exactly once, so every exported operation
 * string is a complete, self-contained GraphQL document (validated by
 * scripts/validate-graphql.ts against docs/anilist-schema.json).
 */

export interface Fragment {
  readonly name: string;
  readonly source: string;
  readonly deps: readonly Fragment[];
}

export function fragment(source: string, deps: readonly Fragment[] = []): Fragment {
  const match = /fragment\s+(\w+)\s+on\s+\w+/.exec(source);
  if (!match) throw new Error(`Invalid fragment source: ${source.slice(0, 60)}`);
  return { name: match[1], source: source.trim(), deps };
}

function collect(frags: readonly Fragment[], seen: Map<string, Fragment>) {
  for (const f of frags) {
    if (seen.has(f.name)) continue;
    seen.set(f.name, f);
    collect(f.deps, seen);
  }
}

export function operation(source: string, deps: readonly Fragment[] = []): string {
  const seen = new Map<string, Fragment>();
  collect(deps, seen);
  return [source.trim(), ...[...seen.values()].map((f) => f.source)].join('\n\n');
}

/** Builds `$a: Int, $b: [String]` and `a: $a, b: $b` lists from an arg table. */
export function argList(args: readonly (readonly [string, string])[]) {
  return {
    declarations: args.map(([name, type]) => `$${name}: ${type}`).join(', '),
    arguments: args.map(([name]) => `${name}: $${name}`).join(', '),
  };
}
