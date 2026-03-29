/* eslint-disable */

// @ts-nocheck

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    _blob?: Uint8Array<ArrayBuffer> | null;
    directURL: string;
    onProgress?: (percentage: number) => void = undefined;
    private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null){
        if (blob) { this._blob = blob; }
        this.directURL = directURL;
    }
    static fromURL(url: string): ExternalBlob {
        return new ExternalBlob(url, null);
    }
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
        const url = URL.createObjectURL(new Blob([new Uint8Array(blob)], { type: 'application/octet-stream' }));
        return new ExternalBlob(url, blob);
    }
    public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
        if (this._blob) return this._blob;
        const response = await fetch(this.directURL);
        const blob = await response.blob();
        this._blob = new Uint8Array(await blob.arrayBuffer());
        return this._blob;
    }
    public getDirectURL(): string { return this.directURL; }
    public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
        this.onProgress = onProgress;
        return this;
    }
}
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
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
}
import type { UserProfileView as _UserProfileView, UserRole as _UserRole } from "./declarations/backend.did.d.ts";
export class Backend implements backendInterface {
    constructor(private actor: ActorSubclass<_SERVICE>, private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, private processError?: (error: unknown) => never){}
    private async call<T>(fn: () => Promise<T>): Promise<T> {
        if (this.processError) {
            try { return await fn(); } catch (e) { this.processError(e); throw new Error("unreachable"); }
        }
        return fn();
    }
    async _initializeAccessControlWithSecret(arg0: string): Promise<void> {
        return this.call(() => this.actor._initializeAccessControlWithSecret(arg0));
    }
    async assignCallerUserRole(arg0: Principal, arg1: UserRole): Promise<void> {
        return this.call(() => this.actor.assignCallerUserRole(arg0, to_candid_UserRole(arg1)));
    }
    async createFinanceEntry(arg0: number, arg1: string, arg2: string, arg3: string, arg4: string): Promise<Entry> {
        return this.call(() => this.actor.createFinanceEntry(arg0, arg1, arg2, arg3, arg4));
    }
    async createTask(arg0: string, arg1: string, arg2: string): Promise<Task> {
        return this.call(() => this.actor.createTask(arg0, arg1, arg2));
    }
    async deleteEntry(arg0: EntryId): Promise<void> {
        return this.call(() => this.actor.deleteEntry(arg0));
    }
    async deleteTask(arg0: TaskId): Promise<void> {
        return this.call(() => this.actor.deleteTask(arg0));
    }
    async getAllEntries(): Promise<Array<Entry>> {
        return this.call(() => this.actor.getAllEntries());
    }
    async getAllTasks(): Promise<Array<Task>> {
        return this.call(() => this.actor.getAllTasks());
    }
    async getCallerUserProfile(): Promise<UserProfileView | null> {
        return this.call(async () => {
            const result = await this.actor.getCallerUserProfile();
            return result.length === 0 ? null : result[0];
        });
    }
    async getCallerUserRole(): Promise<UserRole> {
        return this.call(async () => {
            const result = await this.actor.getCallerUserRole();
            return from_candid_UserRole(result);
        });
    }
    async getSummary(): Promise<FinanceSummary> {
        return this.call(() => this.actor.getSummary());
    }
    async getUserProfile(arg0: Principal): Promise<UserProfileView | null> {
        return this.call(async () => {
            const result = await this.actor.getUserProfile(arg0);
            return result.length === 0 ? null : result[0];
        });
    }
    async isCallerAdmin(): Promise<boolean> {
        return this.call(() => this.actor.isCallerAdmin());
    }
    async listEntriesByType(arg0: string): Promise<Array<Entry>> {
        return this.call(() => this.actor.listEntriesByType(arg0));
    }
    async listTasksByDate(arg0: string): Promise<Array<Task>> {
        return this.call(() => this.actor.listTasksByDate(arg0));
    }
    async saveCallerUserProfile(arg0: UserProfileView): Promise<void> {
        return this.call(() => this.actor.saveCallerUserProfile(arg0));
    }
    async updatePreferences(arg0: string, arg1: boolean, arg2: string): Promise<void> {
        return this.call(() => this.actor.updatePreferences(arg0, arg1, arg2));
    }
    async updateTask(arg0: bigint, arg1: string, arg2: string, arg3: boolean): Promise<Task> {
        return this.call(() => this.actor.updateTask(arg0, arg1, arg2, arg3));
    }
    async createNote(arg0: string, arg1: string, arg2: bigint, arg3: Array<string>): Promise<Note> {
        return this.call(() => this.actor.createNote(arg0, arg1, arg2, arg3));
    }
    async updateNote(arg0: bigint, arg1: string, arg2: string, arg3: bigint, arg4: Array<string>): Promise<Note> {
        return this.call(() => this.actor.updateNote(arg0, arg1, arg2, arg3, arg4));
    }
    async deleteNote(arg0: bigint): Promise<void> {
        return this.call(() => this.actor.deleteNote(arg0));
    }
    async getAllNotes(): Promise<Array<Note>> {
        return this.call(() => this.actor.getAllNotes());
    }
    async createFolder(arg0: string, arg1: string): Promise<Folder> {
        return this.call(() => this.actor.createFolder(arg0, arg1));
    }
    async deleteFolder(arg0: bigint): Promise<void> {
        return this.call(() => this.actor.deleteFolder(arg0));
    }
    async getAllFolders(): Promise<Array<Folder>> {
        return this.call(() => this.actor.getAllFolders());
    }
    async createOutfit(arg0: string, arg1: string, arg2: string, arg3: string, arg4: Array<string>): Promise<Outfit> {
        return this.call(() => this.actor.createOutfit(arg0, arg1, arg2, arg3, arg4));
    }
    async updateOutfit(arg0: bigint, arg1: string, arg2: string, arg3: string, arg4: string, arg5: Array<string>): Promise<Outfit> {
        return this.call(() => this.actor.updateOutfit(arg0, arg1, arg2, arg3, arg4, arg5));
    }
    async deleteOutfit(arg0: bigint): Promise<void> {
        return this.call(() => this.actor.deleteOutfit(arg0));
    }
    async getAllOutfits(): Promise<Array<Outfit>> {
        return this.call(() => this.actor.getAllOutfits());
    }
    async createClothingItem(arg0: string, arg1: string, arg2: string): Promise<ClothingItem> {
        return this.call(() => this.actor.createClothingItem(arg0, arg1, arg2));
    }
    async updateClothingItem(arg0: bigint, arg1: string, arg2: string, arg3: string): Promise<ClothingItem> {
        return this.call(() => this.actor.updateClothingItem(arg0, arg1, arg2, arg3));
    }
    async deleteClothingItem(arg0: bigint): Promise<void> {
        return this.call(() => this.actor.deleteClothingItem(arg0));
    }
    async getAllClothingItems(): Promise<Array<ClothingItem>> {
        return this.call(() => this.actor.getAllClothingItems());
    }
    async setPlannerDayOutfit(arg0: string, arg1: bigint): Promise<PlannerDayOutfit> {
        return this.call(() => this.actor.setPlannerDayOutfit(arg0, arg1));
    }
    async deletePlannerDayOutfit(arg0: string): Promise<void> {
        return this.call(() => this.actor.deletePlannerDayOutfit(arg0));
    }
    async getPlannerDayOutfit(arg0: string): Promise<PlannerDayOutfit | null> {
        return this.call(async () => {
            const result = await this.actor.getPlannerDayOutfit(arg0);
            return result.length === 0 ? null : result[0];
        });
    }
    async getAllPlannerDayOutfits(): Promise<Array<PlannerDayOutfit>> {
        return this.call(() => this.actor.getAllPlannerDayOutfits());
    }
}
function from_candid_UserRole(value: _UserRole): UserRole {
    return "admin" in value ? UserRole.admin : "user" in value ? UserRole.user : UserRole.guest;
}
function to_candid_UserRole(value: UserRole): _UserRole {
    return value === UserRole.admin ? { admin: null } : value === UserRole.user ? { user: null } : { guest: null };
}
export interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
    processError?: (error: unknown) => never;
}
export function createActor(canisterId: string, _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, options: CreateActorOptions = {}): Backend {
    const agent = options.agent || HttpAgent.createSync({ ...options.agentOptions });
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    const actor = Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId, ...options.actorOptions });
    return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
