import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
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
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { title: string; description: string; date: string }) =>
      actor!.createTask(vars.title, vars.description, vars.date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
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
    }) =>
      actor!.updateTask(
        vars.taskId,
        vars.title,
        vars.description,
        vars.completed,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: bigint) => actor!.deleteTask(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<Entry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntries();
    },
    enabled: !!actor && !isFetching,
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
    }) =>
      actor!.createFinanceEntry(
        vars.amount,
        vars.entryType,
        vars.category,
        vars.description,
        vars.date,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: bigint) => actor!.deleteEntry(entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entries"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
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
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfileView) =>
      actor!.saveCallerUserProfile(profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
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
    }) =>
      actor!.updatePreferences(vars.language, vars.darkMode, vars.geminiApiKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useGetAllNotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as any;
      if (typeof a.getAllNotes !== "function") return [];
      return a.getAllNotes() as Promise<Note[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteNote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: bigint) => {
      const a = actor as any;
      return a.deleteNote(noteId) as Promise<void>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
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
      const a = actor as any;
      return a.createNote(
        vars.title,
        vars.body,
        vars.folderId,
        vars.tags,
      ) as Promise<any>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useGetAllFolders() {
  const { actor, isFetching } = useActor();
  return useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as any;
      if (typeof a.getAllFolders !== "function") return [];
      return a.getAllFolders() as Promise<Folder[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllOutfits() {
  const { actor, isFetching } = useActor();
  return useQuery<Outfit[]>({
    queryKey: ["outfits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOutfits();
    },
    enabled: !!actor && !isFetching,
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
    }) =>
      actor!.createOutfit(
        vars.name,
        vars.occasion,
        vars.description,
        vars.photoUrl,
        vars.tags,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
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
    }) =>
      actor!.updateOutfit(
        vars.outfitId,
        vars.name,
        vars.occasion,
        vars.description,
        vars.photoUrl,
        vars.tags,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
  });
}

export function useDeleteOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (outfitId: bigint) => actor!.deleteOutfit(outfitId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outfits"] }),
  });
}

export function useGetAllClothingItems() {
  const { actor, isFetching } = useActor();
  return useQuery<ClothingItem[]>({
    queryKey: ["clothing"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllClothingItems();
    },
    enabled: !!actor && !isFetching,
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
      return actor!.createClothingItem(vars.name, vars.category, vars.photoUrl);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clothing"] }),
  });
}

export function useDeleteClothingItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: bigint) => actor!.deleteClothingItem(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clothing"] }),
  });
}

export function useGetAllPlannerDayOutfits() {
  const { actor, isFetching } = useActor();
  return useQuery<PlannerDayOutfit[]>({
    queryKey: ["plannerOutfits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlannerDayOutfits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPlannerDayOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { date: string; outfitId: bigint }) => {
      return actor!.setPlannerDayOutfit(vars.date, vars.outfitId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plannerOutfits"] }),
  });
}

export function useDeletePlannerDayOutfit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => actor!.deletePlannerDayOutfit(date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plannerOutfits"] }),
  });
}

// ── Routine hooks ──────────────────────────────────────────────────────────────

export function useGetAllRoutines() {
  const { actor, isFetching } = useActor();
  return useQuery<Routine[]>({
    queryKey: ["routines"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as any;
      if (typeof a.getAllRoutines !== "function") return [];
      return a.getAllRoutines() as Promise<Routine[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; timeOfDay: string }) =>
      (actor as any).createRoutine(vars.name, vars.timeOfDay),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
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
    }) =>
      (actor as any).updateRoutine(vars.routineId, vars.name, vars.timeOfDay),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useDeleteRoutine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routineId: bigint) => (actor as any).deleteRoutine(routineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useSetRoutineCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { date: string; completedRoutineIds: bigint[] }) =>
      (actor as any).setRoutineCompletion(vars.date, vars.completedRoutineIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routineCompletions"] }),
  });
}

export function useGetAllRoutineCompletions() {
  const { actor, isFetching } = useActor();
  return useQuery<RoutineCompletion[]>({
    queryKey: ["routineCompletions"],
    queryFn: async () => {
      if (!actor) return [];
      const a2 = actor as any;
      if (typeof a2.getAllRoutineCompletions !== "function") return [];
      return a2.getAllRoutineCompletions() as Promise<RoutineCompletion[]>;
    },
    enabled: !!actor && !isFetching,
  });
}
