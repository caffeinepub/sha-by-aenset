// Wrapper around the core-infrastructure useActor hook.
// Binds the app's createActor function (from backend.ts) and exposes a fully-typed actor.
// Also adds periodic re-registration so post-deployment auth resets are recovered automatically.
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { useEffect, useRef } from "react";
import { createActor } from "../backend";
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

/** Fully-typed interface for all backend actor methods used by this app. */
export interface BackendActor {
  // Profile
  getCallerUserProfile(): Promise<UserProfileView | null>;
  saveCallerUserProfile(profile: UserProfileView): Promise<void>;
  updatePreferences(
    language: string,
    darkMode: boolean,
    geminiApiKey: string,
  ): Promise<void>;

  // Tasks
  getAllTasks(): Promise<Task[]>;
  listTasksByDate(date: string): Promise<Task[]>;
  createTask(title: string, description: string, date: string): Promise<Task>;
  updateTask(
    taskId: bigint,
    title: string,
    description: string,
    completed: boolean,
  ): Promise<Task>;
  deleteTask(taskId: bigint): Promise<void>;

  // Finance
  getAllEntries(): Promise<Entry[]>;
  createFinanceEntry(
    amount: number,
    entryType: string,
    category: string,
    description: string,
    date: string,
  ): Promise<Entry>;
  deleteEntry(entryId: bigint): Promise<void>;
  getSummary(): Promise<FinanceSummary>;

  // Notes
  getAllNotes(): Promise<Note[]>;
  createNote(
    title: string,
    body: string,
    folderId: bigint,
    tags: string[],
  ): Promise<Note>;
  updateNote(
    noteId: bigint,
    title: string,
    body: string,
    folderId: bigint,
    tags: string[],
  ): Promise<Note>;
  deleteNote(noteId: bigint): Promise<void>;

  // Folders
  getAllFolders(): Promise<Folder[]>;
  createFolder(name: string, color: string): Promise<Folder>;
  deleteFolder(folderId: bigint): Promise<void>;

  // Outfits
  getAllOutfits(): Promise<Outfit[]>;
  createOutfit(
    name: string,
    occasion: string,
    description: string,
    photoUrl: string,
    tags: string[],
  ): Promise<Outfit>;
  updateOutfit(
    outfitId: bigint,
    name: string,
    occasion: string,
    description: string,
    photoUrl: string,
    tags: string[],
  ): Promise<Outfit>;
  deleteOutfit(outfitId: bigint): Promise<void>;

  // Clothing
  getAllClothingItems(): Promise<ClothingItem[]>;
  createClothingItem(
    name: string,
    category: string,
    photoUrl: string,
  ): Promise<ClothingItem>;
  updateClothingItem(
    itemId: bigint,
    name: string,
    category: string,
    photoUrl: string,
  ): Promise<ClothingItem>;
  deleteClothingItem(itemId: bigint): Promise<void>;

  // Planner outfits
  getAllPlannerDayOutfits(): Promise<PlannerDayOutfit[]>;
  setPlannerDayOutfit(
    date: string,
    outfitId: bigint,
  ): Promise<PlannerDayOutfit>;
  deletePlannerDayOutfit(date: string): Promise<void>;

  // Routines
  getAllRoutines(): Promise<Routine[]>;
  createRoutine(name: string, timeOfDay: string): Promise<Routine>;
  updateRoutine(
    routineId: bigint,
    name: string,
    timeOfDay: string,
  ): Promise<Routine>;
  deleteRoutine(routineId: bigint): Promise<void>;
  setRoutineCompletion(
    date: string,
    completedRoutineIds: bigint[],
  ): Promise<RoutineCompletion>;
  getAllRoutineCompletions(): Promise<RoutineCompletion[]>;

  // Gym state
  getUserGymState(): Promise<string | null>;
  saveUserGymState(json: string): Promise<void>;

  // Access control (internal — called for re-registration after canister deploys)
  _initializeAccessControl(): Promise<void>;
}

const RE_REGISTER_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export function useActor(): {
  actor: BackendActor | null;
  isFetching: boolean;
} {
  const result = _useActor(createActor);
  const typedActor = result.actor as unknown as BackendActor | null;

  // Keep a stable ref to the actor so the interval/focus handler always
  // calls the most recent version without needing to re-register them.
  const actorRef = useRef<BackendActor | null>(typedActor);
  actorRef.current = typedActor;

  useEffect(() => {
    function reRegister() {
      const a = actorRef.current;
      if (!a) return;
      a._initializeAccessControl().catch((err: unknown) => {
        console.warn("[useActor] re-registration failed:", err);
      });
    }

    const intervalId = setInterval(reRegister, RE_REGISTER_INTERVAL_MS);
    window.addEventListener("focus", reRegister);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", reRegister);
    };
  }, []); // intentionally empty — interval/focus listener registered once

  return {
    actor: typedActor,
    isFetching: result.isFetching,
  };
}
