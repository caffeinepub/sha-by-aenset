import { Toaster } from "@/components/ui/sonner";
import {
  CalendarCheck,
  DollarSign,
  Dumbbell,
  Home,
  NotebookPen,
  Shirt,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { UserProfileView } from "./backend.d";
import FloatingChatBot from "./components/FloatingChatBot";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { I18nProvider, RTL_LANGUAGES, useI18n } from "./contexts/I18nContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { useActor } from "./hooks/useActor";
import { useBackgroundContrast } from "./hooks/useBackgroundContrast";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AuthScreen from "./screens/AuthScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import FinanceTab from "./tabs/FinanceTab";
import GymTab from "./tabs/GymTab";
import HomeTab from "./tabs/HomeTab";
import NotesTab from "./tabs/NotesTab";
import PlannerTab from "./tabs/PlannerTab";
import ProfileTab, { getTabBackgrounds } from "./tabs/ProfileTab";
import type { TabBackgrounds } from "./tabs/ProfileTab";
import WardrobeTab from "./tabs/WardrobeTab";
import { CACHE_KEYS, localCache } from "./utils/localCache";

type Tab =
  | "home"
  | "notes"
  | "planner"
  | "finance"
  | "profile"
  | "wardrobe"
  | "gym";

// Memoize FloatingChatBot so it never re-renders due to parent state changes
const MemoFloatingChatBot = memo(FloatingChatBot);

function buildBgStyle(
  bg: TabBackgrounds[keyof TabBackgrounds] | undefined,
): React.CSSProperties {
  if (!bg) return {};
  const isGradient =
    bg.imageUrl.startsWith("linear-gradient") ||
    bg.imageUrl.startsWith("radial-gradient");
  return {
    backgroundImage: isGradient ? bg.imageUrl : `url(${bg.imageUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function TabWrapper({
  tabId,
  activeTab,
  bg,
  children,
}: {
  tabId: Tab;
  activeTab: Tab;
  bg: TabBackgrounds[keyof TabBackgrounds] | undefined;
  children: React.ReactNode;
}) {
  const bgMode = useBackgroundContrast(bg?.imageUrl, bg?.opacity ?? 0);

  return (
    <div
      className="flex-col flex-1 overflow-hidden relative"
      style={{
        display: activeTab === tabId ? "flex" : "none",
        ...buildBgStyle(bg),
      }}
    >
      {bg && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${bg.opacity})`, zIndex: 0 }}
        />
      )}
      <div
        className="relative flex flex-col flex-1 overflow-hidden"
        style={{ zIndex: 1 }}
        data-bg-mode={bg ? bgMode : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black text-foreground">Sha</h1>
        <p className="text-xs text-accent font-bold tracking-widest uppercase mt-1">
          by Aenset
        </p>
        <div className="mt-6 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { actor, isFetching } = useActor();
  const {
    identity,
    isInitializing,
    clear: clearIdentity,
  } = useInternetIdentity();
  const { user, setUser, isLoading, setIsLoading } = useAuth();
  const { t, lang } = useI18n();
  const { setIsDark } = useTheme();
  const setIsDarkRef = useRef(setIsDark);
  useEffect(() => {
    setIsDarkRef.current = setIsDark;
  }, [setIsDark]);

  const [activeTab, setActiveTab] = useState<Tab>("home");
  // Only mount tabs that have been visited — avoids mounting all 7 tabs on startup
  const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(
    () => new Set<Tab>(["home"]),
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tabBackgrounds, setTabBackgrounds] = useState<TabBackgrounds>(() =>
    getTabBackgrounds(),
  );

  const isRTL = RTL_LANGUAGES.includes(lang);

  const handleBackgroundChange = useCallback(() => {
    setTabBackgrounds(getTabBackgrounds());
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setMountedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  useEffect(() => {
    // If no identity, reset and let auth screen handle it
    if (!identity) {
      setIsLoading(false);
      return;
    }
    // Still waiting for actor to be created
    if (isFetching) return;
    // Actor failed to load — unblock the spinner so the app doesn’t hang
    if (!actor) {
      setIsLoading(false);
      return;
    }

    // ─ Try loading from localStorage cache first for instant display ─
    const cached = localCache.get<UserProfileView>(CACHE_KEYS.profile);
    if (cached) {
      setUser(cached);
      setIsLoading(false);
      // Restore dark mode from cache
      if (cached.preferences?.darkMode !== undefined) {
        setIsDarkRef.current(cached.preferences.darkMode);
      }
      // Sync from backend in background (no spinner)
      actor
        .getCallerUserProfile()
        .then((profile) => {
          if (profile) {
            setUser(profile);
            localCache.set(CACHE_KEYS.profile, profile);
            if (profile.preferences?.darkMode !== undefined) {
              setIsDarkRef.current(profile.preferences.darkMode);
            }
          }
        })
        .catch(() => {});
      return;
    }

    // No cache — do the full load with spinner
    setIsLoading(true);
    // Hard timeout: never stay on loading screen more than 6s
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setShowOnboarding(true);
    }, 6000);

    actor
      .getCallerUserProfile()
      .then((profile) => {
        clearTimeout(timeout);
        if (profile) {
          setUser(profile);
          localCache.set(CACHE_KEYS.profile, profile);
          if (profile.preferences?.darkMode !== undefined) {
            setIsDarkRef.current(profile.preferences.darkMode);
          }
        } else {
          setShowOnboarding(true);
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        setShowOnboarding(true);
      })
      .finally(() => setIsLoading(false));

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, actor, isFetching, setUser, setIsLoading]);

  useEffect(() => {
    if (!identity) {
      setUser(null);
      // Clear cached profile on logout so next login re-fetches fresh
      localCache.remove(CACHE_KEYS.profile);
    }
  }, [identity, setUser]);

  const onLogout = () => {
    clearIdentity();
    setUser(null);
    setShowOnboarding(false);
    setActiveTab("home");
    setMountedTabs(new Set<Tab>(["home"]));
    localCache.remove(CACHE_KEYS.profile);
  };

  const handleOnboardingFinish = async (name: string) => {
    if (!actor) {
      setShowOnboarding(false);
      return;
    }
    const defaultProfile = {
      name: name || "User",
      email: "",
      preferences: { language: "en", darkMode: false, geminiApiKey: "" },
      registrationTime: BigInt(Date.now()),
      tasks: [],
      finances: [],
    };
    try {
      await actor.saveCallerUserProfile(defaultProfile);
      localCache.set(CACHE_KEYS.profile, defaultProfile);
    } catch {
      // silent
    }
    setUser(defaultProfile);
    setShowOnboarding(false);
  };

  // Only show the splash/spinner if we have no identity or no cached data yet
  if (isInitializing || isFetching) {
    return <SplashScreen />;
  }

  if (!identity) return <AuthScreen />;

  if (isLoading) {
    return <SplashScreen />;
  }

  if (showOnboarding || !user) {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: t.home, icon: <Home className="w-5 h-5" /> },
    { id: "notes", label: t.notes, icon: <NotebookPen className="w-5 h-5" /> },
    {
      id: "planner",
      label: t.planner,
      icon: <CalendarCheck className="w-5 h-5" />,
    },
    {
      id: "finance",
      label: t.finance,
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: "wardrobe",
      label: t.wardrobe,
      icon: <Shirt className="w-5 h-5" />,
    },
    {
      id: "gym",
      label: "Gym",
      icon: <Dumbbell className="w-5 h-5" />,
    },
    { id: "profile", label: t.profile, icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex flex-col min-h-screen max-w-[430px] mx-auto bg-background relative overflow-hidden"
    >
      <header className="flex-shrink-0 h-12 bg-gradient-to-r from-card to-background border-b border-border flex items-center justify-center relative z-10">
        <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-foreground">
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </h1>
      </header>

      {/* Only mounted tabs are rendered — lazily mounted on first visit, then kept alive */}
      <main className="flex flex-col flex-1 overflow-hidden relative">
        {mountedTabs.has("home") && (
          <TabWrapper
            tabId="home"
            activeTab={activeTab}
            bg={tabBackgrounds.home}
          >
            <HomeTab />
          </TabWrapper>
        )}

        {mountedTabs.has("notes") && (
          <TabWrapper
            tabId="notes"
            activeTab={activeTab}
            bg={tabBackgrounds.notes}
          >
            <NotesTab />
          </TabWrapper>
        )}

        {mountedTabs.has("planner") && (
          <TabWrapper
            tabId="planner"
            activeTab={activeTab}
            bg={tabBackgrounds.planner}
          >
            <PlannerTab />
          </TabWrapper>
        )}

        {mountedTabs.has("finance") && (
          <TabWrapper
            tabId="finance"
            activeTab={activeTab}
            bg={tabBackgrounds.finance}
          >
            <FinanceTab />
          </TabWrapper>
        )}

        {mountedTabs.has("wardrobe") && (
          <TabWrapper
            tabId="wardrobe"
            activeTab={activeTab}
            bg={tabBackgrounds.wardrobe}
          >
            <WardrobeTab />
          </TabWrapper>
        )}

        {mountedTabs.has("gym") && (
          <TabWrapper
            tabId="gym"
            activeTab={activeTab}
            bg={
              (
                tabBackgrounds as Record<
                  string,
                  TabBackgrounds[keyof TabBackgrounds]
                >
              ).gym
            }
          >
            <GymTab />
          </TabWrapper>
        )}

        {mountedTabs.has("profile") && (
          <TabWrapper
            tabId="profile"
            activeTab={activeTab}
            bg={tabBackgrounds.profile}
          >
            <ProfileTab
              onLogout={onLogout}
              onBackgroundChange={handleBackgroundChange}
            />
          </TabWrapper>
        )}
      </main>

      <nav className="flex-shrink-0 border-t border-border bg-card tab-safe-bottom relative z-10">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                data-ocid={`nav.${tab.id}.link`}
                onClick={() => handleTabChange(tab.id)}
                className="flex flex-col items-center gap-1 flex-1 py-2 relative"
              >
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                    isActive ? "bg-accent/20" : ""
                  }`}
                >
                  <span
                    className={`transition-colors duration-200 ${
                      isActive ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-full bg-accent/15 glow-accent"
                      transition={{
                        type: "spring",
                        bounce: 0.3,
                        duration: 0.4,
                      }}
                    />
                  )}
                </div>
                <span
                  className={`text-[9px] font-semibold transition-colors ${
                    isActive ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {tab.label.length > 7
                    ? `${tab.label.slice(0, 6)}…`
                    : tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <MemoFloatingChatBot userName={user.name} />
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <AppContent />
            <Toaster position="top-center" />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </CurrencyProvider>
  );
}
