# AniClient UI spec (reference for Qaraq)

This spec comes from the screen recording `reference/aniclient/recording.mp4` (2:40, iOS, dark theme, user `xibrox`, AniClient v1.9.5). Timestamps are `mm:ss.s` into the recording. Text in quotes is the exact on-screen label. `(?)` means inferred and not confirmed by the recording.

Frame sources: `reference/aniclient/frames/`, `reference/aniclient/sheets/s_001-s_021.jpg`, plus spot-check extracts in the scratchpad `frames-synth/`.

---

## 1. Global chrome

### Tab bar (4 tabs, always visible, including on pushed screens)
| Tab | Icon | Notes |
|---|---|---|
| "My List" | stacked cards | default launch tab |
| "Explore" | magnifier | |
| "Profile" | person silhouette with cap | |
| "Settings" | gear | |

- The bar is dark (#111–#141414), with icons and small labels (~11pt). The selected tab is white and the others are gray (#8e8e93).
- The bar stays visible on pushed detail screens such as media detail, Activity, Favorite Animes and Notifications.

### Navigation bars
- The title is centered, white, semibold, ~17pt: "Anime List", "Explore Anime", "Settings", "General Settings", "Activity", "Notifications", "Favorite Animes".
- Back is a plain white "←" arrow on the left, with no back-button text.
- Push and pop use the standard iOS horizontal slide. The interactive edge swipe-back works everywhere (01:23.3, 01:30.7).
- Media detail has no bar at the top. It shows floating circular translucent buttons over the banner. When scrolled, it collapses into an opaque black bar with a truncated title, e.g. "Josee, The Tiger And The F...".

### Header toolbar pattern (My List, Explore, Search)
The pattern is one row: an optional leading icon button, a dark search field ("Search" placeholder with a magnifier, #1c1c1e, radius ~10), and a segmented control "Anime | Manga". The selected segment is a white pill with black text. The unselected segment is white text on dark.

### Pull-down menus
- Every picker uses a native iOS UIMenu: a dark blurred rounded rect (~12 radius) anchored to the control, with a checkmark on the left of the current item and optional gray subtitles.
- The menu can have a small gray header, e.g. "Activity Feed Type".
- Long menus such as Color, Theme and Scoring System scroll inside the menu.

### Toasts
- After a favourite toggle, a text-only toast appears centered under the status bar: "Added to favorites" plus a green check emoji, white bold text with a shadow, and no pill background (00:31.97).

### Loading states
- Centered spinner with "Loading..." (detail, notifications) or "Loading Mangas..." (Explore manga).
- A thin progress line under the header appears while a list reloads (00:53.9).
- Lists render text first. Covers start as blank placeholders and fade in.
- The launch skeleton (00:00.8) is a black screen with dim "Search", count "0", the "Last Updated" pill and tab labels with no icons. There is no splash art.

### Colors (default "white" accent, black theme)
| Token | Value |
|---|---|
| background | #000 – #0d0d0d |
| header/elevated | #111 |
| card / field | #1a1a1a – #1c1c1e |
| feed/result card | #0f0f0f – #141414, 1px border #222 |
| chip fill / border | #151515 / #333 |
| divider | #2a2a2a, 1pt, inset |
| primary text | #fff |
| secondary text | #9a9a9a – #b0b0b0 |
| accent (selected chip/segment, SAVE, FAB) | white (#fff) with black content; follows the "Color" setting |
| score star | yellow #FFD60A |
| airing line | amber/yellow |
| destructive | red ~#e5383b |
| favourite heart | red (filled) |
| swipe +1 | green ~#3fb950 |
| swipe custom list | blue ~#3b6ff5 |
| rank heart | pink |
| releasing dot | green; other statuses use red |

### Typography
- Rounded geometric sans, similar to **Nunito**, not SF.
- List title: semibold 16. Detail title: bold 26–28. Section header: bold 20–22 (gray #b0b0b0 on detail, white on Explore and Profile). Body and meta: 13–15. Feed activity text: ~17. Labels: gray ~14. Values: bold white 15.

### Shapes and "glass"
- Corner radii: cards ~10–12, chips ~8–10, covers ~4–8, buttons ~8, bottom-sheet top ~16–20.
- Circular icon buttons are ~44pt dark gray circles.
- Glass and blur appear only in the system UIMenus, the media-detail floating buttons (dark translucent circles) and the blurred banner hero. Everything else is flat dark fill.
- The FAB is a white ~56pt circle with a black pencil glyph and a drop shadow, placed bottom-right above the tab bar. It appears on media detail and Profile.
- "Toolbar Style" is a setting whose value is "Follow" (see Settings). Its options were not shown.

---

## 2. My List (00:00.8 – 00:17.7)

### Header (sticky)
1. Title "Anime List". For manga it is presumably "Manga List" (?).
2. Toolbar:
   - Leading list/sidebar glyph button (lines with a vertical bar). It was never tapped, so its function is unknown (?).
   - "Search" field.
   - "Anime | Manga" segment.
3. Status chip row, scrolling horizontally: "Watching", "Rewatching", "Completed", "Paused", "Planning", "Dropped".
   - A circular ⇄ button sits at the end. It was not tapped (?).
   - The selected chip is a white fill with black text. Other chips are a dark fill with a 1px border, ~36pt tall, with medium 16pt text.
   - The row auto-scrolls to keep the selected chip visible.
4. Info row:
   - Count badge on the left: "22" Watching, "43" Dropped, "184" Completed.
   - Sort pill "⬍ Last Updated". It was not opened.
   - Circular sort-direction button (decreasing bars with ↓).

### Row (~95pt, no separators)
- Cover on the left, ~60×85, 2:3, radius ~4.
- Bold white title, wrapping to 2–3 lines.
- Progress "7/12 Episodes": the numbers are light gray and "Episodes" is dimmer. An unknown total shows as "351/- Episodes".
- Score line if scored: yellow ★ + bold "10.0" + dim "/10".
- Airing line in amber: "Episode 1181 airs in 2 months".
- Right side: an outlined rounded-square "•••" button (~30pt, radius 6) opens the quick editor sheet (§9).
- Tapping a row pushes Media detail.

Sample data:
- Watching: Death Parade 7/12; Spy X Family Season 2 6/12 ★10.0/10; Frieren: Beyond Journey's End Season 2 4/10.
- Dropped: One Piece 351/- ★9.0/10, "Episode 1181 airs in 2 months".
- Completed: Josee, The Tiger And The Fish 1/1 ★9.5/10.

### Not shown here
- Custom lists in the chip row.
- Swipe gestures in action (they are configured in Settings → Gestures).
- Sort options for the list.
- The manga list.

---

## 3. Explore (00:32.9 – 00:57.5)

### Explore home
- Title "Explore Anime" or "Explore Manga".
- Toolbar: "Search" field + "Anime | Manga" segment. The segment is dimmed while loading.
- Each section has a bold header, an optional gray subtitle and a "›" chevron that opens the full list.

| Anime sections | Manga sections |
|---|---|
| "Trending Now" (wide cards) | "Trending Now" |
| "Popular This Season" / "Fall - 2026" | "All Time Popular" |
| "Upcoming Next Season" / "Winter - 2027" | "Popular Manhwa" |
| "All Time Popular" (confirmed at 00:35.5) | "Top Manga" / "Top 100" |
| "Top Anime" / "Top 100" (4-col grid) | |

- **Trending card:** landscape banner (radius 10) above a small poster, the title, the score "8.7 ★" with a gray star, and a status dot (green = airing/releasing).
- **Poster rows:** posters ~165×225 with 2-line truncated titles.
- **Top 100:** a 4-column poster grid, ~4px gutters, 2-line titles.
- Switching the segment shows "Loading Mangas..." with a spinner.

### Search / Browse results (pushed; opened via "Top Manga ›" at 00:44.25)
- Row 1: "←", "Search" field, "Anime | Manga".
- Row 2 (horizontal filter chips): "Genre", "Year", "Format", "Publishing Status", "Country of Origin". For anime the chips are presumably "Airing Status" and "Season" (?). The pickers were not opened.
- Row 3:
  - Outlined pill "≡ Type".
  - Sort pill "⇕ Average Score". It reads "⇕ Sort" when no sort is set.
  - Circular direction toggle (↓ desc / ↑ asc). It is hidden when no sort is set.
  - Circular clear-filters button (funnel with slash).
- Sort bottom sheet:
  - Title "Manga: Sort By" with an eraser button on the right that clears the sort.
  - Radio list: "Popularity", "Trending", "Average Score", "Favorites", "Date Added", "Release Date", "Title".
- Result card (#0f0f0f, 1px #222, radius 8):
  - Poster flush left.
  - Title bold 20, format "Manga" gray bold.
  - Optional outlined list-status tag ("Planning", "Reading").
  - 4-line gray description.
  - Bottom row: "AL · 9.2 ★" pill + genre pills.
  - Green status dot top-right.
- Infinite scroll.

---

## 4. Media detail (00:17.9 – 00:32.0)

### Hero
- Blurred banner fading to black.
- Floating circular translucent "←" on the left. On the right: a heart (outline, or red fill when favourited) and "⋮".
- Cover ~110×170 with a light cyan glow. Tapping it opens a full-screen cover viewer with a zoom transition and an "X" close button (00:26.9–00:28.0).
- Title bold ~26–28 with a small "ⓘ" (not tapped).
- Meta line: "Fall 2020 · [tv] Movie · Finished" + a small status dot.
- Score pill "AL · 8.2 ★".
- Friends avatar stack "›" (not tapped; presumably friends' statuses (?)).
- Genres: "Drama · Romance · Slice of Life".
- "⋮" opens a menu: "View on AniList" (AL icon), "Share" (share icon).

### Body (top to bottom)
1. **Description card.** Collapsed to ~4 lines with a fade. Tap to expand (?). "Expand Summary By Default" is a setting.
2. Divider.
3. **Info card** (gray labels, white values):
   - "Finished" "Dec 25, 2020 - Dec 25, 2020"
   - "Episodes" "1"
   - "Duration" "1hr 38min"
   - "Popularity" "189 301"
   - "Favorites" "7 725"
   - "Studio" "bones" (underlined link)
4. **Rank pills:** "★ #54 · Highest Rated All Time", "♥ #30 · Most Popular All Time".
5. **"Related":** cover cards with a media-type icon badge top-left (book or tv) and a relation pill top-right ("Alternative", "Other").
6. **"Characters ›":** portrait cards with names.
7. **"Staff ›":** square photo + name + gray role ("Original Creator").
8. **"You may also like":** cover cards.
9. **"Trailer":** YouTube thumbnail.
10. **"Episodes":** 16:9 streaming thumbnails (Crunchyroll logo, play icon).
11. **"Reviews":** cards with avatar, username, "5 years ago", summary, 👍 "212".
12. **"External Links":** pills with service icons ("Crunchyroll", "Netflix", "Twitter", "Official Site").

### Other behavior
- The pencil FAB opens the entry editor. It was not tapped; reuse the quick-edit sheet layout (?).
- Loading state: partial data with "-" placeholders and "Loading...".

---

## 5. Character / Staff / Studio
**Not shown in the recording.** The entry points exist: Characters ›, Staff ›, cards, the "bones" studio link and the Favorite Characters/Staff rows. See the gaps section.

---

## 6. Profile (00:57.8 – 01:35.0)

### Header
- Nav title is the username "xibrox". The envelope icon on the right has a red badge "1" and opens Notifications.
- Banner (~250pt) with a small circular "i" button bottom-left (not tapped).
- Large circular avatar with a black ring, centered over the banner edge.
- Flanking stat cards: "Followers" / "35" and "Following" / "19". They were not tapped, so the lists are unseen.
- Tabs "Activity" | "Favorite" | "Stats", with a white underline under the selected tab.
- The banner area scrolls away. The tab row sticks under the nav bar. Overscroll stretches the banner.
- Pencil FAB, presumably to compose a status (?).

### Activity tab
- Toolbar:
  - Left: dropdown "[icon] Following ▾".
  - Right: filter "[funnel] ▾" (not opened). The options come from the setting: "All", "List Progress", "Text Status", "Messages".
- **"Activity Feed Type"** menu (01:03.9): "My Activity" (person icon), "Following" (walking icon), "Global" (globe icon).
- **List activity card:**
  - Cover flush left, ~2:3.
  - Header: username (gray semibold) + optional outlined "Donator" badge + relative time ("an hour ago") + "•••".
  - Text: "Read chapter 1134 - 1187 of **One Piece**".
  - Small square user avatar.
  - Bottom-right: "3 💬  75 ♡".
- **My Activity cards** omit the username and avatar, so they are shorter.
- Verbs: "Watched episode X of", "Watched episode X - Y of", "Read chapter X - Y of", "Rewatched episode X - Y of", "Completed", "Plans to watch".
- **Text status card:**
  - Avatar + username + time + "•••".
  - Rendered markdown/HTML: centered text, headings, links, @mentions, HR.
  - Collapsed with a fade and a centered "⌄" chevron.
- **18+ covers are heavily blurred** (01:11, "Blur 18+ Content").
- **Activity detail** (01:14.5):
  - Title "Activity". The full card is shown, then a "💬 Replies:" label.
  - Pinned composer "Write a reply..." + a gray circular ↑ send button.
  - Keyboard accessory: "+Spoiler", "H", "B", "I", center, bulleted list, image, hide-keyboard.

### Favorite tab (01:25)
- Sections with a bold header and "›": "Animes", "Characters", "Staff". Each is a horizontal poster row (~3.4 visible) with 2-line titles. "Mangas" and "Studios" were not shown (?).
- "Animes ›" pushes **"Favorite Animes"**: a plain vertical list with cover ~64×75, title on the right, and no separators.

### Stats tab (01:31.9)
- **"Activity History":** a GitHub-style heatmap card.
  - Month labels "Jul" "Aug" "Sep" "Oct" and weekday labels "Mon" "Wed" "Fri".
  - Gray-scale squares (~8px, 2px gap).
  - Legend "Less ▢▢▢▢▢ More".
- **"Summary"** with a small "Anime | Manga" segment:
  - Anime: "317" Total, "3 974" Eps. Watched, "96" (Days Watched?), "66.8" (Mean Score?).
  - Manga: "8" Total, "388" Chapters Read, "12" Planned, "56" Volumes Read.
- **"Top Genres":** donut + legend: "Drama 35%", "Adventure 20%", "Supernatural 15%", "Action 15%", "Fantasy 15%".

### Followers / Following lists
Not shown.

---

## 7. Notifications (01:35.9 – 01:39.7)
- Pushed from the envelope icon. Title "Notifications". Shows "Loading..." first.
- Row:
  - Thumbnail ~55×60 on the left (media cover or user avatar).
  - Message with bold entity names.
  - Gray relative time at the top right.
  - No separators.
- Infinite scroll.
- Verbatim message types:
  - "Episode 1 of Cyberpunk: Edgerunners 2 aired."
  - "Someone266 liked your activity."
  - "Lixol started following you."
  - "SickDayVisit liked your activity reply."
  - "JayGxnzalez mentioned you in their activity."
  - "JayGxnzalez replied to activity you're subscribed to."
  - "Pokémon: Wild Card was recently added to the site."
- No inbox/messages tab and no filter were seen.

---

## 8. Settings (01:40.7 – 02:39.8)

### Root ("Settings")
- PRO banner card: "(A)ni PRO", where the "PRO" text cycles red, blue and purple, and "♛ Unlock Bonus Features ♛".
- Card: "General ›" (gear), "Notifications ›" (bell), "AniList ›" (AL logo).
- Card: "Discord", "What's New", "Rate App" (no chevrons).
- Card: "Sign Out" in red with a red icon.
- Footer: "v1.9.5".
- Style: inset grouped, #1c1c1e cards, 16pt margins, ~44pt rows, monochrome icons.

### "General Settings"
**App Launch Defaults** (title + gray subtitle, value + ⇕):

| Row | Subtitle | Value | Options |
|---|---|---|---|
| "Default Media" | "Anime or Manga by default" | Anime | "Anime", "Manga" |
| "Default Tab" | "Tab when the app starts" | My List | not opened; presumably the 4 tabs (?) |
| "Default Activity Feed" | "Activity feed on profile" | Following | not opened; presumably "My Activity", "Following", "Global" (?) |
| "Default Activity Filter" | "Activity filter on profile" | All | "All", "List Progress", "Text Status", "Messages" |

**Appearance**
- "Color" (brush icon), value shown as a swatch. The palette menu offers:
  - Free: white ✓, blue, cyan, green, lime, yellow.
  - Shown with a gold crown (PRO): peach, orange, red, crimson, pink, purple.
- "Theme" (palette icon), value shown as a swatch:
  - Free: black ✓, dark gray.
  - Shown with a crown (PRO): navy, maroon, purple.

**Preferences**
- "Blur 18+ Content" ✓
- "Vibration" ✓
- "Preferred Title" = English. Options: "Default" ("AniList title settings"), "English" ("(Attack on Titan)"), "Romaji" ("(Shingeki no Kyojin)"), "Native" ("(進撃の巨人)").
- "Toolbar Style" = "Follow". The options were not opened (?).

**Other**
- "Gestures ›", "More Settings ›".

Separate cards:
- "Clear Image Cache" with the value "17.85 MB".
- "Reset App Settings" in red.

Toggles are checkmarks, not switches, except Airing "Enable".

### "Gesture Settings" (02:03.8)
- "Anime | Manga" segment. Switching cross-fades the content.
- Card 1 shows a preview row with a green block "+1 / Episode" ("+1 / Chapter" for manga) and "›››". Below it, "Swipe Right" = "Increase Episode" ("Increase Chapter").
- Card 2 shows a preview row with "‹‹‹" and a blue block with a list icon "Custom / List". Below it, "Swipe Left" = "Custom List".
- Action options: "Increase Episode", "Custom List", "Delete".
- "Reset Anime Gestures" / "Reset Manga Gestures".

### "More Settings" (02:15.8)

| Section | Row | Value |
|---|---|---|
| "Activity Feed" | "Display My Activity in Following" | ✓ |
| "Media Details" | "Expand Summary By Default" | off |
| "My List (Manga)" | "Hide Chapters" | off |
| "My List (Manga)" | "Hide Volumes" | off |
| "Search" | "Score Type" | "Star" (options: "Smiley", "Star") |

### "Notification Settings" (02:23.8)
- "Airing Notifications": "Enable" with a green iOS switch.
- Checkmark rows: "Watching" ✓, "Planning" ✓, "Completed", "Dropped", "Paused".

### "AniList Settings" (02:27.8)
- "Scoring System" = "10 Point Decimal". Options with subtitles:
  - "100 Point" "(55/100)"
  - "10 Point Decimal" "(5.5/10)"
  - "10 Point" "(5/10)"
  - "5 Star" "(3/5)"
  - "3 Point Smiley" ":)"
- "18+ Content" (off).
- **"Custom List"**: "Custom Anime Lists ›", "Custom Manga Lists ›".
- "Delete Account" in red.

### "Anime Custom List" (02:31.8)
- Full-width gray header "Current" with count "1".
- Row: editable field "Peak" + a red square ✕ delete button.
- Header "New" with count "0".
- White circular save FAB (floppy icon).
- Bottom pill input "Add New Custom List!".

---

## 9. Entry editor / sheets

### Quick edit sheet (from the row "•••", 00:12.8 – 00:17.4)
- Bottom sheet over a list dimmed to ~40%, with a grabber and a centered bold title "Josee, The Tiger And The Fish".
- A small dark "≡" button floats top-right above the sheet, on the edited row. Its function is unknown (?).
- **"Status:"** a 3×2 segmented grid: "Watching" "Planning" "Completed" / "Rewatching" "Paused" "Dropped". The selected button is white.
- **"Episodes:"** shows "1 / 1" on the right. Stepper: [−] [1] [+]. Buttons ~44pt with radius 8; the value box is ~95pt.
- **"Score:"** shows "★9.5/10" on the right. Stepper: [−] [9.5] [+]. The step follows the scoring system.
- **"Start Date:"** / **"Finish Date:"** side by side: calendar icon, "9/11/2026", ⓧ clear.
- **"Notes:"** multi-line field.
- A pinned full-width white **"SAVE"** button (black uppercase, ~56pt tall, radius 12). The content scrolls behind it.
- Swipe down to dismiss without saving.
- Not shown: rewatch count, private, hide-from-status, custom-list membership, favourite and delete.

### Sort sheet
"Manga: Sort By" (see §3).

---

## 10. Gestures and menus
- **Row swipes:** configured per media type. Defaults are right = "Increase Episode/Chapter" (green "+1") and left = "Custom List" (blue). The choices for each side are "Increase Episode", "Custom List" and "Delete". The swipe was **not demonstrated** on My List.
- Edge swipe-back on every pushed screen.
- Horizontal carousels everywhere. The chip row scrolls horizontally.
- Context menus:
  - Detail "⋮" → "View on AniList", "Share".
  - "Following ▾" → Activity Feed Type.
  - Settings pickers.
- Cover tap → full-screen viewer.
- Heart tap → toast.
- Long-press menus: none observed.

---

## Unseen / to design ourselves
Features the user requested (or implied by visible entry points) that the recording does not show:

1. **Custom lists on My List.** How custom lists appear in the chip row (after "Dropped"?), and the "Custom List" swipe flow (a picker sheet to toggle list membership).
2. **The swipe gestures themselves:** revealed-action visuals on a real row, haptics, "Delete" confirmation, undo.
3. **My List sort options** ("Last Updated" menu contents), the purpose of the leading list icon and the ⇄ button, and the "Manga List" variant with chapters/volumes.
4. **Full entry editor** from the detail FAB: rewatches, private, custom lists, favourite, delete entry. Also the "≡" button.
5. **Explore search:** typed-query results, the Genre/Year/Format/Status/Country pickers, the "Type" pill, the anime filter set, and the anime sort sheet.
6. **Character, Staff and Studio detail screens**, and the "Characters ›" / "Staff ›" see-all lists.
7. **Followers / Following lists.**
8. **Favourites:** Favorite Characters / Staff list screens (only Animes was opened), Manga/Studio favourites, and favourite toggles on character/staff.
9. **Activity filter menu** (funnel), activity "•••" actions, like/comment interactions, the compose-status sheet (FAB), and message activities.
10. **Stats:** the heatmap tap/detail, the unlabeled Summary metrics (Days Watched / Mean Score assumed), and the score/format/status distributions beyond Top Genres.
11. **Notifications/inbox:** row tap targets, filtering by type, mark-as-read, unread styling.
12. **Settings options not opened:** "Default Tab", "Default Activity Feed" and "Toolbar Style" (the meaning of "Follow"). Also the effect of the "Color" accent on UI elements, the "Theme" backgrounds (navy, maroon, purple) and a light theme (none seen).
13. **Vibration:** which actions trigger haptics.
14. **PRO paywall, What's New, Discord, Rate App, Sign Out confirmation, Reset App Settings / Delete Account confirmations.**
15. **Profile "i" info, the media "ⓘ", the friends avatar stack sheet, review detail, and the episode/trailer link handling.**
16. **Empty, error and offline states**, plus first-run sign-in (AniList implicit grant to `qaraq://auth`).
