import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, LogOut, Trash2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ImageCropModal from "../components/ImageCropModal";
import { useAuth } from "../contexts/AuthContext";
import { CURRENCIES, useCurrency } from "../contexts/CurrencyContext";
import { type Language, useI18n } from "../contexts/I18nContext";
import { useTheme } from "../contexts/ThemeContext";
import { useActor } from "../hooks/useActor";
import { useUpdatePreferences } from "../hooks/useQueries";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ta", label: "தமிழ்" },
  { value: "hi", label: "हिन्दी" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ar", label: "العربية" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "it", label: "Italiano" },
  { value: "ms", label: "Bahasa Melayu" },
];

const TAB_LABELS: { id: TabKey; label: string; emoji: string }[] = [
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "notes", label: "Notes", emoji: "📒" },
  { id: "planner", label: "Planner", emoji: "📅" },
  { id: "finance", label: "Finance", emoji: "💰" },
  { id: "wardrobe", label: "Wardrobe", emoji: "👗" },
  { id: "profile", label: "Profile", emoji: "👤" },
];

const BLUE_ROSES_URL =
  "/assets/uploads/whatsapp_image_2026-03-30_at_12.17.23-019d3d80-09c8-718a-b31d-61187a8b423b-1.jpeg";

const DARK_BLUE_ROSE_URL = "/assets/uploads/dark-blue-rose.jpeg";

const ALL_TABS: TabKey[] = [
  "home",
  "notes",
  "planner",
  "finance",
  "wardrobe",
  "profile",
];

const PRESET_BACKGROUNDS = [
  {
    label: "Blue Roses",
    value: BLUE_ROSES_URL,
  },
  {
    label: "Dark Blue Rose",
    value: DARK_BLUE_ROSE_URL,
  },
  {
    label: "Soft Lavender",
    value: "linear-gradient(135deg, #e8d5f5 0%, #c8a8e9 100%)",
  },
  {
    label: "Ocean Blue",
    value: "linear-gradient(135deg, #a8d8ea 0%, #7ec8e3 100%)",
  },
  {
    label: "Warm Sunset",
    value: "linear-gradient(135deg, #ffd9b3 0%, #ffb347 100%)",
  },
  {
    label: "Forest Green",
    value: "linear-gradient(135deg, #b8e4b8 0%, #7dba7d 100%)",
  },
  {
    label: "Rose Pink",
    value: "linear-gradient(135deg, #ffd6e7 0%, #ffb3d1 100%)",
  },
  {
    label: "Midnight Dark",
    value: "linear-gradient(135deg, #2d2d2d 0%, #1a1a2e 100%)",
  },
  {
    label: "Gold Luxury",
    value: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
  },
  {
    label: "Arctic White",
    value: "linear-gradient(135deg, #f0f4ff 0%, #dce8ff 100%)",
  },
  {
    label: "Peach Cream",
    value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
  {
    label: "Teal Mint",
    value: "linear-gradient(135deg, #b2f7ef 0%, #70c1b3 100%)",
  },
];

export type TabKey =
  | "home"
  | "notes"
  | "planner"
  | "finance"
  | "wardrobe"
  | "profile";

export interface TabBackground {
  imageUrl: string;
  opacity: number;
}

export type TabBackgrounds = Partial<Record<TabKey, TabBackground>>;

const BG_STORAGE_KEY = "sha_tab_backgrounds";

export function getTabBackgrounds(): TabBackgrounds {
  const isDarkMode = localStorage.getItem("sha_dark_mode") !== "false";
  const defaultImageUrl = isDarkMode ? DARK_BLUE_ROSE_URL : BLUE_ROSES_URL;
  try {
    const stored = JSON.parse(
      localStorage.getItem(BG_STORAGE_KEY) || "{}",
    ) as TabBackgrounds;
    for (const tab of ALL_TABS) {
      if (!stored[tab]) {
        stored[tab] = { imageUrl: defaultImageUrl, opacity: 0.4 };
      }
    }
    return stored;
  } catch {
    const defaults: TabBackgrounds = {};
    for (const tab of ALL_TABS) {
      defaults[tab] = { imageUrl: defaultImageUrl, opacity: 0.4 };
    }
    return defaults;
  }
}

export function saveTabBackgrounds(bgs: TabBackgrounds) {
  localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(bgs));
}

async function compressImageToDataUrl(
  file: File,
  maxKb = 500,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        const maxDim = 1200;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > maxKb * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileTab({
  onLogout,
  onBackgroundChange,
}: {
  onLogout: () => void;
  onBackgroundChange?: () => void;
}) {
  const { user, setUser } = useAuth();
  const { setIsDark } = useTheme();
  const { setLang, t } = useI18n();
  const { currencyCode, setCurrency } = useCurrency();
  const updatePrefs = useUpdatePreferences();
  const { actor } = useActor();

  const [localDark, setLocalDark] = useState(
    user?.preferences?.darkMode ?? true,
  );
  const [localLang, setLocalLang] = useState<Language>(
    (user?.preferences?.language as Language) || "en",
  );
  const [localCurrency, setLocalCurrency] = useState(currencyCode);
  const [localName, setLocalName] = useState(user?.name || "");
  const [localTimeFormat, setLocalTimeFormat] = useState(
    () => localStorage.getItem("sha_time_format") || "12",
  );

  // Background settings state
  const [bgTab, setBgTab] = useState<TabKey>("home");
  const [tabBgs, setTabBgs] = useState<TabBackgrounds>(() =>
    getTabBackgrounds(),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    setLocalDark(user?.preferences?.darkMode ?? true);
    setLocalLang((user?.preferences?.language as Language) || "en");
    setLocalName(user?.name || "");
  }, [user]);

  const saveSettings = async () => {
    await updatePrefs.mutateAsync({
      language: localLang,
      darkMode: localDark,
      geminiApiKey: "",
    });
    if (user && actor) {
      await actor.saveCallerUserProfile({ ...user, name: localName });
    }
    setIsDark(localDark);
    setLang(localLang);
    setCurrency(localCurrency);
    if (user) {
      setUser({
        ...user,
        name: localName,
        preferences: {
          geminiApiKey: "",
          language: localLang,
          darkMode: localDark,
        },
      });
    }
    toast.success("Settings saved!");
  };

  const currentBg = tabBgs[bgTab];

  const applyBg = (updates: Partial<TabBackground>) => {
    const next: TabBackgrounds = {
      ...tabBgs,
      [bgTab]: {
        imageUrl: currentBg?.imageUrl || "",
        opacity: currentBg?.opacity ?? 0.4,
        ...updates,
      },
    };
    setTabBgs(next);
    saveTabBackgrounds(next);
    onBackgroundChange?.();
  };

  const removeBg = () => {
    const isDarkMode = localStorage.getItem("sha_dark_mode") !== "false";
    const next = { ...tabBgs };
    next[bgTab] = {
      imageUrl: isDarkMode ? DARK_BLUE_ROSE_URL : BLUE_ROSES_URL,
      opacity: 0.4,
    };
    setTabBgs(next);
    saveTabBackgrounds(next);
    onBackgroundChange?.();
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setLocalDark(checked);
    // Apply dark mode immediately
    setIsDark(checked);
    // Swap all tab backgrounds to match the new mode
    const newImageUrl = checked ? DARK_BLUE_ROSE_URL : BLUE_ROSES_URL;
    const newBgs: TabBackgrounds = {};
    for (const tab of ALL_TABS) {
      // Keep user-customized backgrounds (non-preset images), only swap preset rose images
      const existing = tabBgs[tab];
      const isPresetRose =
        existing?.imageUrl === BLUE_ROSES_URL ||
        existing?.imageUrl === DARK_BLUE_ROSE_URL ||
        !existing;
      newBgs[tab] = {
        imageUrl: isPresetRose
          ? newImageUrl
          : (existing?.imageUrl ?? newImageUrl),
        opacity: existing?.opacity ?? 0.4,
      };
    }
    setTabBgs(newBgs);
    saveTabBackgrounds(newBgs);
    onBackgroundChange?.();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) setCropSrc(dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCropConfirm = async (croppedDataUrl: string) => {
    setCropSrc(null);
    try {
      const compressed = await compressImageToDataUrl(
        await (async () => {
          const res = await fetch(croppedDataUrl);
          const blob = await res.blob();
          return new File([blob], "bg.jpg", { type: blob.type });
        })(),
      );
      applyBg({ imageUrl: compressed });
      toast.success("Background set!");
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const initials = (localName || user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const previewStyle: React.CSSProperties = currentBg
    ? {
        backgroundImage:
          currentBg.imageUrl.startsWith("linear-gradient") ||
          currentBg.imageUrl.startsWith("radial-gradient")
            ? currentBg.imageUrl
            : `url(${currentBg.imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: "var(--muted)" };

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mx-4 mt-4"
      >
        <div className="bg-gradient-to-br from-accent/20 to-card border border-accent/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-lg font-bold text-accent">{initials}</span>
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">
              {localName || user?.name || "User"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
          </div>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 mt-5"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          {t.settings}
        </p>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Display Name */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border gap-4">
            <Label className="text-sm font-medium shrink-0">Display Name</Label>
            <Input
              data-ocid="profile.input"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Enter your name"
              className="h-8 text-xs w-40"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <Label className="text-sm font-medium">{t.darkMode}</Label>
            <Switch
              data-ocid="profile.switch"
              checked={localDark}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <Label className="text-sm font-medium">{t.language}</Label>
            <Select
              value={localLang}
              onValueChange={(v) => setLocalLang(v as Language)}
            >
              <SelectTrigger
                data-ocid="profile.select"
                className="w-40 h-8 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
            <Label className="text-sm font-medium">Time Format</Label>
            <Select
              value={localTimeFormat}
              onValueChange={(v) => {
                setLocalTimeFormat(v);
                localStorage.setItem("sha_time_format", v);
              }}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12-hour</SelectItem>
                <SelectItem value="24">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between px-4 py-3.5">
            <Label className="text-sm font-medium">Currency</Label>
            <Select
              value={localCurrency}
              onValueChange={(v) => {
                setLocalCurrency(v);
                setCurrency(v);
              }}
            >
              <SelectTrigger
                data-ocid="profile.currency_select"
                className="w-36 h-8 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          data-ocid="profile.save_button"
          type="button"
          className="w-full mt-4"
          onClick={saveSettings}
          disabled={updatePrefs.isPending}
        >
          {updatePrefs.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {t.saveSettings}
        </Button>
      </motion.div>

      {/* App Background */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 mt-6"
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          App Background
        </p>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          {/* Tab selector */}
          <div className="grid grid-cols-3 gap-1.5">
            {TAB_LABELS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-ocid="profile.tab"
                onClick={() => setBgTab(tab.id)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                  bgTab === tab.id
                    ? "bg-accent text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
                {tabBgs[tab.id] && bgTab !== tab.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Live preview */}
          <div className="relative h-16 rounded-xl overflow-hidden border border-border">
            <div className="absolute inset-0" style={previewStyle} />
            {currentBg && (
              <div
                className="absolute inset-0"
                style={{ background: `rgba(0,0,0,${currentBg.opacity})` }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">
                {TAB_LABELS.find((t) => t.id === bgTab)?.label} preview
              </span>
            </div>
          </div>

          {/* Upload photo */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              data-ocid="profile.upload_button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload photo from device
            </Button>
          </div>

          {/* Preset swatches */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Presets
            </p>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_BACKGROUNDS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => applyBg({ imageUrl: preset.value })}
                  className={`h-9 rounded-lg transition-all border-2 ${
                    currentBg?.imageUrl === preset.value
                      ? "border-accent scale-105"
                      : "border-transparent hover:border-border"
                  }`}
                  style={
                    preset.value.startsWith("linear-gradient") ||
                    preset.value.startsWith("radial-gradient")
                      ? { background: preset.value }
                      : {
                          backgroundImage: `url(${preset.value})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                  }
                />
              ))}
            </div>
          </div>

          {/* Opacity slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Overlay darkness
              </Label>
              <span className="text-xs text-muted-foreground">
                {Math.round((currentBg?.opacity ?? 0.4) * 100)}%
              </span>
            </div>
            <Slider
              data-ocid="profile.toggle"
              min={0}
              max={100}
              step={5}
              value={[Math.round((currentBg?.opacity ?? 0.4) * 100)]}
              onValueChange={([v]) => applyBg({ opacity: v / 100 })}
              className="w-full"
            />
          </div>

          {/* Remove/Reset button */}
          {currentBg && (
            <Button
              data-ocid="profile.delete_button"
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={removeBg}
            >
              <Trash2 className="w-4 h-4" />
              Reset to default
            </Button>
          )}
        </div>
      </motion.div>

      {/* Logout */}
      <div className="mx-4 mt-6">
        <Button
          data-ocid="profile.delete_button"
          type="button"
          variant="destructive"
          className="w-full"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t.logout}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8 px-4">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          caffeine.ai
        </a>
      </p>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
