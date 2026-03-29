import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Bool "mo:core/Bool";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type User = Principal;

  module Task {
    public type Task = {
      id : Nat;
      user : User;
      title : Text;
      description : Text;
      completed : Bool;
      date : Text;
      timestamp : Time.Time;
    };
    public func compareByTime(t1 : Task, t2 : Task) : Order.Order {
      Int.compare(t1.timestamp, t2.timestamp);
    };
  };

  module TaskId {
    public type TaskId = Nat;
  };

  module Preferences {
    public type Preferences = {
      darkMode : Bool;
      language : Text;
      geminiApiKey : Text;
    };
  };

  module Tasks {
    public type Tasks = Map.Map<Nat, Task.Task>;
    public func empty() : Tasks {
      Map.empty<Nat, Task.Task>();
    };
  };

  module Entry {
    public type Entry = {
      id : Nat;
      amount : Float;
      category : Text;
      entryType : Text;
      timestamp : Time.Time;
      description : Text;
      date : Text;
    };
    public func compare(e1 : Entry, e2 : Entry) : Order.Order {
      Int.compare(e1.timestamp, e2.timestamp);
    };
  };

  module EntryId {
    public type EntryId = Nat;
  };

  module Finances {
    public type Finances = Map.Map<Nat, Entry.Entry>;
    public func empty() : Finances {
      Map.empty<Nat, Entry.Entry>();
    };
  };

  module Folder {
    public type Folder = {
      id : Nat;
      name : Text;
      color : Text;
      timestamp : Time.Time;
    };
  };

  module Note {
    public type Note = {
      id : Nat;
      title : Text;
      body : Text;
      folderId : Nat;
      tags : [Text];
      timestamp : Time.Time;
    };
    public func compareByTimeDesc(n1 : Note, n2 : Note) : Order.Order {
      Int.compare(n2.timestamp, n1.timestamp);
    };
  };

  module Outfit {
    public type Outfit = {
      id : Nat;
      name : Text;
      occasion : Text;
      description : Text;
      photoUrl : Text;
      tags : [Text];
      timestamp : Time.Time;
    };
    public func compareByTimeDesc(o1 : Outfit, o2 : Outfit) : Order.Order {
      Int.compare(o2.timestamp, o1.timestamp);
    };
  };

  module ClothingItem {
    public type ClothingItem = {
      id : Nat;
      name : Text;
      category : Text;
      photoUrl : Text;
      timestamp : Time.Time;
    };
    public func compareByTimeDesc(a : ClothingItem, b : ClothingItem) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  module PlannerDayOutfit {
    public type PlannerDayOutfit = {
      date : Text;
      outfitId : Nat;
    };
  };

  module Routine {
    public type Routine = {
      id : Nat;
      name : Text;
      timeOfDay : Text;
      timestamp : Time.Time;
    };
    public func compareByTime(a : Routine, b : Routine) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  module RoutineCompletion {
    public type RoutineCompletion = {
      date : Text;
      completedRoutineIds : [Nat];
    };
  };

  module UserProfile {
    public type UserProfile = {
      name : Text;
      email : Text;
      preferences : Preferences.Preferences;
      tasks : Tasks.Tasks;
      finances : Finances.Finances;
      registrationTime : Time.Time;
    };
  };

  module UserProfileView {
    public type UserProfileView = {
      name : Text;
      email : Text;
      preferences : Preferences.Preferences;
      tasks : [Task.Task];
      finances : [Entry.Entry];
      registrationTime : Time.Time;
    };
    public func fromUserProfile(profile : UserProfile.UserProfile) : UserProfileView {
      {
        name = profile.name;
        email = profile.email;
        preferences = profile.preferences;
        tasks = profile.tasks.values().toArray();
        finances = profile.finances.values().toArray();
        registrationTime = profile.registrationTime;
      };
    };
  };

  module AppState {
    public type AppState = {
      var userProfiles : Map.Map<User, UserProfile.UserProfile>;
      var taskIdCounter : Nat;
      var entryIdCounter : Nat;
    };
    public func empty() : AppState {
      {
        var userProfiles = Map.empty<User, UserProfile.UserProfile>();
        var taskIdCounter = 0;
        var entryIdCounter = 0;
      };
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let appState : AppState.AppState = AppState.empty();

  var noteIdCounter : Nat = 0;
  var folderIdCounter : Nat = 0;
  var outfitIdCounter : Nat = 0;
  var clothingItemIdCounter : Nat = 0;
  var routineIdCounter : Nat = 0;

  var userNotes : Map.Map<User, Map.Map<Nat, Note.Note>> = Map.empty<User, Map.Map<Nat, Note.Note>>();
  var userFolders : Map.Map<User, Map.Map<Nat, Folder.Folder>> = Map.empty<User, Map.Map<Nat, Folder.Folder>>();
  var userOutfits : Map.Map<User, Map.Map<Nat, Outfit.Outfit>> = Map.empty<User, Map.Map<Nat, Outfit.Outfit>>();
  var userClothingItems : Map.Map<User, Map.Map<Nat, ClothingItem.ClothingItem>> = Map.empty<User, Map.Map<Nat, ClothingItem.ClothingItem>>();
  var userPlannerOutfits : Map.Map<User, Map.Map<Text, PlannerDayOutfit.PlannerDayOutfit>> = Map.empty<User, Map.Map<Text, PlannerDayOutfit.PlannerDayOutfit>>();
  var userRoutines : Map.Map<User, Map.Map<Nat, Routine.Routine>> = Map.empty<User, Map.Map<Nat, Routine.Routine>>();
  var userRoutineCompletions : Map.Map<User, Map.Map<Text, RoutineCompletion.RoutineCompletion>> = Map.empty<User, Map.Map<Text, RoutineCompletion.RoutineCompletion>>();

  func getOrCreateProfile(caller : User) : UserProfile.UserProfile {
    switch (appState.userProfiles.get(caller)) {
      case (?profile) { profile };
      case (null) {
        {
          name = "";
          email = "";
          preferences = { darkMode = false; language = "en"; geminiApiKey = "" };
          tasks = Map.empty<Nat, Task.Task>();
          finances = Map.empty<Nat, Entry.Entry>();
          registrationTime = Time.now();
        };
      };
    };
  };

  func getUserNotes(caller : User) : Map.Map<Nat, Note.Note> {
    switch (userNotes.get(caller)) {
      case (?notes) { notes };
      case (null) { Map.empty<Nat, Note.Note>() };
    };
  };

  func getUserFolders(caller : User) : Map.Map<Nat, Folder.Folder> {
    switch (userFolders.get(caller)) {
      case (?folders) { folders };
      case (null) { Map.empty<Nat, Folder.Folder>() };
    };
  };

  func getUserOutfits(caller : User) : Map.Map<Nat, Outfit.Outfit> {
    switch (userOutfits.get(caller)) {
      case (?outfits) { outfits };
      case (null) { Map.empty<Nat, Outfit.Outfit>() };
    };
  };

  func getUserClothingItems(caller : User) : Map.Map<Nat, ClothingItem.ClothingItem> {
    switch (userClothingItems.get(caller)) {
      case (?items) { items };
      case (null) { Map.empty<Nat, ClothingItem.ClothingItem>() };
    };
  };

  func getUserPlannerOutfits(caller : User) : Map.Map<Text, PlannerDayOutfit.PlannerDayOutfit> {
    switch (userPlannerOutfits.get(caller)) {
      case (?map) { map };
      case (null) { Map.empty<Text, PlannerDayOutfit.PlannerDayOutfit>() };
    };
  };

  func getUserRoutines(caller : User) : Map.Map<Nat, Routine.Routine> {
    switch (userRoutines.get(caller)) {
      case (?map) { map };
      case (null) { Map.empty<Nat, Routine.Routine>() };
    };
  };

  func getUserRoutineCompletions(caller : User) : Map.Map<Text, RoutineCompletion.RoutineCompletion> {
    switch (userRoutineCompletions.get(caller)) {
      case (?map) { map };
      case (null) { Map.empty<Text, RoutineCompletion.RoutineCompletion>() };
    };
  };

  // User Profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileView.UserProfileView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) { ?UserProfileView.fromUserProfile(profile) };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfileView.UserProfileView {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(user)) {
      case (?profile) { ?UserProfileView.fromUserProfile(profile) };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfileView.UserProfileView) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let existing = getOrCreateProfile(caller);
    let newProfile : UserProfile.UserProfile = {
      profile with
      tasks = existing.tasks;
      finances = existing.finances;
    };
    appState.userProfiles.add(caller, newProfile);
  };

  // Tasks
  public shared ({ caller }) func createTask(title : Text, description : Text, date : Text) : async Task.Task {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let taskId = appState.taskIdCounter;
    let newTask = { id = taskId; user = caller; title; description; completed = false; date; timestamp = Time.now() };
    let profile = getOrCreateProfile(caller);
    let updatedTasks = profile.tasks.clone();
    updatedTasks.add(taskId, newTask);
    appState.userProfiles.add(caller, { profile with tasks = updatedTasks });
    appState.taskIdCounter += 1;
    newTask;
  };

  public shared ({ caller }) func updateTask(taskId : Nat, title : Text, description : Text, completed : Bool) : async Task.Task {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.tasks.get(taskId)) {
          case (?existingTask) {
            let updatedTask = { id = taskId; user = caller; title; description; completed; date = existingTask.date; timestamp = existingTask.timestamp };
            profile.tasks.add(taskId, updatedTask);
            updatedTask;
          };
          case (null) { Runtime.trap("Task not found") };
        };
      };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : TaskId.TaskId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) {
        profile.tasks.remove(taskId);
      };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  public query ({ caller }) func getAllTasks() : async [Task.Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) {
        let tasksArray = profile.tasks.values().toArray();
        tasksArray.sort(Task.compareByTime);
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func listTasksByDate(date : Text) : async [Task.Task] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) {
        profile.tasks.values().toArray().filter(func(task : Task.Task) : Bool { task.date == date });
      };
      case (null) { [] };
    };
  };

  // Finance
  public shared ({ caller }) func createFinanceEntry(amount : Float, entryType : Text, category : Text, description : Text, date : Text) : async Entry.Entry {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let entryId = appState.entryIdCounter;
    let newEntry = { id = entryId; amount; category; entryType; timestamp = Time.now(); description; date };
    let profile = getOrCreateProfile(caller);
    let updatedFinances = profile.finances.clone();
    updatedFinances.add(entryId, newEntry);
    appState.userProfiles.add(caller, { profile with finances = updatedFinances });
    appState.entryIdCounter += 1;
    newEntry;
  };

  public query ({ caller }) func getAllEntries() : async [Entry.Entry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) {
        profile.finances.values().toArray().sort();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func listEntriesByType(entryType : Text) : async [Entry.Entry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) {
        profile.finances.values().toArray().filter(func(entry : Entry.Entry) : Bool { entry.entryType == entryType });
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func deleteEntry(entryId : EntryId.EntryId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) { profile.finances.remove(entryId) };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  public type FinanceSummary = { totalIncome : Float; totalExpenses : Float; balance : Float };

  public query ({ caller }) func getSummary() : async FinanceSummary {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    switch (appState.userProfiles.get(caller)) {
      case (?profile) {
        var totalIncome : Float = 0.0;
        var totalExpenses : Float = 0.0;
        for (entry in profile.finances.values()) {
          if (entry.entryType == "income") { totalIncome += entry.amount }
          else if (entry.entryType == "expense") { totalExpenses += entry.amount };
        };
        { totalIncome; totalExpenses; balance = totalIncome - totalExpenses };
      };
      case (null) { { totalIncome = 0.0; totalExpenses = 0.0; balance = 0.0 } };
    };
  };

  public shared ({ caller }) func updatePreferences(language : Text, darkMode : Bool, geminiApiKey : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let profile = getOrCreateProfile(caller);
    appState.userProfiles.add(caller, { profile with preferences = { language; darkMode; geminiApiKey } });
  };

  // Notes
  public shared ({ caller }) func createNote(title : Text, body : Text, folderId : Nat, tags : [Text]) : async Note.Note {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let noteId = noteIdCounter;
    let newNote : Note.Note = { id = noteId; title; body; folderId; tags; timestamp = Time.now() };
    let notes = getUserNotes(caller).clone();
    notes.add(noteId, newNote);
    userNotes.add(caller, notes);
    noteIdCounter += 1;
    newNote;
  };

  public shared ({ caller }) func updateNote(noteId : Nat, title : Text, body : Text, folderId : Nat, tags : [Text]) : async Note.Note {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let notes = getUserNotes(caller);
    switch (notes.get(noteId)) {
      case (?existing) {
        let updated : Note.Note = { id = noteId; title; body; folderId; tags; timestamp = existing.timestamp };
        notes.add(noteId, updated);
        userNotes.add(caller, notes);
        updated;
      };
      case (null) { Runtime.trap("Note not found") };
    };
  };

  public shared ({ caller }) func deleteNote(noteId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let notes = getUserNotes(caller);
    notes.remove(noteId);
    userNotes.add(caller, notes);
  };

  public query ({ caller }) func getAllNotes() : async [Note.Note] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserNotes(caller).values().toArray().sort(Note.compareByTimeDesc);
  };

  // Folders
  public shared ({ caller }) func createFolder(name : Text, color : Text) : async Folder.Folder {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let folderId = folderIdCounter;
    let newFolder : Folder.Folder = { id = folderId; name; color; timestamp = Time.now() };
    let folders = getUserFolders(caller).clone();
    folders.add(folderId, newFolder);
    userFolders.add(caller, folders);
    folderIdCounter += 1;
    newFolder;
  };

  public shared ({ caller }) func deleteFolder(folderId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserFolders(caller).remove(folderId);
    userFolders.add(caller, getUserFolders(caller));
  };

  public query ({ caller }) func getAllFolders() : async [Folder.Folder] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserFolders(caller).values().toArray();
  };

  // Outfits
  public shared ({ caller }) func createOutfit(name : Text, occasion : Text, description : Text, photoUrl : Text, tags : [Text]) : async Outfit.Outfit {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let outfitId = outfitIdCounter;
    let newOutfit : Outfit.Outfit = { id = outfitId; name; occasion; description; photoUrl; tags; timestamp = Time.now() };
    let outfits = getUserOutfits(caller).clone();
    outfits.add(outfitId, newOutfit);
    userOutfits.add(caller, outfits);
    outfitIdCounter += 1;
    newOutfit;
  };

  public shared ({ caller }) func updateOutfit(outfitId : Nat, name : Text, occasion : Text, description : Text, photoUrl : Text, tags : [Text]) : async Outfit.Outfit {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let outfits = getUserOutfits(caller);
    switch (outfits.get(outfitId)) {
      case (?existing) {
        let updated : Outfit.Outfit = { id = outfitId; name; occasion; description; photoUrl; tags; timestamp = existing.timestamp };
        outfits.add(outfitId, updated);
        userOutfits.add(caller, outfits);
        updated;
      };
      case (null) { Runtime.trap("Outfit not found") };
    };
  };

  public shared ({ caller }) func deleteOutfit(outfitId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserOutfits(caller).remove(outfitId);
    userOutfits.add(caller, getUserOutfits(caller));
  };

  public query ({ caller }) func getAllOutfits() : async [Outfit.Outfit] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserOutfits(caller).values().toArray().sort(Outfit.compareByTimeDesc);
  };

  // Clothing Items
  public shared ({ caller }) func createClothingItem(name : Text, category : Text, photoUrl : Text) : async ClothingItem.ClothingItem {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let itemId = clothingItemIdCounter;
    let newItem : ClothingItem.ClothingItem = { id = itemId; name; category; photoUrl; timestamp = Time.now() };
    let items = getUserClothingItems(caller).clone();
    items.add(itemId, newItem);
    userClothingItems.add(caller, items);
    clothingItemIdCounter += 1;
    newItem;
  };

  public shared ({ caller }) func updateClothingItem(itemId : Nat, name : Text, category : Text, photoUrl : Text) : async ClothingItem.ClothingItem {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let items = getUserClothingItems(caller);
    switch (items.get(itemId)) {
      case (?existing) {
        let updated : ClothingItem.ClothingItem = { id = itemId; name; category; photoUrl; timestamp = existing.timestamp };
        items.add(itemId, updated);
        userClothingItems.add(caller, items);
        updated;
      };
      case (null) { Runtime.trap("Clothing item not found") };
    };
  };

  public shared ({ caller }) func deleteClothingItem(itemId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserClothingItems(caller).remove(itemId);
    userClothingItems.add(caller, getUserClothingItems(caller));
  };

  public query ({ caller }) func getAllClothingItems() : async [ClothingItem.ClothingItem] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserClothingItems(caller).values().toArray().sort(ClothingItem.compareByTimeDesc);
  };

  // Planner Day Outfits
  public shared ({ caller }) func setPlannerDayOutfit(date : Text, outfitId : Nat) : async PlannerDayOutfit.PlannerDayOutfit {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let entry : PlannerDayOutfit.PlannerDayOutfit = { date; outfitId };
    let plannerMap = getUserPlannerOutfits(caller).clone();
    plannerMap.add(date, entry);
    userPlannerOutfits.add(caller, plannerMap);
    entry;
  };

  public shared ({ caller }) func deletePlannerDayOutfit(date : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserPlannerOutfits(caller).remove(date);
    userPlannerOutfits.add(caller, getUserPlannerOutfits(caller));
  };

  public query ({ caller }) func getPlannerDayOutfit(date : Text) : async ?PlannerDayOutfit.PlannerDayOutfit {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserPlannerOutfits(caller).get(date);
  };

  public query ({ caller }) func getAllPlannerDayOutfits() : async [PlannerDayOutfit.PlannerDayOutfit] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserPlannerOutfits(caller).values().toArray();
  };

  // Routines
  public shared ({ caller }) func createRoutine(name : Text, timeOfDay : Text) : async Routine.Routine {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let routineId = routineIdCounter;
    let newRoutine : Routine.Routine = { id = routineId; name; timeOfDay; timestamp = Time.now() };
    let routines = getUserRoutines(caller).clone();
    routines.add(routineId, newRoutine);
    userRoutines.add(caller, routines);
    routineIdCounter += 1;
    newRoutine;
  };

  public shared ({ caller }) func updateRoutine(routineId : Nat, name : Text, timeOfDay : Text) : async Routine.Routine {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let routines = getUserRoutines(caller);
    switch (routines.get(routineId)) {
      case (?existing) {
        let updated : Routine.Routine = { id = routineId; name; timeOfDay; timestamp = existing.timestamp };
        routines.add(routineId, updated);
        userRoutines.add(caller, routines);
        updated;
      };
      case (null) { Runtime.trap("Routine not found") };
    };
  };

  public shared ({ caller }) func deleteRoutine(routineId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserRoutines(caller).remove(routineId);
    userRoutines.add(caller, getUserRoutines(caller));
  };

  public query ({ caller }) func getAllRoutines() : async [Routine.Routine] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserRoutines(caller).values().toArray().sort(Routine.compareByTime);
  };

  // Routine Completions
  public shared ({ caller }) func setRoutineCompletion(date : Text, completedRoutineIds : [Nat]) : async RoutineCompletion.RoutineCompletion {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let entry : RoutineCompletion.RoutineCompletion = { date; completedRoutineIds };
    let completions = getUserRoutineCompletions(caller).clone();
    completions.add(date, entry);
    userRoutineCompletions.add(caller, completions);
    entry;
  };

  public query ({ caller }) func getRoutineCompletion(date : Text) : async ?RoutineCompletion.RoutineCompletion {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserRoutineCompletions(caller).get(date);
  };

  public query ({ caller }) func getAllRoutineCompletions() : async [RoutineCompletion.RoutineCompletion] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    getUserRoutineCompletions(caller).values().toArray();
  };
};
