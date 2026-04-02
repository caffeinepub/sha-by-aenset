import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
// Re-register every 3 minutes to recover from canister redeployments
const REREGISTER_INTERVAL_MS = 3 * 60 * 1000;

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const didRegisterRef = useRef(false);

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: { identity },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      didRegisterRef.current = true;
      return actor;
    },
    // Keep actor alive; it re-initializes when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When actor is first ready, lazily invalidate dependent queries
  // (do NOT force-refetch immediately — that floods the backend)
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  // Periodically re-register access control so post-deploy auth resets are recovered
  useEffect(() => {
    if (!identity || !actorQuery.data) return;

    const reRegister = async () => {
      try {
        const adminToken = getSecretParameter("caffeineAdminToken") || "";
        await actorQuery.data._initializeAccessControlWithSecret(adminToken);
      } catch {
        // If re-registration fails, invalidate actor so it rebuilds
        queryClient.invalidateQueries({ queryKey: [ACTOR_QUERY_KEY] });
      }
    };

    const interval = setInterval(reRegister, REREGISTER_INTERVAL_MS);

    const handleFocus = () => {
      void reRegister();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [identity, actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
