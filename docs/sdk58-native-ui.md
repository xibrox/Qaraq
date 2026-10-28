# Qaraq: native UI reference for Expo SDK 58

Everything here was checked against the type definitions installed in this repo's `node_modules`
(2026-10-25) and against the v58 docs. Versions:

| Package | Version |
| --- | --- |
| expo | ~58.0.19 |
| expo-router | 58.0.26 |
| @expo/ui | 58.0.23 |
| expo-glass-effect | 58.0.5 |
| react-native-screens | 4.30.0 |
| expo-notifications | 58.1.6 |
| expo-background-task | 58.0.11 |
| expo-haptics | 58.0.7 |
| expo-symbols | 58.0.4 |
| react-native-gesture-handler | 3.3.0 |
| react-native-reanimated | 4.7.1 |

If anything below seems wrong, check the source of truth before you work around it:

- `node_modules/expo-router/build/native-tabs/{types,common/elements}.d.ts`
- `node_modules/expo-router/build/layouts/stack-utils/**` (Stack.Header, Stack.Title, Stack.SearchBar, Stack.Toolbar)
- `node_modules/expo-router/build/react-navigation/native-stack/types.d.ts` (`NativeStackNavigationOptions`)
- `node_modules/expo-router/build/link/{elements,zoom/*}.d.ts`
- `node_modules/@expo/ui/build/{swift-ui,jetpack-compose,universal}/**/index.d.ts`
- `node_modules/@expo/ui/build/{swift-ui,jetpack-compose}/modifiers/index.d.ts`
- `node_modules/expo-glass-effect/build/*.d.ts`

Docs: https://docs.expo.dev/versions/v58.0.0/ and https://docs.expo.dev/llms.txt

Ground rules for this repo:

- Use bun. Add packages with `bunx expo install <pkg>` and run tools with `bunx`. Never use npm or npx.
- Do not create `ios/` or `android/`. Native configuration goes in `app.json` and config plugins.
- Every native module here (expo-ui, glass, native tabs, notifications) needs a **development build**:
  `bunx expo run:ios` / `bunx expo run:android`, or `bunx eas-cli build --profile development`.
- React Compiler and typedRoutes are on (`app.json > expo.experiments`). See section 7.

---

## 0. Recommended app shell

```
src/app/
  _layout.tsx                  # Root: ThemeProvider + QueryClientProvider + NativeTabs
  (lists)/_layout.tsx          # Stack
  (lists)/index.tsx            # My Lists
  (explore)/_layout.tsx        # Stack
  (explore)/index.tsx          # Explore
  (profile)/_layout.tsx        # Stack
  (profile)/index.tsx
  (search)/_layout.tsx         # Stack, used by the role="search" tab
  (search)/index.tsx
  (lists,explore,profile,search)/media/[id].tsx   # Shared route: pushed inside the current tab's Stack
  (lists,explore,profile,search)/character/[id].tsx  # same pattern for staff/studio/user/activity
  (profile)/settings/...       # Pushed or presented as a formSheet
```

Detail screens should be **shared routes inside the tab groups** (Expo Router's array-group syntax), not siblings of the
tab groups at the root: every route under the root layout is a NativeTabs child, so a root-level `media/[id].tsx` is not
pushed onto the current tab's Stack (integrator note: not verified at runtime, but the shared-route pattern avoids the
question entirely and keeps the tab bar and back stack per tab).

In this repo the root `_layout.tsx` is a Stack (tabs + `sign-in` modal) and `src/app/(tabs)/_layout.tsx` renders
`<AppTabs />` from `src/components/app-tabs.tsx`. The implemented shell is documented in `docs/ui-architecture.md`. Two rules:

1. **Nest a native `Stack` inside every tab** that needs a header, large title, search bar, or pushed screens. NativeTabs
   has no header of its own.
2. **Wrap the whole tree in expo-router's `ThemeProvider`**. This is the documented fix for Liquid Glass header buttons
   flickering in dark mode on iOS 26, and for the white flash between screens. In Qaraq use `ThemeProvider` from
   `@/theme` (already mounted in `src/app/_layout.tsx`): it wraps expo-router's provider with a navigation theme built from
   the user's theme/accent settings, so don't add a second expo-router `ThemeProvider` with `DarkTheme`/`DefaultTheme`.

Native tabs limitations: Android allows at most 5 tabs. You can't measure the tab bar height. Native tabs can't be nested
inside native tabs. Tabs can't be added or removed at runtime (a hidden or dynamic trigger remounts the navigator).
FlatList doesn't get scroll-to-top or minimize-on-scroll, so prefer `ScrollView` or `FlashList`/`LegendList` as the first
child, or test it.

---

## 1. NativeTabs (`expo-router/native-tabs`)

```ts
import { NativeTabs } from 'expo-router/native-tabs';
// NativeTabs.Trigger, NativeTabs.Trigger.Label, .Icon, .Badge, .VectorIcon
// NativeTabs.BottomAccessory, NativeTabs.BottomAccessory.usePlacement()
```

`expo-router/unstable-native-tabs` still exists as an alias. Use `expo-router/native-tabs`.

### 1.1 `<NativeTabs>` props (`NativeTabsProps`)

| Prop | Type | Platform | Notes |
| --- | --- | --- | --- |
| `children` | Trigger / BottomAccessory | all | |
| `labelStyle` | `NativeTabsLabelStyle \| { default?, selected? }` | all | `fontFamily, fontSize, fontStyle, fontWeight, color` |
| `iconColor` | `ColorValue \| { default?, selected? }` | all | |
| `tintColor` | `ColorValue` | all | Selected tint. Use `PlatformColor`/`DynamicColorIOS` on iOS 26 (glass adapts to content) |
| `backgroundColor` | `ColorValue` | all | **No effect on iOS 26+** (system draws the glass) |
| `badgeBackgroundColor` | `ColorValue` | all | |
| `badgeTextColor` | `ColorValue` | android, web | |
| `hidden` | `boolean` | all | Hides the tab bar |
| `minimizeBehavior` | `'automatic' \| 'never' \| 'onScrollDown' \| 'onScrollUp'` | iOS 26+ | Liquid Glass minimize-on-scroll |
| `blurEffect` | `NativeTabsBlurEffect` | iOS ≤18 | `'systemMaterial'`, `'systemChromeMaterial'`, ... No effect on iOS 26+ |
| `shadowColor` | `ColorValue` | iOS ≤18 | |
| `disableTransparentOnScrollEdge` | `boolean` | iOS ≤18 | |
| `titlePositionAdjustment` | `{ horizontal?, vertical? }` | iOS | |
| `sidebarAdaptable` | `boolean` | iOS 18+ | iPad sidebar (and large iPhones in landscape on iOS 27) |
| `preferredPlacement` | `'automatic' \| 'sidebar' \| 'tabBar'` | iOS 27+ | |
| `disableHiddenAnimation` | `boolean` | iOS 18+ | |
| `activityEnabled` | `boolean` | all | Uses React `<Activity>` to keep inactive tabs' state. Default `false` |
| `disableIndicator` | `boolean` | android | M3 active indicator pill |
| `indicatorColor` | `ColorValue` | android, web | |
| `rippleColor` | `ColorValue` | android | |
| `labelVisibilityMode` | `'auto' \| 'selected' \| 'labeled' \| 'unlabeled'` | android | |
| `backBehavior` | `'none' \| 'initialRoute' \| 'history'` | android | |
| `tabBarRespectsIMEInsets` | `boolean` | android | Needs `adjustResize`, API 30+ |
| `screenListeners` | `{ tabPress, focus, blur }` | all | |
| `unstable_screenErrorBoundary` | `ComponentType<ErrorBoundaryProps>` | all | |
| `unstable_nativeProps` | `TabsHostProps` (react-native-screens) | ios, android | Escape hatch |

### 1.2 `<NativeTabs.Trigger>` props (`NativeTabTriggerProps`)

| Prop | Platform | Notes |
| --- | --- | --- |
| `name` | all | Route name (folder or file) relative to the layout. Required in layouts |
| `hidden` | all | Not navigable at all. Changing it remounts the navigator |
| `disabled` | ios, android | Visible but not tappable. JS navigation still works |
| `role` | iOS | `'bookmarks' \| 'contacts' \| 'downloads' \| 'favorites' \| 'featured' \| 'history' \| 'more' \| 'mostRecent' \| 'mostViewed' \| 'recents' \| 'search' \| 'topRated'`. `'search'` makes it a `UISearchTab` on iOS 26.1+. Don't change it after render |
| `disableAutomaticSearchActivation` | iOS 26.1+ | With `role="search"`, don't auto-focus the nested stack's search bar |
| `prominent` | iOS 27+ (Xcode 27) | Own glass surface, stays visible when minimized. One tab only, layout trigger only |
| `disablePopToTop` / `disableScrollToTop` | iOS | Re-tap behavior |
| `disableAutomaticContentInsets` | ios, android | Android wraps content in a bottom SafeAreaView by default. iOS auto-adjusts the first ScrollView |
| `contentStyle` | ios, android | Padding, background, flex alignment subset |
| `activityEnabled` | all | Per-route override |
| `testID`, `accessibilityLabel` | ios, android | |
| `disableTransparentOnScrollEdge`, `rippleColor`, `indicatorColor`, `disableIndicator`, `labelVisibilityMode` | as above | Per-trigger overrides |
| `listeners` | all | `{ tabPress, focus, blur }` |
| `unstable_nativeProps` | ios, android | `TabsScreenProps` |

### 1.3 Trigger children

```tsx
<NativeTabs.Trigger.Label hidden={false} selectedStyle={{ color: accent }}>Lists</NativeTabs.Trigger.Label>
<NativeTabs.Trigger.Badge hidden={count === 0} selectedBackgroundColor="red">{String(count)}</NativeTabs.Trigger.Badge>
<NativeTabs.Trigger.Badge />   {/* empty dot badge */}
```

`NativeTabs.Trigger.Icon` accepts **one iOS source plus one Android source**:

- iOS: `sf` (SF Symbol, typed by `sf-symbols-typescript`), `xcasset` (asset catalog name), or `src`.
- Android: `md` (Material Symbol name, type `AndroidSymbol` from `expo-symbols`), `drawable` (Android resource name), or `src`.
- Priority on iOS is `sf` > `xcasset` > `src`. On Android it is `drawable` > `md` > `src`.
- Every source also accepts `{ default?, selected }` for a different selected-state icon.
- `selectedColor?: ColorValue`. `renderingMode?: 'template' | 'original'` applies to iOS `src` images only. SF Symbols are always tinted.
- The allowed combinations are typed as a union, so `sf`+`md`, `sf`+`drawable`, `sf`+`src`, `xcasset`+`md`, `md`+`src`, `src` alone, and so on.

```tsx
<NativeTabs.Trigger.Icon sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }} md="list" />
<NativeTabs.Trigger.Icon sf="safari" md="explore" />
<NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
<NativeTabs.Trigger.Icon sf="bell" md="notifications" />
```

`NativeTabs.Trigger.VectorIcon` rasterizes an `@expo/vector-icons` glyph for `src`, for example
`src={<NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="home" />}`. `@expo/vector-icons` isn't installed,
so prefer `sf`/`md`.

### 1.4 Liquid Glass behavior (iOS 26+)

- The tab bar is drawn by the system as Liquid Glass. `backgroundColor`, `blurEffect`, `shadowColor`, and
  `disableTransparentOnScrollEdge` are ignored. The glass picks light or dark from the content behind it, and there's no
  callback for that, so give `tintColor` and `labelStyle.color` adaptive colors:
  `DynamicColorIOS({ light: '#000', dark: '#fff' })` or `PlatformColor('label')`.
- `minimizeBehavior="onScrollDown"` shrinks the bar into a pill while the user scrolls down. It needs the screen's
  `ScrollView` to be its **first child**. If you wrap it, set `collapsable={false}` on the wrapper.
- The `role="search"` tab renders separately (a circle at the trailing edge). Its screen should be a Stack whose page renders
  `Stack.SearchBar`. Selecting the tab focuses the search field on iOS 26.1+ unless `disableAutomaticSearchActivation`.
- `NativeTabs.BottomAccessory` (iOS 26+) adds a floating glass bar above the tab bar, like Music's mini player. It renders
  **twice** (`'regular'` and `'inline'` when minimized), so keep state outside it.

### 1.5 Full example for Qaraq

```tsx
// src/components/app-tabs.tsx
import { NativeTabs } from 'expo-router/native-tabs';
import { useUnreadNotificationCount } from '@/api';
import { useIsSignedIn } from '@/auth';
import { useColors } from '@/theme';

export default function AppTabs() {
  // `accentColor` in settings is a {kind, preset|hex} object; use the resolved, contrast-checked colour.
  const { accent } = useColors();
  const signedIn = useIsSignedIn();
  const { data: unread = 0 } = useUnreadNotificationCount({ enabled: signedIn });

  // ThemeProvider re-renders on light/dark changes, so a plain hex is fine here.
  const tint = accent;

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={tint}
      labelVisibilityMode="labeled"
      indicatorColor={`${accent}33`}
      sidebarAdaptable>
      <NativeTabs.Trigger name="(lists)">
        <NativeTabs.Trigger.Label>Lists</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.stack', selected: 'square.stack.fill' }} md="video_library" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(explore)">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="safari" md="explore" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
        <NativeTabs.Trigger.Badge hidden={unread === 0}>{unread > 99 ? '99+' : String(unread)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      {/* iOS 26+: a separate search tab. On Android this is a normal 4th tab. */}
      <NativeTabs.Trigger name="(search)" role="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

For the "default tab" setting, NativeTabs has no `initialRouteName` prop in its typings. Read the setting at startup and
call `router.replace('/(explore)')` once (for example in the root layout after the store hydrates), or use the
`unstable_settings` export (`export const unstable_settings = { initialRouteName: '(lists)' }`) in the layout. That export
is static, so it can't depend on the setting.

```tsx
// src/app/(search)/_layout.tsx
import { Stack } from 'expo-router';
export default function SearchLayout() {
  return <Stack screenOptions={{ headerLargeTitleEnabled: true }} />;
}

// src/app/(search)/index.tsx
import { Stack } from 'expo-router';
export default function SearchScreen() {
  const [q, setQ] = useState('');
  return (
    <>
      <Stack.Title large>Search</Stack.Title>
      <Stack.SearchBar placeholder="Anime, manga, characters, staff…" onChangeText={(e) => setQ(e.nativeEvent.text)} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">{/* results */}</ScrollView>
    </>
  );
}
```

### 1.6 Bottom accessory

```tsx
function AiringAccessory({ entry }: { entry: Entry }) {
  const placement = NativeTabs.BottomAccessory.usePlacement(); // 'regular' | 'inline'
  return placement === 'inline' ? <CompactAiring entry={entry} /> : <FullAiring entry={entry} />;
}

<NativeTabs>
  <NativeTabs.BottomAccessory>
    <AiringAccessory entry={nextAiring} />
  </NativeTabs.BottomAccessory>
  {/* triggers */}
</NativeTabs>
```

---

## 2. Native Stack headers

`Stack` from `expo-router` wraps react-native-screens' native stack. Configure it with the `options` object
(`NativeStackNavigationOptions`) **or** with the declarative components `Stack.Title`, `Stack.Header`, `Stack.SearchBar`,
`Stack.Toolbar`, and `Stack.Screen.BackButton`. You can render those components inside a page, which configures that page,
or inside `<Stack.Screen name="...">` in a layout. If several are rendered for one screen, the last one wins.

### 2.1 Static types

```ts
Stack                // navigator
Stack.Screen         // { name, options, listeners, dangerouslySingular, activityEnabled, children }
Stack.Screen.BackButton // { children?: string, style, withMenu (iOS), displayMode: 'default'|'generic'|'minimal' (iOS), hidden, src }
Stack.Title          // { children, asChild, large (iOS), style: {fontFamily,fontSize,fontWeight,color,textAlign}, largeStyle }
Stack.Header         // { hidden, asChild, transparent, blurEffect (iOS), style: {color, backgroundColor, shadowColor:'transparent'}, largeStyle }
Stack.SearchBar      // react-native-screens SearchBarProps
Stack.Toolbar        // { placement: 'left'|'right'|'bottom' (default 'bottom'), asChild, tintColor/backgroundColor (android), disableImePadding (android) }
Stack.Toolbar.Button / Menu / MenuAction / SearchBarSlot / Spacer / View / Label / Icon / Badge
Stack.Protected      // { guard: boolean }
```

### 2.2 Large titles, transparent, blur, and Liquid Glass headers

```tsx
// Layout-level
<Stack
  screenOptions={{
    headerLargeTitleEnabled: true,        // (headerLargeTitle is deprecated)
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    headerTransparent: Platform.OS === 'ios', // see note below
  }}>
  <Stack.Screen name="index" options={{ title: 'My Lists' }} />
  <Stack.Screen name="media/[id]" options={{ headerLargeTitleEnabled: false, title: '' }} />
</Stack>
```

- **iOS 26+**: `Stack.Header.transparent` (and `headerTransparent`) defaults to **true** when Liquid Glass is available and
  no header background is set. The bar is glass and content scrolls under it. Call `enableLegacyHeaderAppearance()` (exported
  from `expo-router`) once at startup to opt out.
- `headerBlurEffect` / `Stack.Header blurEffect`: UIKit blur styles such as `'systemMaterial'`, `'systemChromeMaterial'`,
  `'regular'`, `'prominent'`, ... Setting it turns on transparency. Don't combine it with `scrollEdgeEffects` on iOS 26.
- `scrollEdgeEffects?: { top?, bottom?, left?, right?: 'automatic' | 'hard' | 'soft' | 'hidden' }`. This is the iOS 26
  scroll-edge blur under glass bars.
- The large title collapses only if the `ScrollView`/`FlatList` is the **first child** of the screen (or the wrapper has
  `collapsable={false}`). Use `contentInsetAdjustmentBehavior="automatic"` on the ScrollView.
- Other options: `headerTintColor`, `headerStyle: { backgroundColor }`, `headerShadowVisible`,
  `headerLargeStyle: { backgroundColor }`, `headerTitleStyle`, `headerLargeTitleStyle`, `headerTitleAlign` (Android center),
  `headerUserInterfaceStyle: 'light' | 'dark'`, `headerBackground: () => node`, `headerBackButtonMenuEnabled`,
  `headerBackTitle`, `headerBackImageSource`, `contentStyle`, `animation` (`'default' | 'fade' | 'fade_from_bottom' | 'flip' | 'none' | 'simple_push' | 'slide_from_bottom' | 'slide_from_right' | 'slide_from_left' | 'ios_from_right' | 'ios_from_left'`),
  `gestureEnabled`, `fullScreenGestureEnabled`, `freezeOnBlur`, `statusBarStyle`, `navigationBarColor`, `orientation`.

Declarative, in a page:

```tsx
import { Stack } from 'expo-router';

export default function MediaScreen() {
  return (
    <>
      <Stack.Title style={{ fontWeight: '600' }}>{title}</Stack.Title>
      <Stack.Header transparent blurEffect="systemChromeMaterial" style={{ shadowColor: 'transparent' }} />
      <Stack.Screen.BackButton displayMode="minimal" />
      <ScrollView contentInsetAdjustmentBehavior="never">{/* banner under the glass header */}</ScrollView>
    </>
  );
}
```

### 2.3 Search: `Stack.SearchBar` / `headerSearchBarOptions`

Both take react-native-screens `SearchBarProps`:

`ref` (`SearchBarCommands`: `focus, blur, clearText, toggleCancelButton, setText, cancelSearch`), `autoCapitalize`,
`autoFocus`, `barTintColor`, `tintColor`, `cancelButtonText`, `disableBackButtonOverride`, `hideNavigationBar`,
`hideWhenScrolling`, `inputType: 'text'|'phone'|'number'|'email'`, `obscureBackground`, `onBlur`, `onCancelButtonPress`,
`onChangeText(e)` (`e.nativeEvent.text`), `onClose`, `onFocus`, `onOpen`, `onSearchButtonPress`, `placeholder`,
`placement: 'automatic'|'inline'|'stacked'|'integrated'|'integratedButton'|'integratedCentered'` (iOS 16+),
`allowToolbarIntegration` (iOS 26, default true), `textColor`, `hintTextColor`, `headerIconColor`, `shouldShowHintSearchIcon`.

`Stack.SearchBar` forces `headerShown: true`. On iOS 26 you can place it in the bottom toolbar with
`<Stack.Toolbar><Stack.Toolbar.SearchBarSlot /></Stack.Toolbar>`. `SearchBarSlot` renders nothing on Android.

### 2.4 Header items and menus: `Stack.Toolbar`

Available on iOS (SDK 55+) and Android (SDK 56+). Left/right placements go in the header. `bottom` (the default) is a UIKit
bottom toolbar on iOS and a bottom bar on Android, and **only works inside page components**, not layouts. `Stack.Toolbar`
can't be nested. Badges only work in left/right placements.

`Stack.Toolbar.Button` props: `icon` (SF Symbol string or `ImageSourcePropType`; **Android needs an image source**),
`children` (text label, or `Stack.Toolbar.Icon` / `Label` / `Badge`), `onPress`, `disabled`, `hidden`, `selected` (iOS),
`tintColor`, `variant: 'plain'|'done'|'prominent'` (iOS), `style`, `separateBackground` (iOS), `hidesSharedBackground` (iOS 26),
`iconRenderingMode`, `image` (iOS bottom only, from `useImage` in expo-image), `accessibilityLabel`, `accessibilityHint`.

`Stack.Toolbar.Menu` props: `icon`, `title`, `children` (MenuAction, nested Menu, Icon, Label), `inline`, `palette` (iOS),
`destructive` (iOS), `elementSize: 'auto'|'small'|'medium'|'large'`, `cornerRadius` (Android), `tintColor`, `variant`, `disabled`,
`hidden`, `separateBackground`, `hidesSharedBackground`. On Android the root `icon` must be an image source; SF Symbols are
silently dropped.

`Stack.Toolbar.MenuAction` props: `children` (title), `icon` (SF Symbol on iOS, image source on Android), `onPress`, `isOn`
(checkmark), `destructive`, `disabled`, `hidden`, `subtitle` (iOS), `discoverabilityLabel` (iOS),
`unstable_keepPresented`, `image`, `iconRenderingMode`.

`Stack.Toolbar.Spacer`: `width` is required on Android and in left/right placements. With no width in the iOS bottom
placement it becomes a flexible spacer. `sharesBackground` (iOS 26).

`Stack.Toolbar.View`: custom React content (`hidesSharedBackground`, `separateBackground`).

Material Symbol XML icons on Android come from `@expo/material-symbols`, which is **not installed yet**. Add it with
`bunx expo install @expo/material-symbols`, then `import MoreVert from '@expo/material-symbols/more_vert.xml'`. Or download
other styles into `assets/` with `bunx @expo/material-symbols --style rounded more_vert` and `require()` them.

Media detail header menu ("Add to list" with a status submenu):

```tsx
import { Stack } from 'expo-router';
import MoreVert from '@expo/material-symbols/more_vert.xml';
import Favorite from '@expo/material-symbols/favorite.xml';

const isIOS = process.env.EXPO_OS === 'ios';

export default function MediaDetail() {
  const { status, setStatus, isFavourite, toggleFavourite, share } = useMediaActions();
  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={isIOS ? (isFavourite ? 'heart.fill' : 'heart') : Favorite}
          tintColor={isFavourite ? 'red' : undefined}
          onPress={toggleFavourite}
          accessibilityLabel="Favourite"
        />
        <Stack.Toolbar.Menu icon={isIOS ? 'ellipsis.circle' : MoreVert} title="Options">
          <Stack.Toolbar.Menu inline title="Status">
            {(['CURRENT', 'PLANNING', 'COMPLETED', 'REPEATING', 'PAUSED', 'DROPPED'] as const).map((s) => (
              <Stack.Toolbar.MenuAction key={s} isOn={status === s} onPress={() => setStatus(s)}>
                {labelFor(s)}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
          <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={share}>Share</Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction destructive icon="trash" onPress={removeFromList}>Remove from list</Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {/* content */}
    </>
  );
}
```

There's also the lower-level `unstable_headerLeftItems` / `unstable_headerRightItems` options
(`(props) => NativeStackHeaderItem[]`), and plain `headerRight: () => <ReactNode>` still works. Prefer `Stack.Toolbar`.

Bottom toolbar (iOS-style, page only):

```tsx
<Stack.Toolbar>
  <Stack.Toolbar.Button icon="line.3.horizontal.decrease.circle" onPress={openFilters} />
  <Stack.Toolbar.Spacer />
  <Stack.Toolbar.SearchBarSlot />
  <Stack.Toolbar.Spacer />
  <Stack.Toolbar.Button icon="square.grid.2x2" onPress={toggleGrid} />
</Stack.Toolbar>
```

### 2.5 Sheets (formSheet, detents)

```tsx
<Stack.Screen
  name="entry-editor"
  options={{
    presentation: 'formSheet',          // 'card'|'modal'|'transparentModal'|'containedModal'|'containedTransparentModal'|'fullScreenModal'|'formSheet'|'pageSheet'
    sheetAllowedDetents: [0.5, 1],      // ascending fractions, or 'fitToContents'. Android uses at most 3
    sheetInitialDetentIndex: 0,         // or 'last'
    sheetGrabberVisible: true,
    sheetCornerRadius: 24,
    sheetLargestUndimmedDetentIndex: 'none', // number | 'none' | 'last'
    sheetExpandsWhenScrolledToEdge: true,
    sheetShouldOverflowTopInset: false,
    sheetResizeAnimationEnabled: true,
    sheetElevation: 24,                 // Android
    headerShown: false,
    contentStyle: { backgroundColor: 'transparent' }, // let the iOS 26 glass sheet show through
    // unstable_sheetFooter: () => <SaveBar />,
  }}
/>
```

On iOS 26 a formSheet with a transparent background picks up the system Liquid Glass sheet material. Android falls back to
a modal bottom sheet. For in-place sheets without a route there are also `BottomSheet` (SwiftUI), `ModalBottomSheet`
(Compose), the universal `BottomSheet` (`@expo/ui`), and `@expo/ui/community/bottom-sheet`.

### 2.6 Zoom transitions, link previews, and context menus (iOS)

```tsx
import { Link, usePreventZoomTransitionDismissal } from 'expo-router';
import { Image } from 'expo-image';

// Source (list/grid cell). iOS 18+ zoom transition into the detail screen
<Link href={`/media/${id}`}>
  <Link.AppleZoom /* alignmentRect={{ x, y, width, height }} */>
    <Image source={{ uri: cover }} style={{ width: 110, height: 160, borderRadius: 8 }} />
  </Link.AppleZoom>
</Link>

// Destination (media/[id].tsx). Optional explicit target
<Link.AppleZoomTarget>
  <Image source={{ uri: cover }} style={{ width: 140, height: 200 }} />
</Link.AppleZoomTarget>
// usePreventZoomTransitionDismissal({ unstable_dismissalBoundsRect: { minY: height - 200 } });

// Peek preview plus context menu on long-press (iOS only, ignored elsewhere)
<Link href={`/media/${id}`}>
  <Link.Trigger>
    <MediaCard media={m} />
  </Link.Trigger>
  <Link.Preview style={{ width: 320, height: 420 }} />
  <Link.Menu>
    <Link.MenuAction icon="plus.circle" onPress={() => addToPlanning(m)}>Add to Planning</Link.MenuAction>
    <Link.Menu title="Set status" icon="list.bullet">
      <Link.MenuAction onPress={() => setStatus('CURRENT')}>Watching</Link.MenuAction>
      <Link.MenuAction onPress={() => setStatus('COMPLETED')}>Completed</Link.MenuAction>
    </Link.Menu>
    <Link.MenuAction destructive icon="trash" onPress={() => remove(m)}>Delete</Link.MenuAction>
  </Link.Menu>
</Link>
```

`Link.Menu` props: `title, subtitle, icon (SF), image, palette, inline, destructive, elementSize`. `Link.MenuAction` props:
`children, icon, image, imageRenderingMode, isOn, destructive, disabled, hidden, subtitle, discoverabilityLabel, onPress,
unstable_keepPresented`. On Android, use `@expo/ui/community/menu` (`MenuView`, with `shouldOpenOnLongPress`) or a Compose
`DropdownMenu`.

### 2.7 Platform colors

```ts
import { Color } from 'expo-router';
Color.ios.label; Color.ios.systemBackground; Color.ios.secondarySystemGroupedBackground;
Color.android.dynamic.primary; Color.android.dynamic.surfaceContainer; Color.android.material.primary; Color.android.attr.colorPrimary;
```

With React Compiler on, components that read `Color.android.dynamic.*` must also call `useColorScheme()` so they re-render
on theme change.

---

## 3. `@expo/ui`

Three tiers:

- `@expo/ui/swift-ui` (+ `/modifiers`): real SwiftUI. **Apple only**. Use it in `*.ios.tsx`.
- `@expo/ui/jetpack-compose` (+ `/modifiers`): real Compose (Material 3). **Android only**. Use it in `*.android.tsx`.
- `@expo/ui`: universal components (`Host, Column, Row, Text, Button, ScrollView, Switch, Slider, Checkbox, BottomSheet,
  Collapsible, FieldGroup, Icon, List, ListItem, Picker, RNHostView, Spacer, TextInput`, plus `useNativeState`). They map to
  SwiftUI on iOS, Compose on Android, and DOM on web.
- `@expo/ui/community/*`: drop-ins for `bottom-sheet`, `datetime-picker`, `segmented-control`, `picker`, `slider`,
  `masked-view`, `menu` (`MenuView`), and `pager-view`.

Core rules:

- **Every expo-ui tree starts with `<Host>`**. Flexbox styles apply to `Host` only. Inside, layout is SwiftUI or Compose
  (`VStack/HStack/ZStack` and `Row/Column/Box`). Use `<Host style={{ flex: 1 }}>` for full-screen `Form`/`List`/`LazyColumn`,
  or `<Host matchContents>` for inline controls. `matchContents` can only be set at mount.
- Put RN views inside expo-ui with `<RNHostView matchContents>`. To use expo-ui again inside that RN subtree, add a new `Host`.
- Styling is done with `modifiers={[...]}` built from the `/modifiers` entry points. Order matters, as in SwiftUI.
- Babel: `babel-preset-expo` already includes `@expo/ui/babel-plugin`, which tree-shakes `Icon.select({ ios, android })`.
  There's no `babel.config.js` in this repo; don't add one just for this.

### 3.1 SwiftUI components (`@expo/ui/swift-ui`)

All of them accept `modifiers?: ViewModifier[]` and `testID?`.

| Component | Key props |
| --- | --- |
| `Host` | `style, matchContents, alignment, useViewportSizeMeasurement, onLayoutContent, colorScheme: 'light'\|'dark', seedColor (tint), layoutDirection, ignoreSafeArea: 'all'\|'container'\|'keyboard', pointerEvents` |
| `Form` | `children` |
| `List` | `children, selection?: (string\|number)[], onSelectionChange`. `List.ForEach` / `ListForEach`: either `data, keyExtractor, children({item,index}), recycling, overscanCount, estimatedItemSize` or element children, plus `onDelete(indices)` and `onMove(sourceIndices, destination)` |
| `Section` | `title, header (node), footer (node), isExpanded, onIsExpandedChange` |
| `Text` | `children, markdownEnabled, date, dateStyle: 'timer'\|'relative'\|'offset'\|'date'\|'time', timerInterval {lower,upper}, countsDown, pauseTime` |
| `Label` | `title, systemImage, icon (node), color, children` |
| `LabeledContent` | `label (string\|node), children` (a value shown on the trailing side) |
| `Image` | `systemName (SF), assetName, uiImage (uri string), size, color, variableValue, onPress` |
| `Button` | `label, systemImage, role: 'default'\|'cancel'\|'destructive'\|'close', onPress, children (custom label), target` |
| `Toggle` | `isOn, onIsOnChange, label, systemImage, children` |
| `SyncToggle` | `isOn: ObservableState<boolean>, onIsOnChangeSync (worklet), label, systemImage` |
| `Picker` | `selection, onSelectionChange, label, systemImage, children` (options are `<Text modifiers={[tag(value)]}>`; style with `pickerStyle('menu'\|'segmented'\|'inline'\|'wheel'\|'palette'\|'navigationLink'\|'automatic')`) |
| `Slider` | `value, min, max, step, lowerLimit, upperLimit, label, minimumValueLabel, maximumValueLabel, onValueChange, onEditingChanged` |
| `Stepper` | `label (required), value, min, max, step, onValueChange (required)` |
| `DatePicker` | `title, selection: Date, range {start,end}, displayedComponents: ('date'\|'hourAndMinute')[], onDateChange`, plus `datePickerStyle('compact'\|'graphical'\|'wheel')` |
| `ColorPicker` | `selection: string\|null (hex), onSelectionChange(hex), label, supportsOpacity` |
| `TextField` | `text?: ObservableState<string>, placeholder, onTextChange, onFocusChange, onSelectionChange, selection, axis: 'horizontal'\|'vertical', maxLength, autoFocus, ref (setText, clear, focus, blur, setSelection)`. `TextField.Placeholder` |
| `SecureField` | like TextField without selection |
| `ProgressView` | `value (0-1 or null = indeterminate), timerInterval, countsDown, children`, plus `progressViewStyle('linear'\|'circular')` |
| `Gauge` | `value, min, max, currentValueLabel, minimumValueLabel, maximumValueLabel, children`, plus `gaugeStyle('circular'\|'circularCapacity'\|'linear'\|'linearCapacity')` |
| `Chart` | `data: {x, y, color?}[], type: 'line'\|'point'\|'bar'\|'area'\|'pie'\|'rectangle', showGrid, animate, showLegend, referenceLines, lineStyle, pointStyle, areaStyle, barStyle, pieStyle, rectangleStyle, ruleStyle, style` (Swift Charts, good for the stats pages) |
| `ContextMenu` | `.Trigger`, `.Items` (Button, Toggle, Picker, Section, Divider, nested ContextMenu), `.Preview` |
| `Menu` | `label (string\|node), systemImage, onPrimaryAction, children` (opens on tap) |
| `ControlGroup` | `label, systemImage, children` |
| `ConfirmationDialog` | `title, isPresented, onIsPresentedChange, titleVisibility`, `.Trigger/.Actions/.Message` |
| `Alert` | `title, isPresented, onIsPresentedChange`, `.Trigger/.Actions/.Message` |
| `BottomSheet` | `isPresented, onIsPresentedChange, onDismiss, fitToContents, anchor, presentationBackground`, plus `presentationDetents([...])`, `presentationDragIndicator`, `presentationCornerRadius`, `presentationBackgroundInteraction`, `interactiveDismissDisabled`, `presentationSizing` |
| `Popover` | `isPresented, onIsPresentedChange, attachmentAnchor, arrowEdge`, `.Trigger/.Content` |
| `DisclosureGroup` | `label, isExpanded, onIsExpandedChange`, `.Label` |
| `ContentUnavailableView` | `title, systemImage, description` (empty states) |
| `ShareLink` | `item, getItemAsync, subject, message, preview {title,image}, children` |
| `Link` | `destination (url), label, children` |
| `SwipeActions` | wraps a List row: `<SwipeActions>{row}<SwipeActions.Actions edge="leading"\|"trailing" allowsFullSwipe>{Buttons}</SwipeActions.Actions></SwipeActions>` |
| `TabView` / `TabView.Tab` | `selection, defaultSelection, onSelectionChange`; Tab: `value, label, systemImage` |
| `NavigationStack` / `NavigationLink` / `NavigationDestination` / `NavigationSplitView` | SwiftUI-internal navigation (`path, onPathChange`; `value`). Not used with expo-router screens |
| `Toolbar`, `Toolbar.Content`, `ToolbarItem` | `placement: 'automatic'\|'principal'\|'navigation'\|'primaryAction'\|'secondaryAction'\|'status'\|'confirmationAction'\|'cancellationAction'\|'destructiveAction'\|'keyboard'\|'topBarLeading'\|'topBarTrailing'\|'topBarPinnedTrailing'\|'largeTitle'\|'bottomBar'`, `visibilityPriority` (inside a SwiftUI NavigationStack only) |
| `VStack` / `HStack` / `ZStack` | `spacing, alignment, resolvesChildPercentages` |
| `LazyVStack` / `LazyHStack` (+ `.ForEach`) | `spacing, alignment`; ForEach: `data, keyExtractor, children, recycling, overscanCount, estimatedItemSize` |
| `Grid` / `Grid.Row` | `alignment, verticalSpacing, horizontalSpacing` |
| `Group`, `Spacer (minLength)`, `Divider`, `ScrollView (axes, showsIndicators)` | |
| `GlassEffectContainer` | `spacing` (merges children that use `glassEffect`) |
| `Namespace` | `id` (for `matchedGeometryEffect` / `glassEffectId`) |
| `Background` / `Overlay` / `Mask` | `alignment`, with `.Content` slot |
| Shapes | `Rectangle, RoundedRectangle (cornerRadius), Ellipse, Capsule (cornerStyle), Circle, UnevenRoundedRectangle, ConcentricRectangle` |
| `ArrangementView` | `.Primary/.Secondary` |
| `AccessoryWidgetBackground` | for widgets |
| `RNHostView` | `matchContents, onLayout, children` (one RN element) |
| Hooks/utils | `useNativeState(initial)`, `useWorkletCallback`, `withAnimation(Animation.spring(), () => {...})` |

SwiftUI modifiers (`@expo/ui/swift-ui/modifiers`), grouped:

- Layout: `frame({width,height,min*,ideal*,max*,alignment})`, `padding({all|horizontal|vertical|top|...})`, `fixedSize`,
  `containerRelativeFrame`, `offset`, `zIndex`, `layoutPriority`, `aspectRatio`, `ignoreSafeArea`, `alignmentGuide`,
  `gridCell*`, `gridColumnAlignment`
- Style: `background(shapeStyle, shape?)`, `foregroundStyle`, `foregroundColor`, `tint`, `opacity`, `cornerRadius`,
  `clipShape(shape, r?)`, `clipped`, `mask`, `border`, `strokeBorder`, `shadow({radius,x,y,color})`, `overlay`,
  `backgroundOverlay`, `blur`, `brightness`, `contrast`, `saturation`, `grayscale`, `hueRotation`, `colorInvert`,
  `scaleEffect`, `rotationEffect`, `rotation3DEffect`, `luminanceToAlpha`, `resizable`, `containerShape`, `contentShape`,
  `containerBackground`
- **Liquid Glass**: `glassEffect({ glass: { variant: 'regular'|'clear'|'identity', interactive?, tint? }, shape?: 'capsule'|'circle'|'rectangle'|'ellipse'|'roundedRectangle'|'containerRelativeShape', cornerRadius? })`,
  `glassEffectId(id, namespaceId)`, and `buttonStyle('glass' | 'glassProminent')`
- Text: `font({ family, size, weight, design, textStyle })`, `bold`, `italic`, `monospacedDigit`, `lineLimit`, `lineSpacing`,
  `lineHeight`, `multilineTextAlignment`, `truncationMode`, `minimumScaleFactor`, `allowsTightening`, `kerning`, `textCase`,
  `underline`, `strikethrough`, `textSelection`, `contentTransition('numericText')`, `dynamicTypeSize`
- Controls: `buttonStyle('automatic'|'bordered'|'borderedProminent'|'borderless'|'glass'|'glassProminent'|'plain')`,
  `buttonBorderShape`, `controlSize`, `toggleStyle`, `pickerStyle`, `datePickerStyle`, `progressViewStyle`, `gaugeStyle`,
  `menuStyle`, `menuIndicator`, `menuOrder`, `menuActionDismissBehavior`, `labelStyle`, `labelsHidden`, `imageScale`,
  `textFieldStyle`, `symbolEffect`, `badge(value)`, `badgeProminence`, `tag(value)`, `disabled`, `hidden`, `redacted`,
  `privacySensitive`
- Lists/forms: `listStyle('automatic'|'plain'|'inset'|'insetGrouped'|'grouped'|'sidebar')`, `listRowBackground`,
  `listRowSeparator`, `listRowSeparatorTint`, `listRowInsets`, `listRowSpacing`, `listSectionSpacing`,
  `listSectionMargins`, `headerProminence`, `scrollContentBackground('hidden')`, `moveDisabled`, `deleteDisabled`,
  `environment('editMode', 'active')`
- Scroll: `scrollDisabled`, `scrollIndicators`, `scrollDismissesKeyboard`, `scrollClipDisabled`,
  `scrollEdgeEffectStyle`, `scrollTargetBehavior('paging'|'viewAligned')`, `scrollTargetLayout`, `defaultScrollAnchor`,
  `scrollPosition`, `id`, `onScrollPhaseChange`, `useScrollGeometryChange`, `refreshable(async () => {})`
- Events: `onTapGesture`, `onLongPressGesture`, `onAppear`, `onDisappear`, `onGeometryChange`, `onSubmit`
- Input: `keyboardType`, `submitLabel`, `textContentType`, `textInputAutocapitalization`, `autocorrectionDisabled`,
  `searchable(observableText, { placement, prompt, onChange })`, `searchToolbarBehavior`
- Sheets: `presentationDetents(['medium','large',{fraction},{height}])`, `presentationDragIndicator`,
  `presentationCornerRadius`, `presentationBackground`, `presentationBackgroundInteraction`, `interactiveDismissDisabled`,
  `presentationSizing`
- Misc: `preferredColorScheme`, `animation(Animation.spring(), value)`, `matchedGeometryEffect`, `geometryGroup`,
  `accessibility*`, `navigationTitle`, `navigationBarTitleDisplayMode`, `toolbarTitleDisplayMode`, widget modifiers
  (`widgetURL`, `widgetAccentedRenderingMode`, `activityBackgroundTint`)

`ShapeStyle` = color string | `{type:'color'}` | `{type:'hierarchical', style:'secondary'}` |
`{type:'material', material:'ultraThin'|'thin'|'regular'|'thick'|'ultraThick'|'bar'}` | linear/radial/angular gradient.
Named colors: `'primary','secondary','red','orange','yellow','green','blue','purple','pink','white','gray','black','clear','mint','teal','cyan','indigo','brown'`.

### 3.2 Jetpack Compose components (`@expo/ui/jetpack-compose`)

All of them accept `modifiers?: ModifierConfig[]`.

| Component | Key props |
| --- | --- |
| `Host` | `style, matchContents, onLayoutContent, useViewportSizeMeasurement, colorScheme, seedColor (dynamic M3 palette from a seed), colorOverrides: Partial<MaterialColors>, layoutDirection, ignoreSafeAreaKeyboardInsets` |
| `Column` / `Row` | `horizontalArrangement, verticalArrangement ('start'\|'center'\|'spaceBetween'\|…\|{spacedBy:n}), horizontalAlignment, verticalAlignment, resolvesChildPercentages` |
| `Box` | `contentAlignment, floatingToolbarExitAlwaysScrollBehavior` |
| `FlowRow` | `horizontalArrangement, verticalArrangement` |
| `LazyColumn` / `LazyRow` (+ `.Items` / `LazyItems`) | `verticalArrangement / horizontalArrangement, horizontalAlignment / verticalAlignment, contentPadding`; Items: `data, keyExtractor, children, recycling, overscanCount, estimatedItemSize` |
| `Text` | `children, color, style: {typography:'bodyLarge'\|'titleMedium'\|…, fontSize, fontWeight, fontFamily, textAlign, lineHeight, …}, maxLines, minLines, overflow, softWrap` |
| `Button`, `FilledTonalButton`, `OutlinedButton`, `ElevatedButton`, `TextButton` | `onClick, enabled, colors, contentPadding, shape (Shape.*), children` |
| `IconButton`, `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton` | same |
| `ToggleButton`, `IconToggleButton`, `FilledIconToggleButton`, `OutlinedIconToggleButton` | `checked, onCheckedChange, enabled, colors` |
| `Icon` | `source (XML vector drawable or image), tint (null = original colors), size, contentDescription` |
| `Image` | `source, contentScale, alignment, contentDescription, tint, alpha, onLoad, onError` |
| `Switch` | `value, onCheckedChange, enabled, colors`, `Switch.ThumbContent` |
| `SyncSwitch` | `isOn: ObservableState<boolean>, onCheckedChangeSync` |
| `Checkbox` / `TriStateCheckbox` | `value, onCheckedChange` / `state: 'on'\|'off'\|'indeterminate', onClick` |
| `RadioButton` | `selected, onClick, enabled, colors` |
| `Slider` / `VerticalSlider` | `value, min, max, steps, lowerLimit, upperLimit, enabled, colors, onValueChange, onValueChangeFinished`, `.Thumb/.Track` |
| `SingleChoiceSegmentedButtonRow` / `MultiChoiceSegmentedButtonRow` + `SegmentedButton` | button: `selected, onClick` (single) or `checked, onCheckedChange` (multi), `SegmentedButton.Label` |
| `DropdownMenu` + `DropdownMenuItem` | `expanded, onDismissRequest, color, cornerRadius, shadowElevation, properties`, `.Trigger/.Items`; item: `onClick, enabled, elementColors`, `.Text/.LeadingIcon/.TrailingIcon` |
| `ExposedDropdownMenuBox` + `ExposedDropdownMenu` | `expanded, onExpandedChange` (M3 select field; use with a TextField and the `menuAnchor()` modifier) |
| `ListItem` | `colors, tonalElevation, shadowElevation`, slots `.HeadlineContent/.SupportingContent/.OverlineContent/.LeadingContent/.TrailingContent` |
| `Card`, `ElevatedCard`, `OutlinedCard` | `colors, elevation, border` |
| `Surface` | `color, contentColor, tonalElevation, shadowElevation, shape, border, onClick, selected, checked, onCheckedChange` |
| `AssistChip`, `FilterChip (selected)`, `InputChip`, `SuggestionChip` | `onClick, enabled, colors, border`, with `.Label/.LeadingIcon/.TrailingIcon/.Avatar/.Icon` slots (good for genre/tag filters) |
| `Badge`, `BadgedBox` (`.Badge`) | |
| `HorizontalDivider`, `VerticalDivider` | `thickness, color` |
| `Spacer` | modifiers only (`weight`, `height`, …) |
| `LinearProgressIndicator`, `CircularProgressIndicator`, `LinearWavyProgressIndicator`, `CircularWavyProgressIndicator` | `progress (null = indeterminate), color, trackColor, strokeCap, gapSize` |
| `LoadingIndicator`, `ContainedLoadingIndicator` | M3 Expressive shape-morph loader, `progress?: ObservableState` |
| `PullToRefreshBox` | `isRefreshing, onRefresh, contentAlignment, indicator` |
| `ModalBottomSheet` | `onDismissRequest (required), skipPartiallyExpanded, initialFullyExpanded, containerColor, contentColor, scrimColor, showDragHandle, sheetGesturesEnabled, properties, ref (hide, expand, partialExpand)`, `.DragHandle` |
| `AlertDialog` (`.Title/.Text/.ConfirmButton/.DismissButton/.Icon`), `BasicAlertDialog` | `onDismissRequest, colors, tonalElevation, properties` |
| `DateTimePicker`, `DateRangePicker`, `DatePickerDialog`, `DateRangePickerDialog`, `TimePickerDialog` | `initialDate (ISO), onDateSelected, variant: 'picker'\|'input', displayedComponents: 'date'\|'hourAndMinute'\|'dateAndTime', is24Hour, selectableDates, color, elementColors` |
| `TopAppBar` | `colors, windowInsets`, `.Title/.NavigationIcon/.Actions` |
| `NavigationBar` + `NavigationBarItem` | `selected, onClick, alwaysShowLabel, colors`, `.Icon/.SelectedIcon/.Label` |
| `FloatingActionButton`, `SmallFloatingActionButton`, `LargeFloatingActionButton`, `ExtendedFloatingActionButton (expanded)` | `onClick, containerColor`, `.Icon/.Text` |
| `HorizontalFloatingToolbar` | `variant: 'standard'\|'vibrant', colors`, `.FloatingActionButton` (M3 Expressive toolbar) |
| `SearchBar` (`.Placeholder`, `.ExpandedFullScreenSearchBar`), `DockedSearchBar` (`.Placeholder`, `.LeadingIcon`) | `onSearch` / `onQueryChange` |
| `TextField`, `OutlinedTextField`, `BasicTextField` | text, keyboard options, colors (see `TextField/shared.d.ts`) |
| `HorizontalPager` | `initialPage, onCurrentPageChange, onSettledPageChange, pageSpacing, contentPadding, ref (animateScrollToPage, scrollToPage)` |
| `HorizontalCenteredHeroCarousel`, `HorizontalMultiBrowseCarousel`, `HorizontalUncontainedCarousel` | M3 carousels (trending banners) |
| `Snackbar`, `SnackbarHost (ref.showSnackbar({message, actionLabel, duration}))` | |
| `TooltipBox` (`.PlainTooltip`, `.RichTooltip`) | |
| `AnimatedVisibility` | `visible, enterTransition (EnterTransition.fadeIn().plus(...)), exitTransition` |
| `Shape.*` | `Star, PillStar, Pill, Circle, Rectangle, Polygon, RoundedCorner` (for `shape` props) |
| `CompositionLocalProvider` | `values: { minimumInteractiveComponentSize }` |
| `RNHostView` | embed RN |
| Colors | `useMaterialColors({ seedColor, colorScheme })`, `getMaterialColors`, `isDynamicColorAvailable` |

Compose modifiers (`@expo/ui/jetpack-compose/modifiers`): `paddingAll(n)`, `padding(start, top, end, bottom)`,
`size(w, h)`, `width`, `height`, `fillMaxSize(f?)`, `fillMaxWidth(f?)`, `fillMaxHeight(f?)`, `defaultMinSize`,
`wrapContentWidth/Height`, `weight(n)`, `align(alignment)`, `matchParentSize`, `offset(x, y)`, `imePadding()`,
`background(color)`, `border(w, color)`, `shadow(elev)`, `dropShadow(shape, cfg)`, `innerShadow`, `alpha`, `blur`,
`cornerRadius`, `clip(Shapes.RoundedCorner(12))`, `maskClip`, `rotate`, `graphicsLayer({...})`, `zIndex`,
`animateContentSize()`, `clickable(fn, { indication })`, `combinedClickable({ onClick, onLongClick })`,
`selectable(selected, fn, role)`, `selectableGroup()`, `toggleable(value, fn, { role })`, `onVisibilityChanged`,
`onSizeChanged`, `onGloballyPositioned`, `verticalScroll()`, `horizontalScroll()`, `menuAnchor()`, `testID`, `semantics`.
For animation, use `animated, spring, tween, snap, keyframes`. `Shapes` contains `Rectangle`, `Circle`,
`RoundedCorner(r)`, `CutCorner(r)`, and `Material.*` (Cookie4Sided, Pill, Heart, Sunny, …).

### 3.3 Universal components (`@expo/ui`)

Use them where one tree is fine on both platforms:

```tsx
import { Host, FieldGroup, Switch, Picker, ListItem, Icon } from '@expo/ui';

const BELL = Icon.select({ ios: 'bell', android: import('@expo/material-symbols/notifications.xml') });

<Host style={{ flex: 1 }}>
  <FieldGroup>
    <FieldGroup.Section title="Notifications">
      <Switch label="Airing episodes" value={airing} onValueChange={setAiring} />
      <ListItem leading={<Icon name={BELL} size={20} />} supportingText="Likes, replies, follows" onPress={open}>
        Activity
      </ListItem>
      <Picker selectedValue={feed} onValueChange={setFeed} appearance="menu">
        <Picker.Item label="Following" value="following" />
        <Picker.Item label="Global" value="global" />
      </Picker>
    </FieldGroup.Section>
  </FieldGroup>
</Host>
```

Universal props: `Switch {value, onValueChange, label, disabled}`, `Picker {selectedValue, onValueChange, appearance: 'wheel'|'menu', enabled}`
plus `Picker.Item {label, value}`, `ListItem {children, onPress, leading, trailing, supportingText, colors}`,
`FieldGroup.Section {title, titleUppercase}`, `FieldGroup.SectionHeader/SectionFooter`,
`BottomSheet {isPresented, onDismiss, snapPoints: ('half'|'full'|{fraction}|{height})[], showDragIndicator, contentPadding, containerColor}`,
`Icon {name: SF | ImageSource | {ios, android}, size, color}`, and `List {children, onRefresh}` with `List.ForEach`.
`@expo/material-symbols` must be installed before `import('@expo/material-symbols/*.xml')` resolves.

### 3.4 Native Settings screen: one component, `.ios.tsx` and `.android.tsx`

Metro resolves `settings-form.ios.tsx` / `settings-form.android.tsx` / `settings-form.tsx` (web fallback) from one import.
Keep all state in one zustand store persisted with MMKV, and keep the platform files presentation-only.

```ts
// src/components/settings/types.ts
export type ThemeMode = 'system' | 'light' | 'dark' | 'amoled';
export type MediaType = 'ANIME' | 'MANGA';
export type TitleLanguage = 'ROMAJI' | 'ENGLISH' | 'NATIVE';
export type SettingsFormProps = {
  theme: ThemeMode; setTheme(v: ThemeMode): void;
  accent: string; setAccent(hex: string): void;
  defaultMedia: MediaType; setDefaultMedia(v: MediaType): void;
  defaultTab: 'lists' | 'explore' | 'profile'; setDefaultTab(v: SettingsFormProps['defaultTab']): void;
  titleLanguage: TitleLanguage; setTitleLanguage(v: TitleLanguage): void;
  blurAdult: boolean; setBlurAdult(v: boolean): void;
  haptics: boolean; setHaptics(v: boolean): void;
  airingNotifications: boolean; setAiringNotifications(v: boolean): void;
  onSignOut(): void;
};
```

```tsx
// src/app/settings/index.tsx  (route: keep it thin)
import { Stack } from 'expo-router';
import { SettingsForm } from '@/components/settings/settings-form';
import { useSettingsFormProps } from '@/components/settings/use-settings-form-props';

export default function SettingsScreen() {
  const props = useSettingsFormProps();
  return (
    <>
      <Stack.Title large>Settings</Stack.Title>
      <SettingsForm {...props} />
    </>
  );
}
```

```tsx
// src/components/settings/settings-form.ios.tsx
import {
  Host, Form, Section, Toggle, Picker, Text, ColorPicker, Button, LabeledContent, Label,
} from '@expo/ui/swift-ui';
import { pickerStyle, tag, tint, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import type { SettingsFormProps } from './types';

export function SettingsForm(p: SettingsFormProps) {
  return (
    <Host style={{ flex: 1 }} seedColor={p.accent}>
      <Form>
        <Section title="Appearance">
          <Picker label="Theme" systemImage="circle.lefthalf.filled" selection={p.theme}
            onSelectionChange={p.setTheme} modifiers={[pickerStyle('menu')]}>
            <Text modifiers={[tag('system')]}>System</Text>
            <Text modifiers={[tag('light')]}>Light</Text>
            <Text modifiers={[tag('dark')]}>Dark</Text>
            <Text modifiers={[tag('amoled')]}>AMOLED</Text>
          </Picker>
          <ColorPicker label="Accent color" selection={p.accent} onSelectionChange={p.setAccent} />
          <Picker label="Title language" selection={p.titleLanguage} onSelectionChange={p.setTitleLanguage}
            modifiers={[pickerStyle('menu')]}>
            <Text modifiers={[tag('ROMAJI')]}>Romaji</Text>
            <Text modifiers={[tag('ENGLISH')]}>English</Text>
            <Text modifiers={[tag('NATIVE')]}>Native</Text>
          </Picker>
        </Section>

        <Section title="General" footer={<Text>Applies the next time the app launches.</Text>}>
          <Picker label="Default media" selection={p.defaultMedia} onSelectionChange={p.setDefaultMedia}
            modifiers={[pickerStyle('segmented')]}>
            <Text modifiers={[tag('ANIME')]}>Anime</Text>
            <Text modifiers={[tag('MANGA')]}>Manga</Text>
          </Picker>
          <Picker label="Default tab" selection={p.defaultTab} onSelectionChange={p.setDefaultTab}
            modifiers={[pickerStyle('menu')]}>
            <Text modifiers={[tag('lists')]}>My Lists</Text>
            <Text modifiers={[tag('explore')]}>Explore</Text>
            <Text modifiers={[tag('profile')]}>Profile</Text>
          </Picker>
          <Toggle label="Blur 18+ content" systemImage="eye.slash" isOn={p.blurAdult} onIsOnChange={p.setBlurAdult} />
          <Toggle label="Haptics" systemImage="iphone.radiowaves.left.and.right" isOn={p.haptics} onIsOnChange={p.setHaptics} />
        </Section>

        <Section title="Notifications">
          <Toggle label="Airing episodes" systemImage="bell.badge" isOn={p.airingNotifications}
            onIsOnChange={p.setAiringNotifications} />
        </Section>

        <Section>
          <LabeledContent label="Version"><Text>1.0.0</Text></LabeledContent>
          <Button label="Sign out" role="destructive" onPress={p.onSignOut} />
        </Section>
      </Form>
    </Host>
  );
}
```

On iOS 26, `Form` inside a `Stack` screen with a large title collapses natively because the SwiftUI scroll view is the
first child. If the title doesn't collapse, keep `Host` as the screen's only root element.

```tsx
// src/components/settings/settings-form.android.tsx
import { useState } from 'react';
import {
  Host, LazyColumn, ListItem, Text, Switch, DropdownMenu, DropdownMenuItem, TextButton,
  SingleChoiceSegmentedButtonRow, SegmentedButton, HorizontalDivider, useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { clickable, paddingAll, padding, fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useColorScheme } from 'react-native';
import type { SettingsFormProps, ThemeMode } from './types';

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' }, { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }, { value: 'amoled', label: 'AMOLED' },
];

function Header({ children }: { children: string }) {
  const c = useMaterialColors();
  return (
    <Text color={c.primary} style={{ typography: 'titleSmall' }} modifiers={[padding(16, 24, 16, 8)]}>
      {children}
    </Text>
  );
}

function SwitchRow(props: { title: string; subtitle?: string; value: boolean; onChange(v: boolean): void }) {
  return (
    <ListItem modifiers={[clickable(() => props.onChange(!props.value))]}>
      <ListItem.HeadlineContent><Text>{props.title}</Text></ListItem.HeadlineContent>
      {props.subtitle ? (
        <ListItem.SupportingContent><Text>{props.subtitle}</Text></ListItem.SupportingContent>
      ) : null}
      <ListItem.TrailingContent>
        <Switch value={props.value} onCheckedChange={props.onChange} />
      </ListItem.TrailingContent>
    </ListItem>
  );
}

function MenuRow<T extends string>(props: {
  title: string; value: T; options: { value: T; label: string }[]; onChange(v: T): void;
}) {
  const [open, setOpen] = useState(false);
  const current = props.options.find((o) => o.value === props.value)?.label ?? '';
  return (
    <ListItem modifiers={[clickable(() => setOpen(true))]}>
      <ListItem.HeadlineContent><Text>{props.title}</Text></ListItem.HeadlineContent>
      <ListItem.SupportingContent><Text>{current}</Text></ListItem.SupportingContent>
      <ListItem.TrailingContent>
        <DropdownMenu expanded={open} onDismissRequest={() => setOpen(false)}>
          <DropdownMenu.Trigger>
            <TextButton onClick={() => setOpen(true)}><Text>Change</Text></TextButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {props.options.map((o) => (
              <DropdownMenuItem key={o.value} onClick={() => { props.onChange(o.value); setOpen(false); }}>
                <DropdownMenuItem.Text><Text>{o.label}</Text></DropdownMenuItem.Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </ListItem.TrailingContent>
    </ListItem>
  );
}

export function SettingsForm(p: SettingsFormProps) {
  const scheme = useColorScheme(); // React Compiler: keeps Host colors reactive to system theme
  return (
    <Host style={{ flex: 1 }} seedColor={p.accent} colorScheme={scheme}>
      <LazyColumn>
        <Header>Appearance</Header>
        <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth(), paddingAll(16)]}>
          {THEMES.map((t) => (
            <SegmentedButton key={t.value} selected={p.theme === t.value} onClick={() => p.setTheme(t.value)}>
              <SegmentedButton.Label><Text>{t.label}</Text></SegmentedButton.Label>
            </SegmentedButton>
          ))}
        </SingleChoiceSegmentedButtonRow>
        <MenuRow title="Title language" value={p.titleLanguage} onChange={p.setTitleLanguage}
          options={[{ value: 'ROMAJI', label: 'Romaji' }, { value: 'ENGLISH', label: 'English' }, { value: 'NATIVE', label: 'Native' }]} />
        {/* Accent: Compose has no color picker in expo-ui. Use a FlowRow of Surface swatches (onClick) */}

        <HorizontalDivider />
        <Header>General</Header>
        <MenuRow title="Default media" value={p.defaultMedia} onChange={p.setDefaultMedia}
          options={[{ value: 'ANIME', label: 'Anime' }, { value: 'MANGA', label: 'Manga' }]} />
        <MenuRow title="Default tab" value={p.defaultTab} onChange={p.setDefaultTab}
          options={[{ value: 'lists', label: 'My Lists' }, { value: 'explore', label: 'Explore' }, { value: 'profile', label: 'Profile' }]} />
        <SwitchRow title="Blur 18+ content" value={p.blurAdult} onChange={p.setBlurAdult} />
        <SwitchRow title="Vibration" value={p.haptics} onChange={p.setHaptics} />

        <HorizontalDivider />
        <Header>Notifications</Header>
        <SwitchRow title="Airing episodes" subtitle="Local reminder when a new episode airs"
          value={p.airingNotifications} onChange={p.setAiringNotifications} />

        <HorizontalDivider />
        <ListItem modifiers={[clickable(p.onSignOut)]}>
          <ListItem.HeadlineContent><Text color="#B3261E">Sign out</Text></ListItem.HeadlineContent>
        </ListItem>
      </LazyColumn>
    </Host>
  );
}
```

```tsx
// src/components/settings/settings-form.tsx  (web fallback, or reuse the universal @expo/ui tier)
export { SettingsForm } from './settings-form.universal';
```

For the accent swatches on Android:
`<FlowRow horizontalArrangement={{ spacedBy: 12 }}>{colors.map(c => <Surface key={c} color={c} shape={Shape.Circle({ radius: 1 })} onClick={() => p.setAccent(c)} selected={c === p.accent} modifiers={[size(40, 40)]} />)}</FlowRow>`.
Check `Shape.Circle`'s `radius` semantics in `Shape/index.d.ts` before relying on it.

### 3.5 List rows with swipe gestures (My Lists)

- **For RN lists (recommended for My Lists, because rows have images and progress, and the list may need list or grid
  mode)**: use `react-native-gesture-handler/ReanimatedSwipeable` with configurable left and right actions. It's
  cross-platform and settings-driven.

  ```tsx
  import ReanimatedSwipeable, { type SwipeableMethods, SwipeDirection } from 'react-native-gesture-handler/ReanimatedSwipeable';
  // props: renderLeftActions(progress, translation, methods), renderRightActions, leftThreshold, rightThreshold,
  // friction, overshootLeft/Right, onSwipeableWillOpen(direction), onSwipeableOpen(direction), ref.close()/openLeft()/openRight()/reset()
  <ReanimatedSwipeable
    ref={ref}
    friction={2}
    leftThreshold={80}
    rightThreshold={80}
    renderLeftActions={() => <SwipeAction icon="plus" color={accent} />}      // swipe right
    renderRightActions={() => <SwipeAction icon="trash" color="#ff3b30" />}  // swipe left
    onSwipeableWillOpen={(dir) => {
      haptics.increment(); // import { haptics } from '@/lib/haptics' (honours the Vibration setting)
      // dir === SwipeDirection.RIGHT means the row moved right (left actions opened, the user swiped right).
      // Verified in RNGH 3 source: toValue > 0 ? RIGHT : LEFT. Qaraq wraps this in SwipeableMediaRow.
      // Qaraq settings shape: settings.swipe.{right,left}.{primary,secondary} (src/settings/types.ts)
      runConfiguredAction(dir === SwipeDirection.RIGHT ? swipe.right : swipe.left, entry); // settings.swipe[type].{right,left}
      ref.current?.close();
    }}>
    <EntryRow entry={entry} />
  </ReanimatedSwipeable>
  ```

  The root layout must be wrapped in `GestureHandlerRootView` (from `react-native-gesture-handler`) with `style={{ flex: 1 }}`.
- **iOS-only SwiftUI list**: `List` + `List.ForEach` + `SwipeActions` gives native full-swipe actions, plus `onDelete`/`onMove`.

  ```tsx
  <Host style={{ flex: 1 }}>
    <List modifiers={[listStyle('plain')]}>
      <List.ForEach data={entries} keyExtractor={(e) => String(e.id)} onDelete={(idx) => remove(idx)}>
        {({ item }) => (
          <SwipeActions>
            <HStack spacing={12}><Text>{item.title}</Text><Spacer /><Text>{item.progress}</Text></HStack>
            <SwipeActions.Actions edge="leading" allowsFullSwipe>
              <Button label="+1" systemImage="plus" onPress={() => increment(item)} modifiers={[tint('green')]} />
            </SwipeActions.Actions>
            <SwipeActions.Actions edge="trailing">
              <Button label="Delete" systemImage="trash" role="destructive" onPress={() => remove(item)} />
            </SwipeActions.Actions>
          </SwipeActions>
        )}
      </List.ForEach>
    </List>
  </Host>
  ```

### 3.6 `useNativeState` and sync controls

`useNativeState<T>(initial)` returns `ObservableState<T>`, a SharedObject that both JS and native read. Use `.get()` and
`.set(v)` (React Compiler compliant) instead of `.value`. Assign a worklet to `state.onChange` in a `useEffect` to observe
changes on the UI thread. It's needed by `TextField.text`, `SyncToggle`, `SyncSwitch`, `searchable`, `symbolEffect`, and
`LoadingIndicator.progress`.

---

## 4. `expo-glass-effect`

```ts
import { GlassView, GlassContainer, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from 'expo-glass-effect';
```

| API | Signature |
| --- | --- |
| `GlassView` | `ViewProps & { glassEffectStyle?: 'regular' \| 'clear' \| 'none' \| { style, animate?, animationDuration? (s) }; tintColor?: ColorValue; isInteractive?: boolean; colorScheme?: 'auto' \| 'light' \| 'dark'; ref }` |
| `GlassContainer` | `ViewProps & { spacing?: number }` (children GlassViews merge within `spacing`) |
| `isLiquidGlassAvailable()` | `boolean`. Checks that the components are available (iOS 26 SDK and runtime, and no `UIDesignRequiresCompatibility`). Returns `false` on Android and web |
| `isGlassEffectAPIAvailable()` | `boolean`, iOS. Guards against early iOS 26 betas that crash |

Behavior and fallbacks:

- On Android, web, and iOS < 26, `GlassView` and `GlassContainer` render a **plain `View`** with your props, so you must
  supply the fallback look (background color, border, and so on) yourself.
- Don't set opacity < 1 on a `GlassView` or its parents; the glass stops rendering. To fade it, animate a wrapper's opacity
  and switch `glassEffectStyle` to `'none'`.
- If the user turned on Reduce Transparency, `isLiquidGlassAvailable()` is still `true`. Check
  `AccessibilityInfo.isReduceTransparencyEnabled()`.
- `expo-blur` is **not installed**. If you want a blur fallback on iOS < 26 or Android 12+, add it with
  `bunx expo install expo-blur`. Otherwise use a translucent `backgroundColor`.

```tsx
// src/components/ui/glass-surface.tsx
import { AccessibilityInfo, Platform, View, type ViewProps } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useColors } from '@/theme';

const CAN_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export function GlassSurface({ style, interactive, tint, ...rest }: ViewProps & { interactive?: boolean; tint?: string }) {
  const colors = useColors();
  if (CAN_GLASS) {
    return <GlassView glassEffectStyle="regular" isInteractive={interactive} tintColor={tint} style={[{ borderRadius: 20 }, style]} {...rest} />;
  }
  return (
    <View
      style={[{ borderRadius: 20, backgroundColor: colors.barBackground, borderWidth: Platform.OS === 'ios' ? 0.5 : 0, borderColor: '#8883' }, style]}
      {...rest}
    />
  );
}
```

Inside SwiftUI trees, prefer the `glassEffect()` modifier, `GlassEffectContainer`, and `buttonStyle('glass' | 'glassProminent')`:

```tsx
<Host matchContents>
  <GlassEffectContainer spacing={8}>
    <HStack spacing={8}>
      <Button systemImage="minus" onPress={dec} modifiers={[buttonStyle('glass')]} />
      <Text modifiers={[padding({ horizontal: 12 }), glassEffect({ glass: { variant: 'regular' }, shape: 'capsule' })]}>{`${progress}/${total}`}</Text>
      <Button systemImage="plus" onPress={inc} modifiers={[buttonStyle('glassProminent')]} />
    </HStack>
  </GlassEffectContainer>
</Host>
```

---

## 5. Local Expo modules (Swift + Kotlin)

Use one only for things expo-ui and Expo SDK packages don't cover.

```sh
bunx create-expo-module@latest --local --name qaraq-native --platform apple --platform android --features View,ViewEvent,AsyncFunction
# or: bun create expo-module --local
```

That creates `modules/qaraq-native/{ios,android,src,expo-module.config.json}`. Autolinking finds `modules/*`
automatically (or `expo.autolinking.nativeModulesDir` in package.json). Rebuild the dev client after native changes. Import
from the module's `src` files (no barrel unless you pass `--barrel`).

### 5.1 UIKit or Android View (classic)

```swift
// modules/qaraq-native/ios/QaraqNativeModule.swift
import ExpoModulesCore

public class QaraqNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("QaraqNative")
    AsyncFunction("setAppIconBadge") { (count: Int) in /* ... */ }
    View(ScoreRingView.self) {
      Events("onPress")
      Prop("score") { (view: ScoreRingView, score: Double) in view.score = score }
    }
  }
}

class ScoreRingView: ExpoView {
  let onPress = EventDispatcher()
  var score: Double = 0 { didSet { setNeedsDisplay() } }
  required init(appContext: AppContext? = nil) { super.init(appContext: appContext); clipsToBounds = true }
}
```

```kotlin
// modules/qaraq-native/android/src/main/java/expo/modules/qaraqnative/QaraqNativeModule.kt
class QaraqNativeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("QaraqNative")
    View(ScoreRingView::class) {
      Events("onPress")
      Prop("score") { view: ScoreRingView, score: Double -> view.score = score }
    }
  }
}
class ScoreRingView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onPress by EventDispatcher()
  var score = 0.0
}
```

```tsx
// modules/qaraq-native/src/ScoreRingView.tsx
import { requireNativeView } from 'expo'; // alias of requireNativeViewManager
import type { ViewProps } from 'react-native';
type Props = ViewProps & { score: number; onPress?: (e: { nativeEvent: {} }) => void };
const Native = requireNativeView<Props>('QaraqNative'); // or ('QaraqNative', 'ScoreRingView') when the module has several views
export default function ScoreRingView(props: Props) { return <Native {...props} />; }
```

### 5.2 SwiftUI view in a local module (same mechanism @expo/ui uses)

`ExpoModulesCore` exposes `ExpoSwiftUI.View` (protocol `ExpoSwiftUIView<Props>`) and `ExpoSwiftUI.ViewProps`:

```swift
import SwiftUI
import ExpoModulesCore

final class ScoreRingProps: ExpoSwiftUI.ViewProps {
  @Field var score: Double = 0
  @Field var color: Color = .accentColor
  var onPress = EventDispatcher()
}

struct ScoreRing: ExpoSwiftUI.View {
  @ObservedObject var props: ScoreRingProps
  init(props: ScoreRingProps) { self.props = props }
  var body: some View {
    Gauge(value: props.score, in: 0...100) { EmptyView() }
      .gaugeStyle(.accessoryCircularCapacity)
      .tint(props.color)
      .onTapGesture { props.onPress() }
  }
}

// in definition():  View(ScoreRing.self)
```

### 5.3 Compose view in a local module

`ExpoModulesCore` (compose source set) provides `ComposeProps` and a DSL:
`View<Props>("Name") { val onX by Event<T>(); Content { props -> ... } }`.

```kotlin
data class ScoreRingProps(val score: Double = 0.0) : ComposeProps

// in definition():
View<ScoreRingProps>("ScoreRingView") {
  val onPress by Event<Unit>()
  Content { props ->
    CircularProgressIndicator(progress = { (props.score / 100).toFloat() }, modifier = Modifier.clickable { onPress(Unit) })
  }
}
```

The DSL is new. Read `node_modules/expo-modules-core/android/src/compose/expo/modules/kotlin/views/ModuleDefinitionBuilderComposeExtension.kt`
and `node_modules/@expo/ui/android/src/main/java/expo/modules/ui/*.kt` for working examples before writing one. The
module's `android/build.gradle` must enable Compose (copy what `@expo/ui/android/build.gradle` does).

### 5.4 Home-screen widgets and Live Activities

- **`expo-widgets` is first-party in SDK 58 and should be the first choice.** It's not installed:
  `bunx expo install expo-widgets`. It supports iOS widgets (SwiftUI via `@expo/ui/swift-ui`), Live Activities, and opt-in
  Android widgets (Compose subset).
  - Config plugin `["expo-widgets", { groupIdentifier, enableAndroid, widgets: [{ name, displayName, description, ios: { supportedFamilies: ['systemSmall','systemMedium','accessoryRectangular'] }, android: { minWidth, minHeight } }] }]`.
  - Code: `createWidget('Airing', (props, env) => { 'widget'; return <VStack>…</VStack>; }, initialProps)` and then
    `Airing.updateSnapshot(props)`, `updateTimeline(entries)` (iOS), and `reload()`.
  - `createLiveActivity(name, component)` returns `.start(props, url?)`. Use `addUserInteractionListener` for button taps.
  - Widget functions run in an isolated runtime: no hooks, imports, async work, or RN components, only expo-ui components and
    props. Interactive buttons need iOS 17+.
  - Ideal for an "Up next / airing today" widget fed from the list cache.
- `@bacons/apple-targets` (Evan Bacon's config plugin) is an option for other Apple extension types, such as notification
  service or share extensions. Its SDK 58 compatibility is **unverified**. Check its README and CNG support before adding it.
  You can also write a small custom config plugin.

---

## 6. Notifications, background tasks, and haptics

### 6.1 `expo-notifications` (58.1.6): local airing notifications

The plugin is in `app.json` as `["expo-notifications", { "enableRemoteNotifications": false }]` (local-only; add an `icon`/`color` once a monochrome notification icon asset exists). Set `enableRemoteNotifications: false` if you only need local
notifications on iOS; that skips the `aps-environment` entitlement.

```json
["expo-notifications", { "icon": "./assets/images/notification-icon.png", "color": "#3DB4F2", "defaultChannel": "airing", "enableRemoteNotifications": false }]
```

```ts
// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Call once at module scope (for example in src/app/_layout.tsx).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationSetup() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('airing', {
      name: 'Airing episodes',
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('activity', {
      name: 'AniList activity',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleAiring(entry: { mediaId: number; episode: number; airingAt: number; title: string; cover?: string }) {
  const id = `airing-${entry.mediaId}-${entry.episode}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: entry.title,
      body: `Episode ${entry.episode} is out`,
      data: { url: `qaraq://media/${entry.mediaId}` },
      threadIdentifier: `media-${entry.mediaId}`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: entry.airingAt * 1000,  // Date | number (ms)
      channelId: 'airing',
      // delivery: 'alarmClock'     // Android only; needs SCHEDULE_EXACT_ALARM, otherwise falls back to 'bestEffort'
    },
  });
}

// Tap handling: deep-link with expo-router
// const sub = Notifications.addNotificationResponseReceivedListener(r => router.push(r.notification.request.content.data.url as Href));
// Or use the hook: const last = Notifications.useLastNotificationResponse();
```

API surface (from `build/index.d.ts`): `scheduleNotificationAsync`, `cancelScheduledNotificationAsync`,
`cancelAllScheduledNotificationsAsync`, `getAllScheduledNotificationsAsync`, `getNextTriggerDateAsync`,
`setNotificationHandler`, `addNotificationReceivedListener`, `addNotificationResponseReceivedListener`,
`getLastNotificationResponse(Async)`, `clearLastNotificationResponse(Async)`, `useLastNotificationResponse`,
`get/requestPermissionsAsync`, `get/requestExactAlarmPermissionsAsync` (Android), `set/get/deleteNotificationChannelAsync`
and channel groups, `setNotificationCategoryAsync` (action buttons), `get/setBadgeCountAsync`,
`getPresentedNotificationsAsync`, `dismissNotificationAsync`, `dismissAllNotificationsAsync`, `getExpoPushTokenAsync`,
`getDevicePushTokenAsync`, and `registerTaskAsync` (background remote notifications).

Trigger types (`SchedulableTriggerInputTypes`): `DATE {date, channelId?, delivery?}`,
`TIME_INTERVAL {seconds, repeats?}`, `DAILY {hour, minute}`, `WEEKLY {weekday, hour, minute}`,
`MONTHLY {day, hour, minute}`, `YEARLY {month, day, hour, minute}`, and `CALENDAR {...dateComponents, repeats}` (iOS).
`null` means immediate.

iOS keeps at most **64** pending local notifications. Schedule only the next N airings, sorted by time, and re-plan from
the background task.

### 6.2 `expo-background-task` + `expo-task-manager`

It uses BGTaskScheduler on iOS and WorkManager on Android. The config plugin (already in app.json) adds
`UIBackgroundModes: processing` and the permitted identifier `com.expo.modules.backgroundtask.processing`.

> Qaraq's real implementation: the task is defined in `src/lib/notifications.ts`, its data sources are injected in
> `src/lib/background.ts` (which also awaits `bootstrapAuth()` because a headless run has no token loaded), and
> `src/app/_layout.tsx` imports `@/lib/background` first. The snippet below is the generic pattern.

```ts
// Generic pattern. Import the defining module from the root layout at module scope.
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

export const SYNC_TASK = 'qaraq-sync';

// Must run at module load (global scope), not in a component: in a background launch nothing is mounted.
TaskManager.defineTask(SYNC_TASK, async () => {
  try {
    await refreshAiringScheduleAndReschedule(); // fetch AniList airing for CURRENT entries, then scheduleAiring()
    await pollAniListNotifications();           // compare unreadNotificationCount, post a local notification
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerSync() {
  const status = await BackgroundTask.getStatusAsync(); // Restricted = 1, Available = 2
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (!(await TaskManager.isTaskRegisteredAsync(SYNC_TASK))) {
    await BackgroundTask.registerTaskAsync(SYNC_TASK, { minimumInterval: 60 }); // minutes, minimum 15, default 12h
  }
}
// BackgroundTask.unregisterTaskAsync(name), BackgroundTask.addExpirationListener(cb)
// Dev only: BackgroundTask.triggerTaskWorkerForTestingAsync()
```

The schedule isn't exact. iOS often runs tasks overnight or while charging. Don't rely on it for to-the-minute airing
alerts; use scheduled local notifications for those and the task only to re-plan them. Background tasks don't run in
Expo Go or on the iOS simulator in a reliable way.

### 6.3 `expo-haptics`

```ts
import * as Haptics from 'expo-haptics';
Haptics.selectionAsync();                                          // picker or segment changes, swipe threshold crossed
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);            // Light | Medium | Heavy | Soft | Rigid
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Success | Warning | Error
Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);  // Android-only, no VIBRATE permission needed:
// Confirm, Reject, Gesture_Start, Gesture_End, Toggle_On, Toggle_Off, Clock_Tick, Context_Click, Drag_Start,
// Keyboard_Tap, Keyboard_Press, Keyboard_Release, Long_Press, Virtual_Key, Virtual_Key_Release, No_Haptics,
// Segment_Tick, Segment_Frequent_Tick, Text_Handle_Move
```

Don't call `expo-haptics` directly from screens: Qaraq's wrapper `haptics` in `src/lib/haptics.ts` already honours the
Vibration setting (`settings.haptics.enabled` + `intensity`; note `haptics` is an object, not a boolean):

```ts
import { haptics } from '@/lib/haptics';
haptics.selection(); haptics.increment(); haptics.success(); haptics.destructive();
```

---

## 7. Gotchas

### React Compiler (`experiments.reactCompiler: true`)

- Components and hooks are auto-memoized, so **don't mutate values during render**, and don't read `ref.current` in render.
- expo-ui `ObservableState`: use `.get()` / `.set()`. Reanimated 4 shared values: use `.get()` / `.set()` instead of `.value`
  inside components. Both are designed to be compiler-compliant.
- `PlatformColor` / `Color.android.dynamic.*` / Material You colors: also call `useColorScheme()` in that component so it
  re-renders on theme change. Otherwise the compiler can keep a stale memoized value.
- Zustand: select narrow slices (`useSetting('haptics')`). Qaraq's `useSettings(selector)` already wraps the selector in
  `useShallow`, so returning a small object from it is fine; raw `useSettingsStore(selector)` is not.
- Avoid modules with side effects in render. Call `TaskManager.defineTask` and `Notifications.setNotificationHandler` at
  module scope.
- To opt a file or function out, add the `'use no memo'` directive.

### Typed routes (`experiments.typedRoutes: true`)

- `Href` is generated into `.expo/types/router.d.ts` (included by tsconfig) when the dev server runs (`bunx expo start`).
  Until it exists, `bunx tsc --noEmit` may report route string errors. Run the dev server once, or `bunx expo customize tsconfig.json`.
  `expo-env.d.ts` (gitignored) has been created by the integrator so CSS-module/asset types resolve; the dev server
  regenerates it.
- Dynamic routes: `router.push({ pathname: '/media/[id]', params: { id: String(id) } })` or a template literal
  `` router.push(`/media/${id}`) ``. Both type-check.
- Group segments like `(lists)` are part of the file path but optional in hrefs (`/` resolves to the first group's index).
- Route files under `src/app/` must default-export a component. Keep components, hooks, and stores outside `src/app/`.

### Other

- Expo UI only works in a development build. In Expo Go, expo-ui SwiftUI/Compose and NativeTabs extras may be missing.
- `@expo/ui/swift-ui` imported in a non-`.ios` file breaks Android, and the reverse is also true. Split files, or use the
  universal tier.
- Inside `Host`, RN `style` doesn't apply to children. Use modifiers.
- `Stack.Toolbar placement="bottom"` only works in page files. Left/right placements work in layouts too.
- Android icons in `Stack.Toolbar` and `Stack.Toolbar.Menu` must be image sources (XML from `@expo/material-symbols` or
  PNG). `NativeTabs.Trigger.Icon` can use `md="name"` directly.
- On iOS 26 headers are transparent by default. Make sure scroll content uses `contentInsetAdjustmentBehavior="automatic"`,
  or pad it manually, so content isn't hidden.
- `formSheet` detents: an ascending array; Android uses only the first 3.
- 18+ blur: `expo-image` supports `blurRadius`. Combine it with the `isAdult` field and the "Blur 18+ content" setting.
- Packages these docs reference that aren't installed yet: `@expo/material-symbols`, `expo-widgets`, and optionally
  `expo-blur`. Add them with `bunx expo install`, and add plugins to app.json (`expo-widgets`; `expo-notifications` is already there) when
  you need them.
