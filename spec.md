# Sha by Aenset

## Current State
- ThemeContext initializes `isDark = true` hardcoded, never reads from localStorage or user preferences on load
- ProfileTab only calls `setIsDark(localDark)` inside `saveSettings()`, so toggling the switch has no immediate effect -- user must press Save
- The `data-bg-mode` attribute and `useBackgroundContrast` hook exist and CSS rules are present, but because theme isn't persisting/initializing correctly, the overall dark/light mode feels broken
- The dark blue rose image (`/assets/uploads/dark-blue-rose.jpeg`) is now in the uploads folder but not registered as a preset
- Light mode background: Blue Roses (`/assets/uploads/whatsapp_image_2026-03-30_at_12.17.23-019d3d80-09c8-718a-b31d-61187a8b423b-1.jpeg`)

## Requested Changes (Diff)

### Add
- Dark mode preset background: `/assets/uploads/dark-blue-rose.jpeg` -- automatically applied to ALL tabs when dark mode is active
- localStorage key `sha_dark_mode` to persist dark/light preference across sessions
- Auto-sync logic in ThemeContext: on init, read from `localStorage.getItem('sha_dark_mode')` to determine initial isDark value
- In App.tsx AppContent: after user loads, sync ThemeContext with `user.preferences.darkMode`
- When dark mode is toggled ON (via the switch in ProfileTab), immediately apply dark-blue-rose as background for all tabs at 40% opacity, and save to localStorage
- When dark mode is toggled OFF (light mode), immediately apply the blue roses image as background for all tabs at 40% opacity, and save to localStorage

### Modify
- ThemeContext: read initial `isDark` from `localStorage.getItem('sha_dark_mode') === 'true'` instead of hardcoded `true`. Also export a wrapped `setIsDark` that persists to localStorage.
- ProfileTab: the dark mode Switch `onCheckedChange` should call `setIsDark` immediately (not just on Save), and also update tab backgrounds immediately for visual feedback. The Save button still persists to backend.
- `getTabBackgrounds()` and the background defaults: when dark mode is active, the default should be dark-blue-rose; when light mode, Blue Roses
- `PRESET_BACKGROUNDS` in ProfileTab: add "Dark Blue Rose" preset with the new image URL

### Remove
- Nothing removed

## Implementation Plan
1. Update `ThemeContext.tsx`: read/write `sha_dark_mode` in localStorage. Export `setIsDark` that persists.
2. In `App.tsx` AppContent: after `user` loads, call `setIsDark(user.preferences.darkMode ?? true)` to sync theme with saved preference.
3. In `ProfileTab.tsx`: 
   - Add "Dark Blue Rose" to PRESET_BACKGROUNDS
   - On Switch toggle: immediately call `setIsDark(checked)`, immediately update ALL tab backgrounds to dark-blue-rose (if dark) or blue-roses (if light) at 40% opacity, then save those backgrounds to localStorage via `saveTabBackgrounds()`
   - Keep Save button for backend persistence
4. Update `getTabBackgrounds()`: when `sha_dark_mode === 'true'`, default all tabs to dark-blue-rose; otherwise blue-roses
