# Sha by Aenset

## Current State
App has 7 tabs (Home, Notes, Planner, Finance, Wardrobe, Gym, Profile), a FloatingChatBot floating button, onboarding that can re-appear on every fresh load if backend is slow, stopwatch without milliseconds, today's checklist limited to 3 tasks in a small half-width card, outfit chooser in Planner opens as a bottom sheet, and a login buffer/splash delay.

## Requested Changes (Diff)

### Add
- Chat tab to navigation (using existing ChatTab.tsx / FloatingChatBot logic merged)
- Milliseconds display to stopwatch (format: MM:SS.cs)
- Scrollable today's checklist on Home that shows ALL tasks (not just 3) and allows inline editing of task titles
- `sha_onboarding_done` flag in localStorage so onboarding name screen never appears again after first time

### Modify
- `useInternetIdentity.ts`: Remove the `"User is already authenticated"` error block — instead if already authenticated, call `handleLoginSuccess()` silently
- `App.tsx`: Add Chat tab; remove FloatingChatBot import and usage; check `sha_onboarding_done` flag before showing onboarding; don't show splash screen if cache has profile (skip `isLoading` splash when cache hit)
- `TimerPanel.tsx`: `formatTime` for stopwatch shows milliseconds (centiseconds), timer keeps existing format
- `HomeTab.tsx`: Today's checklist redesigned to full-width section, scrollable (max-height), shows all tasks, each task has pencil icon for inline title editing
- `PlannerTab.tsx`: Outfit chooser opens as centered modal (not bottom sheet) — consistent with Notes/Wardrobe/Gym modals

### Remove
- FloatingChatBot component from App.tsx (floating button removed)
- `slice(0, 3)` limit on checklist in HomeTab

## Implementation Plan
1. Fix `useInternetIdentity.ts` — already-authenticated case calls `handleLoginSuccess()` instead of `setErrorMessage`
2. Update `App.tsx` — add Chat tab, remove FloatingChatBot, add `sha_onboarding_done` check, skip loading splash if cached profile exists
3. Update `TimerPanel.tsx` — add centiseconds to stopwatch formatTime (separate function for stopwatch vs timer)
4. Redesign checklist in `HomeTab.tsx` — full width, scrollable list, inline editing
5. Change outfit picker in `PlannerTab.tsx` from bottom sheet to centered modal
6. Validate (lint + typecheck + build)
