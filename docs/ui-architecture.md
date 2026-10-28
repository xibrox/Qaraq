# Qaraq UI architecture

Read this together with `docs/aniclient-ui-spec.md` (what to build) and `docs/sdk58-native-ui.md` (platform APIs).
It describes the navigation shell, the shared components in `src/components/`, the settings store, and the rules every
feature screen follows.

---

## 1. Route map

Expo Router, typed routes, root `src/app/`. Group folders don't appear in URLs.

```
src/app/
  _layout.tsx                      Root Stack: providers, ToastHost, launch routing; screens "(tabs)" and "sign-in"
  +native-intent.tsx               Rewrites qaraq:// deep links (see §2)
  sign-in.tsx                      Modal above the tabs                                  [settings]
  (tabs)/_layout.tsx               NativeTabs: "My List", "Explore", "Profile", "Settings"
  (tabs)/(lists)/_layout.tsx       Stack (index header hidden)
  (tabs)/(lists)/index.tsx         My List                                              [my-list]
  (tabs)/(explore)/_layout.tsx     Stack (index header hidden)
  (tabs)/(explore)/index.tsx       Explore home                                         [explore]
  (tabs)/(profile)/_layout.tsx     Stack
  (tabs)/(profile)/index.tsx       Viewer profile                                       [profile-social]
  (tabs)/(profile)/notifications.tsx  "Notifications"                                   [profile-social]
  (tabs)/(settings)/_layout.tsx    Stack with AniClient's nav titles
  (tabs)/(settings)/index.tsx      "Settings"                                           [settings]
  (tabs)/(settings)/general.tsx    "General Settings"                                   [settings]
  (tabs)/(settings)/gestures.tsx   "Gesture Settings"                                   [settings]
  (tabs)/(settings)/more.tsx       "More Settings"                                      [settings]
  (tabs)/(settings)/notifications.tsx "Notification Settings"                           [settings]
  (tabs)/(settings)/anilist.tsx    "AniList Settings"                                   [settings]
  (tabs)/(settings)/whats-new.tsx  "What's New"                                         [settings]
  (tabs)/(settings)/custom-lists/[type].tsx  "Anime/Manga Custom List" (type = anime|manga) [settings]
  (tabs)/(lists,explore,profile)/  Shared routes, pushed onto the CURRENT tab's Stack:
    media/[id].tsx                 Media detail                                         [media-detail]
    character/[id].tsx             Character                                            [media-detail]
    staff/[id].tsx                 Staff                                                [media-detail]
    studio/[id].tsx                Studio                                               [media-detail]
    review/[id].tsx                Review                                               [media-detail]
    user/[id].tsx                  Other user's profile                                 [profile-social]
    activity/[id].tsx              "Activity" detail + replies                          [profile-social]
    favourites/[userId]/[kind].tsx "Favorite Animes" etc. (kind = FavouriteKind)        [profile-social]
    follows/[userId]/[kind].tsx    Followers / Following (kind = followers|following)   [profile-social]
    entry/[mediaId].tsx            Full entry editor, formSheet                         [my-list]
    search.tsx                     Explore search/browse (header hidden; own toolbar)   [explore]
```

`[owner]` is the feature agent that implemented the file. Every route is implemented; the temporary
`PlaceholderScreen` has been deleted. `user/[id]` accepts a numeric id or a username (from @mentions).

**Why a `(tabs)` wrapper:** the root is a Stack so `sign-in` can be a real modal that covers the tab bar. Every route
directly under a NativeTabs layout would become a tab.

**Navigate only through `hrefs`** (`src/navigation/hrefs.ts`). Its builders are type-checked against the generated route
types. Paths that exist in two tabs are fully group-qualified there:

| Builder | Href |
| --- | --- |
| `hrefs.media(id)` / `character` / `staff` / `studio` / `user` / `activity` / `review` | `/media/5` … |
| `hrefs.favourites(userId, kind)` | `/favourites/1/anime` (`kind: FavouriteKind` = anime, manga, characters, staff, studios) |
| `hrefs.follows(userId, kind)` | `/follows/1/followers` (`FollowKind` = followers, following) |
| `hrefs.entry(mediaId, mode = 'full')` | `/entry/5` or `/entry/5?mode=quick` (formSheet) |
| `hrefs.settings.whatsNew()` | `/(tabs)/(settings)/whats-new` |
| `hrefs.search(params?: SearchParams)` | `/search?type=MANGA&sort=SCORE_DESC&preset=top` |
| `hrefs.signIn()` | `/sign-in` |
| `hrefs.notifications()` | `/(tabs)/(profile)/notifications` |
| `hrefs.tab(tab: AppTab)` | `/(tabs)/(lists)` … |
| `hrefs.settings.general()` / `gestures` / `more` / `notifications` / `anilist` | `/(tabs)/(settings)/general` … |
| `hrefs.settings.customLists(type: MediaType)` | `/(tabs)/(settings)/custom-lists/anime` |

`SearchParams` (all optional strings): `type` (MediaType), `q`, `sort` (AniList MediaSort, e.g. `SCORE_DESC`), `genre`,
`year`, `season`, `format`, `status`, `country`, `preset` (`trending | season | nextSeason | popular | top | manhwa`,
used by the Explore "›" headers). Helpers: `customListSlug(type)`, `mediaTypeFromSlug(param)`.

Typed route definitions are generated into `.expo/types/router.d.ts` by `bunx expo start`. If you add a route, start
the dev server once so `Href` knows it.

### Stack options

Each tab `_layout.tsx` uses `useStackScreenOptions()` from `src/navigation/stack-options.ts`. It gives a centered
~17pt bold title, a plain back arrow with no text (`headerBackButtonDisplayMode: 'minimal'`), full-screen swipe-back,
the theme background, and the Toolbar Style appearance (§4). Shared routes get their defaults from
`sharedStackScreens()` (`src/navigation/shared-screens.tsx`): `activity` "Activity", `review` "Review", `search`
header hidden, `entry` a formSheet from `useSheetScreenOptions()` (detents `[0.6, 1]`, grabber, sheet radius 18,
transparent on iOS 26 for the glass sheet material). Everything else starts with an empty title.

Screens refine their own header from the page:

```tsx
<Stack.Screen options={{ title: 'Favorite Animes' }} />
<Stack.Title>{username}</Stack.Title>
<Stack.Toolbar placement="right">…</Stack.Toolbar>
```

With a glass or translucent header, content scrolls under the bar, so every scroll view needs
`contentInsetAdjustmentBehavior="automatic"`. Media detail should use a transparent header (`headerTransparent: true,
title: ''`) with `IconButton variant="glass"` buttons, or `Stack.Toolbar` buttons, which get Liquid Glass circles
on iOS 26.

My List and Explore hide the native bar and draw `ScreenHeader` + `HeaderToolbar` themselves (§3.2).

---

## 2. Launch, deep links, notifications

- **Default Tab**: `useLaunchRouting()` (`src/navigation/launch-routing.ts`, mounted in the root layout). After settings
  hydrate it calls `router.navigate(hrefs.tab(defaultTab))` once, and only when the app opened on `/` (not a deep link).
- **Deep links** (`scheme: qaraq`): `src/app/+native-intent.tsx` → `appUrlToPath()`.
  - `qaraq://media/<id>`, `user/<id>`, `activity/<id>`, `character|staff|studio|review/<id>` go to the shared route.
  - `qaraq://notifications` goes to `/(tabs)/(profile)/notifications`.
  - `qaraq://auth#…` (OAuth callback, consumed by expo-web-browser) is never routed.
  - Anything else passes through.
- **Notification taps**: `useLaunchRouting` routes the response that cold-started the app and listens with
  `addNotificationResponseReceivedListener`. It reads `content.data.url`, which `src/lib/notifications.ts` sets to the
  `qaraq://` URLs above.

---

## 3. Shared components (`src/components/`)

Import with `@/components/<file>`. All components read the theme (`useTheme()`), so they follow the Color accent,
the Theme background and light or dark mode. Every icon is an `IconName = { ios: SFSymbol; android: AndroidSymbol }`.
Use `icons.*` from `icon.tsx` and add new names there.

### 3.1 Primitives

| Component | File | Props (defaults) | Use |
| --- | --- | --- | --- |
| `AppText` | app-text | `variant?: TypographyVariant` (`body`), `tone?: 'primary'\|'secondary'\|'tertiary'\|'muted'\|'accent'\|'onAccent'\|'danger'\|'star'\|'airing'\|'success'`, `color?`, `weight?`, `align?`, `uppercase?` + RN `TextProps` | **All text.** Nunito. Variants: `largeTitle title1 title2 title3 headline body callout subheadline footnote caption1 caption2 navTitle listTitle detailTitle sectionHeader meta label value chip feed button` |
| `Icon` / `icons` | icon | `name: IconName`, `size?` (20), `color?` (text), `weight?` (`semibold`), `style?`, `accessibilityLabel?` | SF Symbol on iOS, Material Symbol on Android (expo-symbols) |
| `IconButton` | icon-button | `icon`, `accessibilityLabel` (required), `onPress?`, `onLongPress?`, `variant?: 'circle'\|'glass'\|'outlined'\|'plain'` (`plain`), `size?` (44/44/30/36), `iconSize?`, `color?`, `badge?: number\|string`, `disabled?` | `circle`: 44pt dark circle (sort direction, ⇄, clear filters). `glass`: floating translucent circle over banners (always Liquid Glass when available). `outlined`: the row "•••". `plain`: toolbar glyph. `badge`: red count (envelope) |
| `GlassSurface` | glass-surface | `radius?: number\|'pill'` (10), `variant?: 'regular'\|'clear'`, `interactive?`, `tint?`, `mode?: 'toolbar'\|'always'\|'never'` (`toolbar`), `fallbackColor?` (`colors.field`), `pointerEvents?`, `style?` | expo-glass-effect `GlassView` with a flat fallback. `toolbar` follows Toolbar Style. Never animate its opacity |
| `Chip` | chip | `label`, `selected?`, `onPress?`, `onLongPress?`, `icon?`, `trailingIcon?`, `variant?: 'filled'\|'outlined'\|'tag'` (`filled`), `size?: 'sm'\|'md'` (`md`, 36pt), `disabled?` | Status chips (selected = accent fill), filter chips / "≡ Type" / sort pill (`outlined`), "Planning" / "Donator" tags (`tag`) |
| `StatPill` | stat-pill | `label`, `value?`, `icon?`, `iconColor?`, `iconPosition?: 'start'\|'end'`, `onPress?` | "AL · 8.2 ★" (`icon=icons.star, iconPosition="end"`), "★ #54 · Highest Rated All Time", genre pills |
| `StatBlock` | stat-pill | `value`, `label`, `onPress?`, `variant?: 'card'\|'plain'` | "35 / Followers" cards, Stats summary numbers |
| `Avatar` | avatar | `uri?`, `name?`, `size?` (40), `shape?: 'circle'\|'rounded'`, `ringColor?`, `ringWidth?` (3) | Users, characters, staff. Initial fallback |
| `CoverImage` | cover-image | `uri`, `width?`, `height?`, `aspectRatio?` (2/3), `radius?` (6), `isAdult?`, `contentFit?`, `recyclingKey?`, `priority?`, `accessibilityLabel?` | Covers, posters, banners (`aspectRatio={16/9}`). Fades in over a placeholder. Blurs 18+ covers when "Blur 18+ Content" is on |
| `PrimaryButton` | primary-button | `label`, `onPress?`, `icon?`, `variant?: 'filled'\|'secondary'\|'destructive'`, `size?: 'lg'\|'sm'` (`lg` = 56pt, uppercase), `uppercase?`, `loading?`, `disabled?` | The white "SAVE" button and smaller actions |
| `Fab` | fab | `onPress`, `accessibilityLabel`, `icon?` (pencil), `bottom?` (16) | 56pt accent circle, bottom-right. Pencil on media detail and Profile, save glyph on Custom Lists |
| `ProgressLine` | progress-line | `active`, `color?` | Thin indeterminate line under a header while a list reloads |

### 3.2 Headers and toolbars

| Component | File | Props | Use |
| --- | --- | --- | --- |
| `ScreenHeader` | screen-header | `title?`, `left?`, `right?`, `children?` (rows), `floating?` (false), `onHeightChange?`, `safeAreaTop?` (true) | Custom tab-root header (My List "Anime List", Explore "Explore Anime"). Glass, translucent or solid per Toolbar Style. Hide the native header for these screens |
| `useFloatingHeader()` | screen-header | returns `{ floating, height, inset, onHeightChange }` | Float the header over content when the appearance isn't solid: pad the list with `inset` |
| `HeaderToolbar` | header-toolbar | `leading?: { icon, onPress, accessibilityLabel } \| ReactNode`, `search: SearchFieldProps`, `mediaType?`, `onMediaTypeChange?`, `mediaTypeDisabled?`, `trailing?` | `[≡] [ Search ] [Anime \| Manga]` row. Omit `onMediaTypeChange` to hide the switch |
| `SearchField` | search-field | `value?`, `onChangeText?`, `onSubmit?`, `placeholder?` ("Search"), `autoFocus?`, `onPress?` (button mode), `onFocus?`, `onBlur?`, `onClear?`, `ref?: Ref<TextInputInstance>` | Glass/dark 36pt field. `onPress` makes it a non-editable button (My List/Explore → push search) |
| `SegmentedSwitch<T>` | segmented-switch | `segments: {value,label}[]`, `value`, `onChange`, `disabled?`, `size?: 'sm'\|'md'` | AniClient compact switch: the selected segment is an accent pill |
| `MediaTypeSwitch` | segmented-switch | `value: MediaType`, `onChange`, `disabled?`, `size?` | "Anime \| Manga" |
| `StatusChipRow<K>` | status-chip-row | `items: {key,label}[]`, `selectedKey`, `onSelect`, `onLongPress?`, `trailing?` (⇄ button), `contentInset?` (12) | Horizontal chip row that keeps the selected chip centered. Build items with `listStatusLabel(status, type)` + custom lists (`custom:<name>` keys) |
| `SectionHeader` | section-header | `title`, `subtitle?`, `onPress?` (adds "›"), `tone?: 'primary'\|'muted'`, `trailing?`, `inset?` (16) | "Trending Now ›", "Fall - 2026". `muted` = gray headers on media detail |

### 3.3 Media

| Component | File | Props | Use |
| --- | --- | --- | --- |
| `MediaListRow` | media-list-row | `title`, `coverUrl?`, `isAdult?`, `mediaId?`, `mediaType?` (`ANIME`), `progress?`, `total?`, `progressVolumes?`, `totalVolumes?`, `score?`, `scoreFormat?` (`POINT_10_DECIMAL`), `airingText?`, `onPress?`, `onLongPress?`, `onMorePress?` (shows "•••"), `trailing?` | My List row, ~95pt: "7/12 Episodes", "★ 10.0/10", amber airing line. Honors Hide Chapters / Hide Volumes. `scoreParts(score, format)` is exported |
| `MediaGridCard` | media-grid-card | `title`, `coverUrl?`, `isAdult?`, `width?`, `titleLines?` (2), `subtitle?`, `topLeft?`, `topRight?`, `bottom?`, `onPress?`, `onLongPress?`, `recyclingKey?` | Poster with title under it (Explore rows, Top 100 grid, Related, Favorites, grid mode) |
| `MediaCarousel<T>` | media-carousel | `data`, `keyExtractor`, `renderItem`, `itemWidth?` (120), `gap?` (10), `inset?` (16), `loading?`, `skeletonCount?` (4), `renderSkeleton?`, `onEndReached?` | Horizontal snapping FlatList with skeletons |
| `SwipeableMediaRow` | swipeable-row | `mediaType`, `onAction(action: SwipeAction)`, `children`, `enabled?`, `threshold?` (80) | ReanimatedSwipeable driven by `settings.swipe[type]`. Swipe right fires `.right` and swipe left fires `.left`, with haptics, then the row snaps back. **Confirm "Delete" in `onAction`** |
| `SwipeActionPanel` | swipeable-row | `action`, `mediaType`, `edge: 'left'\|'right'`, `width?` (88) | The green "+1 / Episode", blue "Custom / List" and red "Delete" blocks. Reuse them for the Gesture Settings previews |

### 3.4 States and feedback

| Component | File | Props | Use |
| --- | --- | --- | --- |
| `LoadingState` | loading-state | `label?` ("Loading..."), `fill?` (true) | Centered spinner. Pass "Loading Mangas..." on Explore manga |
| `Skeleton`, `MediaRowSkeleton`, `MediaCardSkeleton`, `ListSkeleton` | skeleton | `width?`, `height?`, `radius?` / `width?` / `rows?` (6) | Pulsing placeholders |
| `EmptyState` | empty-state | `title`, `message?`, `icon?`, `actionLabel?`, `onAction?`, `children?`, `fill?` | Empty lists, guest mode ("Sign In" → `hrefs.signIn()`) |
| `ErrorState` / `describeError` | error-state | `error`, `onRetry?`, `fill?` | AniList/network errors with "Try Again" |
| `toast` / `ToastHost` | toast | `toast(msg, { kind?, duration?, haptic? })`, `toast.success(msg)` (appends ✅), `toast.error(msg)`, `toast.hide()` | Text-only toast under the status bar ("Added to favorites ✅"). `ToastHost` is already mounted in the root layout |

### 3.5 Native menus (`@/components/menu/native-menu`)

Platform files: `.ios.tsx` (SwiftUI `Menu` / `ContextMenu`), `.android.tsx` (Compose `DropdownMenu`), `.tsx` (web).

```ts
type MenuIcon = { ios?: SFSymbol; android?: ImageSourcePropType }; // android: import X from '@expo/material-symbols/<name>.xml'
type MenuAction = { kind?: 'action'; key; title; subtitle?; icon?: MenuIcon; checked?: boolean; swatch?: string; destructive?; disabled?; onPress? };
type MenuSection = { kind: 'section'; key; title?; items: MenuEntry[] };   // gray header ("Activity Feed Type")
type MenuSubmenu = { kind: 'submenu'; key; title; icon?; items: MenuEntry[] }; // flattened on Android
type NativeMenuProps = { children: ReactNode /* RN trigger, no onPress */; items: MenuEntry[]; title?; trigger?: 'press' | 'longPress'; disabled?; onOpen?; onClose? /* Android + web only */; style?; testID? };
choiceItems(options: {value,label,subtitle?,swatch?,icon?}[], selected, onSelect): MenuAction[] // single-choice with checkmarks
```

```tsx
<NativeMenu title="Activity Feed Type" items={choiceItems(feedOptions, feed, setFeed)}>
  <Chip label="Following" icon={icons.people} trailingIcon={icons.chevronDown} variant="outlined" />
</NativeMenu>
```

Use it for every AniClient pull-down: detail "⋮" (View on AniList, Share), "Following ▾", the activity filter funnel,
sort pills and "•••" actions. For header-bar buttons prefer `Stack.Toolbar.Menu`.

### 3.6 Native segmented picker (`@/components/segmented-picker/native-segmented-picker`)

`NativeSegmentedPicker<T>`: `segments`, `value`, `onChange`, `disabled?`, `style?` (give it a width, or use
`alignSelf: 'stretch'`). It's a SwiftUI `.segmented` Picker on iOS, Material 3 `SingleChoiceSegmentedButtonRow` on
Android, and `SegmentedSwitch` on web. Use it inside content, for example the Gesture Settings and Stats "Anime | Manga"
switches. In headers, keep `MediaTypeSwitch`.

### 3.7 Native settings primitives (`@/components/settings`)

The trees are a SwiftUI `Form` on iOS (`settings-list.ios.tsx`), Compose cards in a `LazyColumn` on Android
(`settings-list.android.tsx`), and an RN fallback on web (`settings-list.tsx`). Compose only these components: they
already render inside one `Host`. Don't put RN views between them, except inside `SettingsCustomRow`.

| Component | Props | AniClient row |
| --- | --- | --- |
| `SettingsForm` | `children`, `footer?` ("v1.9.5"), `style?`, `testID?` | Screen root. Make it the page's only root so the iOS large title/scroll edge works |
| `SettingsSection` | `title?`, `footer?`, `children` | "App Launch Defaults", "Appearance"… |
| `SettingsNavigationRow` | `title`, `subtitle?`, `icon?`, `value?`, `onPress`, `disabled?` | "General ›" |
| `SettingsValueRow<T>` | `title`, `subtitle?`, `icon?`, `value: T`, `options: SettingsOption<T>[]`, `onChange`, `menuTitle?` (Android/web), `disabled?` | "Default Media / Anime or Manga by default   Anime ⇕". Options take `{ value, label, subtitle?, swatch? }`. A swatch makes the value show the colour (Color / Theme) |
| `SettingsCheckRow` | `title`, `subtitle?`, `icon?`, `checked`, `onToggle(next)` | "Blur 18+ Content ✓" (AniClient uses checkmarks, not switches) |
| `SettingsSwitchRow` | `title`, `subtitle?`, `icon?`, `value`, `onValueChange` | Airing Notifications "Enable" only (green switch) |
| `SettingsButtonRow` | `title`, `subtitle?`, `icon?`, `value?`, `onPress` | "Discord", "Rate App", "Clear Image Cache   17.85 MB" |
| `SettingsDestructiveRow` | `title`, `icon?`, `onPress` | "Sign Out", "Reset App Settings", "Delete Account". Confirm first (`Alert.alert`) |
| `SettingsCustomRow` | `children: ReactElement`, `bare?` | PRO banner, gesture preview row, custom list field (RN content via `RNHostView`) |

`SettingsIcon` = `MenuIcon` (SF Symbol + Android XML source). Android icons come from `@expo/material-symbols`,
for example `import Brush from '@expo/material-symbols/brush.xml'`.

```tsx
<SettingsForm>
  <SettingsSection title="App Launch Defaults">
    <SettingsValueRow
      title="Default Media" subtitle="Anime or Manga by default"
      value={defaultMediaType} onChange={(v) => setSetting('defaultMediaType', v)}
      options={MEDIA_TYPES.map((t) => ({ value: t, label: MEDIA_TYPE_LABELS[t] }))} />
  </SettingsSection>
  <SettingsSection title="Appearance">
    <SettingsValueRow title="Color" icon={{ ios: 'paintbrush', android: Brush }} value={accentColor}
      onChange={(v) => setSetting('accentColor', v)}
      options={ACCENT_COLORS.map((a) => ({ value: a, label: ACCENT_COLOR_LABELS[a], swatch: ACCENT_HEX[a] }))} />
  </SettingsSection>
</SettingsForm>
```

---

## 4. Toolbar Style and glass

`settings.toolbarStyle` takes `'follow' | 'glass' | 'solid'`, labelled "Follow", "Glass" and "Solid" (subtitles in
`TOOLBAR_STYLE_SUBTITLES`). `useToolbarAppearance()` resolves it to `'liquidGlass' | 'translucent' | 'solid'`:

| Setting | iOS 26+ | iOS < 26 | Android |
| --- | --- | --- | --- |
| Follow (default) | liquidGlass | solid | solid |
| Glass | liquidGlass | translucent (blur) | translucent (tint) |
| Solid | solid | solid | solid |

Reduce Transparency forces `solid`. The setting is applied in `useStackScreenOptions` (native headers), `AppTabs`
(tab bar, where the platform allows: iOS 26 always draws the system glass bar), `ScreenHeader`, and
`GlassSurface mode="toolbar"` (search field, segmented switch). Floating media-detail buttons use
`IconButton variant="glass"`, which is always glass when Liquid Glass exists. `CAN_LIQUID_GLASS` and
`useReduceTransparency()` live in `src/lib/glass.ts`.

---

## 5. Theme

`useTheme()` / `useColors()` from `@/theme`. Tokens derive from **Theme background × Color accent**
(`buildTheme(background, accent)` in `src/theme/tokens.ts`). The default black/white theme reproduces the spec values.

- Colours: `background, groupedBackground, header, surface, surfaceElevated, field, feedCard, feedCardBorder, chipFill,
  chipBorder, fill, fillSecondary, text, textSecondary, textTertiary, textQuaternary, textMuted, separator, border,
  accentBase, accent, onAccent, accentMuted, star, airing, favourite, rankHeart, swipeIncrement, swipeCustomList,
  swipeDelete, success, warning, danger, info, overlay, skeleton, barBackground, shadow, scoreLow, scoreMid, scoreHigh`.
- `accent` is contrast-checked against the background. Draw content on accent fills with `onAccent` (black on the
  white accent).
- `theme.spacing` (`xs 4, sm 8, md 12, lg 16, gutter 16…`), `theme.radii` (`xs 4` row covers, `sm 6` "•••", `md 8`
  buttons and result cards, `lg 10` field and chips, `xl 12` cards and menus, `sheet 18`, `pill`), `theme.sizes`
  (`listRow 95, listCoverWidth 60, listCoverHeight 85, iconButton 44, moreButton 30, chipHeight 36,
  searchFieldHeight 36, fab 56, primaryButton 56, posterWidth 120, settingsRow 44`), `theme.typography`, `theme.fontFamily`
  ("Nunito", embedded by the expo-font plugin in app.json).
- `ACCENT_HEX`, `BACKGROUND_HEX` (menu swatches), `STATUS_COLORS`, `MEDIA_STATUS_COLORS` (green releasing dot, red
  otherwise).

---

## 6. Settings store (`@/settings`)

Zustand + MMKV, persisted, deep-merged with enum validation. Read with `useSetting(key)` or `useSettings(selector)`
(shallow), and outside React with `getSettings()`. Write with `setSetting(key, value)`, `updateSettings(partial)` or the
helpers below. Labels (verbatim AniClient text) are in `src/settings/labels.ts`, option arrays in
`src/settings/defaults.ts`.

| Key | Type / values | Default | AniClient row |
| --- | --- | --- | --- |
| `defaultMediaType` | `'ANIME' \| 'MANGA'` | ANIME | Default Media |
| `defaultTab` | `'lists' \| 'explore' \| 'profile' \| 'settings'` | lists | Default Tab ("My List", "Explore", "Profile", "Settings") |
| `defaultActivityFeed` | `'mine' \| 'following' \| 'global'` | following | Default Activity Feed ("My Activity", "Following", "Global") |
| `defaultActivityFilter` | `'all' \| 'list' \| 'text' \| 'messages'` | all | Default Activity Filter ("All", "List Progress", "Text Status", "Messages") |
| `accentColor` | `white blue cyan green lime yellow peach orange red crimson pink purple` (all free) | white | Color |
| `theme` | `black darkGray navy maroon purple light system` (all free) | black | Theme |
| `blurAdultContent` | boolean | true | Blur 18+ Content |
| `haptics` | `{ enabled: boolean; intensity: 'light'\|'medium'\|'strong' }` | enabled | Vibration (`updateHaptics`) |
| `preferredTitle` | `'userPreferred' \| 'english' \| 'romaji' \| 'native'` | userPreferred | Preferred Title ("Default", "English", "Romaji", "Native" + subtitles) |
| `toolbarStyle` | `'follow' \| 'glass' \| 'solid'` | follow | Toolbar Style |
| `showAdultContent` | boolean | false | local mirror of AniList "18+ Content" |
| `swipe` | `{ ANIME, MANGA: { right, left: 'increment' \| 'customList' \| 'delete' } }` | right increment, left customList | Gesture Settings (`setSwipeAction(type, dir, action)`, `resetSwipeGestures(type)`, `swipeActionLabel(action, type)`) |
| `displayMyActivityInFollowing` | boolean | true | More > Display My Activity in Following |
| `expandSummaryByDefault` | boolean | false | More > Expand Summary By Default |
| `hideMangaChapters` / `hideMangaVolumes` | boolean | false | More > Hide Chapters / Hide Volumes |
| `scoreType` | `'smiley' \| 'star'` | star | More > Score Type |
| `listDisplayMode` | `{ ANIME, MANGA: 'list' \| 'grid' }` | list | Grid Mode (`setListDisplayMode`) |
| `listSort` | `{ ANIME, MANGA: { field: ListSortField; direction: 'asc'\|'desc' } }` | lastUpdated desc | "⬍ Last Updated" pill (`setListSort`, `LIST_SORT_FIELD_LABELS`) |
| `listSectionOrder` / `hiddenListSections` | `{ ANIME, MANGA: ListSectionKey[] }` (statuses + `custom:<name>`) | 6 statuses | Chip order (`syncCustomListSections`, `toggleSectionHidden`, `visibleSections`) |
| `notifications.airing` | `{ enabled, statuses: { CURRENT, PLANNING, COMPLETED, DROPPED, PAUSED }, minutesBefore, mutedMediaIds }` | enabled, Watching + Planning | Notification Settings (`updateAiringNotifications`, `setAiringStatus`) |
| `notifications.anilistAlerts` / `.types` / `.badge` | boolean / per-type / boolean | true | background AniList alerts, Profile tab badge |

`resetSettings()` is "Reset App Settings".

---

## 7. Conventions

- **Files**: kebab-case. Feature components live in `src/components/<feature>/` (`lists`, `explore`, `media`,
  `people`, `favourites`, `stats`, `profile`, `activity`, `settings`); shared primitives sit directly in
  `src/components/` and are documented here. Route files stay thin: compose hooks and feature components.
- **Platform splits**: `.ios.tsx` / `.android.tsx` when the native trees differ, plus a `.tsx` base (web fallback; also
  what TypeScript resolves) and a shared `types.ts`. `@expo/ui/swift-ui` only in `.ios.tsx`, `@expo/ui/jetpack-compose`
  only in `.android.tsx`.
- **Controls** use the native wrappers: `NativeMenu`, `NativeSegmentedPicker`, settings primitives,
  `@expo/ui` `DatePicker`/`DateTimePicker`, `Stepper`, `BottomSheet`/`ModalBottomSheet`. **Long lists** (media rows,
  grids, feeds, notifications) use RN `FlatList`/`ScrollView`. No extra list libraries.
- **Text** goes through `AppText` and **icons** through `Icon` + `icons`. No raw `Text` or hex colours in screens: use
  theme tokens.
- **Data**: TanStack hooks from `@/api/queries/hooks` (`useMediaDetail`, `useMediaListCollection`, `useToggleFavourite`,
  …). Never call `fetch` in screens. Titles go through `pickTitle()` (honors Preferred Title), scores and dates through
  `@/lib/format`, the 18+ blur through `CoverImage isAdult` / `shouldBlur`, and haptics through `haptics` from
  `@/lib/haptics` (honors Vibration).
- **Guest mode**: check `useIsSignedIn()`. Screens that need an account show `EmptyState` with an action to
  `hrefs.signIn()`.
- **Feedback**: `toast.success('Added to favorites')` after favourite toggles. Confirm destructive actions.
- **React Compiler is on**: don't mutate during render, don't read `ref.current` in render, and use `.get()`/`.set()` on
  shared values.
- **Verify** before finishing: `bunx tsc --noEmit`, `bunx expo lint`, `bun test`.
