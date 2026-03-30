# Sha by Aenset

## Current State
App has 7 tabs (Home, Notes, Planner, Finance, Wardrobe, Gym, Profile). ICP/Motoko backend stores tasks, finance entries, notes, folders, outfits, clothing, routines. GymTab stores all data in localStorage only with no ICP persistence.

## Requested Changes (Diff)

### Add
- GymTab backend persistence: gymDays, gymExercises, gymSessions, gymWeekSchedule stored to ICP backend via a new `gymStateJson` user-keyed store in the backend
- Window focus re-registration for actor (refetchOnWindowFocus)

### Modify
- `main.tsx`: Fix BigInt.prototype.toJSON to produce `__bigint__<value>` strings so the localCache reviver can restore them correctly
- `useActor.ts`: Reduce staleTime from Infinity to 3 minutes so actor re-registers after deployments; replace `refetchQueries` with `invalidateQueries` to avoid flooding; add `refetchOnWindowFocus: true`
- Backend `main.mo`: Add `saveUserGymState(json: Text)` and `getUserGymState()` endpoints to persist arbitrary gym JSON per user without changing existing types
- `GymTab.tsx`: On load, read from ICP gym state first (then fall back to localStorage); on every save, persist to ICP in background
- `useQueries.ts`: Add `useGetGymState` and `useSaveGymState` hooks
- `backend.d.ts` and `backend.did.d.ts` and `backend.did.js` and `backend.ts`: Add new gym state endpoints

### Remove
- `refetchQueries` call from `useActor.ts` (replaced with invalidateQueries only)

## Implementation Plan
1. Update `main.mo` to add gym state endpoints
2. Update `backend.did.js`, `backend.did.d.ts`, `backend.ts`, `backend.d.ts` to expose new endpoints
3. Update `useQueries.ts` to add gym state hooks
4. Update `main.tsx` BigInt fix
5. Update `useActor.ts` staleTime and refetch behavior
6. Update `GymTab.tsx` to use ICP persistence
