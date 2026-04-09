import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ClothingItem,
  Entry,
  FinanceSummary,
  Folder,
  Note,
  Outfit,
  PlannerDayOutfit,
  Routine,
  RoutineCompletion,
  Task,
  UserProfileView,
} from "../types";
import { CACHE_KEYS, localCache } from "../utils/localCache";
import { useActor } from "./useActor";

const STALE_TIME = 2 * 60 * 1000;

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Something went wrong. Please try again.";
}

export function useGetAllTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return localCache.get<Task[]>(CACHE_KEYS.tasks) ?? [];
      const data = await actor.getAllTasks();
      localCache.set(CACHE_KEYS.tasks, data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
    initialData: () => localCache.get<Task[]>(CACHE_KEYS.tasks) ?? [],
  });
}

export function useListTasksByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTasksByDate(date);
    },
    enabled: !!actor && !isFetching && !!date,
    staleTime: STALE_TIME,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      title: string;
      description: string;
      date: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createTask(vars.title, vars.description, vars.date);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      taskId: bigint;
      title: string;
      description: string;
      completed: boolean;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateTask(
        vars.taskId,
        vars.title,
        vars.description,
        vars.completed,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteTask(taskId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<Entry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return localCache.get<Entry[]>(CACHE_KEYS.entries) ?? [];
      const data = await actor.getAllEntries();
      localCache.set(CACHE_KEYS.entries, data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
    initialData: () => localCache.get<Entry[]>(CACHE_KEYS.entries) ?? [],
  });
}

export function useGetSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<FinanceSummary>({
    queryKey: ["summary"],
    queryFn: async () => {
      if (!actor) return { balance: 0, totalIncome: 0, totalExpenses: 0 };
      return actor.getSummary();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
  });
}

export function useCreateEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      amount: number;
      entryType: string;
      category: string;
      description: string;
      date: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createFinanceEntry(
        vars.amount,
        vars.entryType,
        vars.category,
        vars.description,
        vars.date,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteEntry(entryId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfileView | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfileView) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useUpdatePreferences() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      language: string;
      darkMode: boolean;
      geminiApiKey: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updatePreferences(
        vars.language,
        vars.darkMode,
        vars.geminiApiKey,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetAllNotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return localCache.get<Note[]>(CACHE_KEYS.notes) ?? [];
      const data = await actor.getAllNotes();
      localCache.set(CACHE_KEYS.notes, data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
    initialData: () => localCache.get<Note[]>(CACHE_KEYS.notes) ?? [],
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteNote(noteId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useCreateNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      title: string;
      body: string;
      folderId: bigint;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createNote(vars.title, vars.body, vars.folderId, vars.tags);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useUpdateNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      noteId: bigint;
      title: string;
      body: string;
      folderId: bigint;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateNote(
        vars.noteId,
        vars.title,
        vars.body,
        vars.folderId,
        vars.tags,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetAllFolders() {
  const { actor, isFetching } = useActor();
  return useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      if (!actor) return localCache.get<Folder[]>(CACHE_KEYS.folders) ?? [];
      const data = await actor.getAllFolders();
      localCache.set(CACHE_KEYS.folders, data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
    initialData: () => localCache.get<Folder[]>(CACHE_KEYS.folders) ?? [],
  });
}

export function useCreateFolder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; color: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createFolder(vars.name, vars.color);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useDeleteFolder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (folderId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteFolder(folderId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetAllOutfits() {
  const { actor, isFetching } = useActor();
  return useQuery<Outfit[]>({
    queryKey: ["outfits"],
    queryFn: async () => {
      if (!actor) return localCache.get<Outfit[]>(CACHE_KEYS.outfits) ?? [];
      const data = await actor.getAllOutfits();
      localCache.set(CACHE_KEYS.outfits, data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
    initialData: () => localCache.get<Outfit[]>(CACHE_KEYS.outfits) ?? [],
  });
}

export function useCreateOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      name: string;
      occasion: string;
      description: string;
      photoUrl: string;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createOutfit(
        vars.name,
        vars.occasion,
        vars.description,
        vars.photoUrl,
        vars.tags,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useUpdateOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      outfitId: bigint;
      name: string;
      occasion: string;
      description: string;
      photoUrl: string;
      tags: string[];
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateOutfit(
        vars.outfitId,
        vars.name,
        vars.occasion,
        vars.description,
        vars.photoUrl,
        vars.tags,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useDeleteOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (outfitId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteOutfit(outfitId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetAllClothingItems() {
  const { actor, isFetching } = useActor();
  return useQuery<ClothingItem[]>({
    queryKey: ["clothing"],
    queryFn: async () => {
      if (!actor)
        return localCache.get<ClothingItem[]>(CACHE_KEYS.clothing) ?? [];
      const data = await actor.getAllClothingItems();
      localCache.set(CACHE_KEYS.clothing, data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
    initialData: () =>
      localCache.get<ClothingItem[]>(CACHE_KEYS.clothing) ?? [],
  });
}

export function useCreateClothingItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      name: string;
      category: string;
      photoUrl: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createClothingItem(vars.name, vars.category, vars.photoUrl);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clothing"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useUpdateClothingItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      itemId: bigint;
      name: string;
      category: string;
      photoUrl: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateClothingItem(
        vars.itemId,
        vars.name,
        vars.category,
        vars.photoUrl,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clothing"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useDeleteClothingItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteClothingItem(itemId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clothing"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetAllPlannerDayOutfits() {
  const { actor, isFetching } = useActor();
  return useQuery<PlannerDayOutfit[]>({
    queryKey: ["plannerOutfits"],
    queryFn: async () => {
      if (!actor)
        return (
          localCache.get<PlannerDayOutfit[]>(CACHE_KEYS.plannerOutfits) ?? []
        );
      const data = await actor.getAllPlannerDayOutfits();
      localCache.set(CACHE_KEYS.plannerOutfits, data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
    initialData: () =>
      localCache.get<PlannerDayOutfit[]>(CACHE_KEYS.plannerOutfits) ?? [],
  });
}

export function useSetPlannerDayOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { date: string; outfitId: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.setPlannerDayOutfit(vars.date, vars.outfitId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plannerOutfits"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useDeletePlannerDayOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deletePlannerDayOutfit(date);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plannerOutfits"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

// ── Routine hooks ────────────────────────────────────────────────────────────────────────

export function useGetAllRoutines() {
  const { actor, isFetching } = useActor();
  return useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRoutines();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
  });
}

export function useCreateRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; timeOfDay: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createRoutine(vars.name, vars.timeOfDay);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useUpdateRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      routineId: bigint;
      name: string;
      timeOfDay: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateRoutine(vars.routineId, vars.name, vars.timeOfDay);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useDeleteRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routineId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteRoutine(routineId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useSetRoutineCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { date: string; completedRoutineIds: bigint[] }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.setRoutineCompletion(vars.date, vars.completedRoutineIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routineCompletions"] }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useGetAllRoutineCompletions() {
  const { actor, isFetching } = useActor();
  return useQuery<RoutineCompletion[]>({
    queryKey: ["routineCompletions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRoutineCompletions();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
  });
}

// ── Gym State hooks ────────────────────────────────────────────────────────────────────────

export function useGetGymState() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["gymState"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserGymState();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
  });
}

export function useSaveGymState() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (json: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveUserGymState(json);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gymState"] }),
    onError: (e) =>
      console.error("Failed to save gym state to ICP:", extractErrorMessage(e)),
  });
}
