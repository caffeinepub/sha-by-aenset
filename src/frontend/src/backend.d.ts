import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Entry {
    id: bigint;
    entryType: string;
    date: string;
    description: string;
    timestamp: Time;
    category: string;
    amount: number;
}
export type Time = bigint;
export type EntryId = bigint;
export interface Preferences {
    geminiApiKey: string;
    language: string;
    darkMode: boolean;
}
export type User = Principal;
export interface UserProfileView {
    tasks: Array<Task>;
    name: string;
    email: string;
    preferences: Preferences;
    registrationTime: Time;
    finances: Array<Entry>;
}
export interface Task {
    id: bigint;
    title: string;
    date: string;
    user: User;
    completed: boolean;
    description: string;
    timestamp: Time;
}
export type TaskId = bigint;
export interface FinanceSummary {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
}
export interface Note {
    id: bigint;
    title: string;
    body: string;
    folderId: bigint;
    tags: Array<string>;
    timestamp: Time;
}
export interface Folder {
    id: bigint;
    name: string;
    color: string;
    timestamp: Time;
}
export interface Outfit {
    id: bigint;
    name: string;
    occasion: string;
    description: string;
    photoUrl: string;
    tags: Array<string>;
    timestamp: Time;
}
export interface ClothingItem {
    id: bigint;
    name: string;
    category: string;
    photoUrl: string;
    timestamp: Time;
}
export interface PlannerDayOutfit {
    date: string;
    outfitId: bigint;
}
export interface Routine {
    id: bigint;
    name: string;
    timeOfDay: string;
    timestamp: Time;
}
export interface RoutineCompletion {
    date: string;
    completedRoutineIds: Array<bigint>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFinanceEntry(amount: number, entryType: string, category: string, description: string, date: string): Promise<Entry>;
    createTask(title: string, description: string, date: string): Promise<Task>;
    deleteEntry(entryId: EntryId): Promise<void>;
    deleteTask(taskId: TaskId): Promise<void>;
    getAllEntries(): Promise<Array<Entry>>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<UserProfileView | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSummary(): Promise<FinanceSummary>;
    getUserProfile(user: Principal): Promise<UserProfileView | null>;
    isCallerAdmin(): Promise<boolean>;
    listEntriesByType(entryType: string): Promise<Array<Entry>>;
    listTasksByDate(date: string): Promise<Array<Task>>;
    saveCallerUserProfile(profile: UserProfileView): Promise<void>;
    updatePreferences(language: string, darkMode: boolean, geminiApiKey: string): Promise<void>;
    updateTask(taskId: bigint, title: string, description: string, completed: boolean): Promise<Task>;
    createNote(title: string, body: string, folderId: bigint, tags: Array<string>): Promise<Note>;
    updateNote(noteId: bigint, title: string, body: string, folderId: bigint, tags: Array<string>): Promise<Note>;
    deleteNote(noteId: bigint): Promise<void>;
    getAllNotes(): Promise<Array<Note>>;
    createFolder(name: string, color: string): Promise<Folder>;
    deleteFolder(folderId: bigint): Promise<void>;
    getAllFolders(): Promise<Array<Folder>>;
    createOutfit(name: string, occasion: string, description: string, photoUrl: string, tags: Array<string>): Promise<Outfit>;
    updateOutfit(outfitId: bigint, name: string, occasion: string, description: string, photoUrl: string, tags: Array<string>): Promise<Outfit>;
    deleteOutfit(outfitId: bigint): Promise<void>;
    getAllOutfits(): Promise<Array<Outfit>>;
    createClothingItem(name: string, category: string, photoUrl: string): Promise<ClothingItem>;
    updateClothingItem(itemId: bigint, name: string, category: string, photoUrl: string): Promise<ClothingItem>;
    deleteClothingItem(itemId: bigint): Promise<void>;
    getAllClothingItems(): Promise<Array<ClothingItem>>;
    setPlannerDayOutfit(date: string, outfitId: bigint): Promise<PlannerDayOutfit>;
    deletePlannerDayOutfit(date: string): Promise<void>;
    getPlannerDayOutfit(date: string): Promise<PlannerDayOutfit | null>;
    getAllPlannerDayOutfits(): Promise<Array<PlannerDayOutfit>>;
    createRoutine(name: string, timeOfDay: string): Promise<Routine>;
    updateRoutine(routineId: bigint, name: string, timeOfDay: string): Promise<Routine>;
    deleteRoutine(routineId: bigint): Promise<void>;
    getAllRoutines(): Promise<Array<Routine>>;
    setRoutineCompletion(date: string, completedRoutineIds: Array<bigint>): Promise<RoutineCompletion>;
    getRoutineCompletion(date: string): Promise<RoutineCompletion | null>;
    getAllRoutineCompletions(): Promise<Array<RoutineCompletion>>;
}
