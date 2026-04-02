# Sha by Aenset

## Current State
- Login screen (AuthScreen) shows every time the app is opened, even for authenticated returning users
- Onboarding (username) screen shows again when `sha_onboarding_done` is not in localStorage (e.g. different device, cleared storage)
- The `useInternetIdentity.login()` throws `loginError` if user is already authenticated instead of silently succeeding
- `useActor.ts` calls `refetchQueries` (force refetch) on actor init, flooding ICP backend on every load
- Outfit picker in PlannerTab already has centering CSS but animation starts from scale/opacity (not from center) — needs `transformOrigin: center`
- Stopwatch `formatStopwatch` shows centiseconds (2 digits `cs`) — user wants full milliseconds (3 digits `ms`)
- Data entry fails silently or with auth errors due to the actor flood + auth block issues

## Requested Changes (Diff)

### Add
- Per-principal localStorage key `sha_onboarding_[principalId]` to persist that a specific ICP user has completed onboarding — survives app close/reopen, only resets on logout
- Username-set flag stored under `sha_username_set_[principalId]` so username is asked only once per principal

### Modify
- `useInternetIdentity.ts`: Remove the "User is already authenticated" error block — if identity is valid, call `handleLoginSuccess` directly instead of throwing an error
- `useActor.ts`: Replace `refetchQueries` (force) with `invalidateQueries` (lazy) to stop flooding the backend on startup
- `App.tsx`: Change onboarding/login logic to use principal-scoped keys. When identity loads and profile exists in backend, skip onboarding entirely regardless of localStorage. When backend returns no profile, check principal-scoped key before showing onboarding.
- `TimerPanel.tsx`: Change `formatStopwatch` to show 3-digit milliseconds: `MM:SS.mmm`
- `PlannerTab.tsx`: Add `transformOrigin: 'center'` to outfit picker modal animation so it scales from center

### Remove
- Nothing removed

## Implementation Plan
1. Fix `useInternetIdentity.ts` — remove already-authenticated error block
2. Fix `useActor.ts` — replace `refetchQueries` with `invalidateQueries`
3. Fix `App.tsx` — use principal-scoped onboarding keys; skip onboarding for returning users who have a backend profile
4. Fix `TimerPanel.tsx` — update `formatStopwatch` to 3-digit ms
5. Fix `PlannerTab.tsx` — add `transformOrigin: 'center'` to outfit picker modal
