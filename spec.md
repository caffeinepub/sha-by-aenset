# Sha by Aenset

## Current State
The app has several critical bugs causing lag, data not saving/loading, and potential infinite loops.

## Requested Changes (Diff)

### Add
- Periodic actor re-registration every 5 minutes and on window focus (prevents "User is not registered" after deploys)
- QueryClient config: staleTime 5min, gcTime 10min to reduce unnecessary refetches

### Modify
1. **main.tsx**: Fix BigInt.prototype.toJSON to return `"__bigint__${this.toString()}"` instead of `this.toString()` -- this is the root cause of all cache ID mismatch bugs (cached IDs come back as string "123" instead of BigInt 123n, breaking deletes/updates)
2. **useInternetIdentity.ts**: Fix infinite loop -- the useEffect depends on `authClient` which it sets internally, causing perpetual re-initialization. Remove `authClient` from the dependency array, use a `useRef` to track if initialized.
3. **useInternetIdentity.ts**: Remove the "User is already authenticated" error block in `login()` -- this silently blocks re-login for returning users
4. **useActor.ts**: Remove `refetchQueries` call (forces immediate network flood) -- keep only `invalidateQueries` (lazy, fetches on demand)
5. **useActor.ts**: Add periodic re-registration every 5 minutes and on window focus
6. **main.tsx**: Configure QueryClient with `defaultOptions: { queries: { staleTime: 5*60*1000, gcTime: 10*60*1000 } }` to reduce redundant backend calls

### Remove
- Nothing removed

## Implementation Plan
1. Fix BigInt.prototype.toJSON in main.tsx (critical for cache correctness)
2. Fix useInternetIdentity.ts infinite loop and login block
3. Fix useActor.ts flood and add re-registration
4. Set QueryClient defaults for better caching
5. Validate build
