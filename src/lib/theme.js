// ─── THEME ───────────────────────────────────────────────────────────────────

export const THEMES = {
  dark: {
    C: "#07091a", C2: "#090c1e", C3: "#0a0f1c",
    BRD: "#111d2e", BRD2: "#1a2d45",
    TX: "#dce8ff", TX2: "#8aa0bc", TX3: "#526680", TX4: "#2d4060", TX5: "#1a2d45",
    AMBER: "#f0a030", BLUE: "#4a7fe8", RED: "#ef4444",
    scrollThumb: "#1a2d45", inputScheme: "dark",
  },
  light: {
    C: "#f2f5f9", C2: "#ffffff", C3: "#eaecf2",
    BRD: "#dde1ea", BRD2: "#bcc4d4",
    TX: "#111827", TX2: "#374151", TX3: "#6b7280", TX4: "#9ca3af", TX5: "#d1d5db",
    AMBER: "#b45309", BLUE: "#2563eb", RED: "#dc2626",
    scrollThumb: "#c0cad8", inputScheme: "light",
  },
};

// Current active tokens — updated by applyTheme
export let TK = THEMES.dark;

export function applyTheme(name) {
  TK = THEMES[name] || THEMES.dark;
  return TK;
}

export function getSavedTheme() {
  return localStorage.getItem("bptheme") || "dark";
}

export function saveTheme(name) {
  localStorage.setItem("bptheme", name);
}
