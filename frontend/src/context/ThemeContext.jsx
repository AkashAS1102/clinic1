import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  purple: {
    name: 'Purple Glow',
    primary: '#7c3aed',
    primaryDark: '#6d28d9',
    primaryLight: '#ede9fe',
    sidebarActive: '#a78bfa',
    sidebarActiveBg: 'rgba(124,58,237,0.22)',
    sidebarActiveGlow: '#7c3aed',
    accent: '#8b5cf6',
    btnPrimary: '#7c3aed',
    btnPrimaryHover: '#6d28d9',
    focusRing: 'rgba(124,58,237,0.22)',
  },
  blue: {
    name: 'Royal Blue',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#dbeafe',
    sidebarActive: '#60a5fa',
    sidebarActiveBg: 'rgba(37,99,235,0.22)',
    sidebarActiveGlow: '#2563eb',
    accent: '#3b82f6',
    btnPrimary: '#2563eb',
    btnPrimaryHover: '#1d4ed8',
    focusRing: 'rgba(37,99,235,0.22)',
  },
  green: {
    name: 'Emerald Green',
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#dcfce7',
    sidebarActive: '#4ade80',
    sidebarActiveBg: 'rgba(22,163,74,0.22)',
    sidebarActiveGlow: '#16a34a',
    accent: '#22c55e',
    btnPrimary: '#16a34a',
    btnPrimaryHover: '#15803d',
    focusRing: 'rgba(22,163,74,0.22)',
  },
  teal: {
    name: 'Cyber Teal',
    primary: '#0d9488',
    primaryDark: '#0f766e',
    primaryLight: '#ccfbf1',
    sidebarActive: '#2dd4bf',
    sidebarActiveBg: 'rgba(13,148,136,0.22)',
    sidebarActiveGlow: '#0d9488',
    accent: '#14b8a6',
    btnPrimary: '#0d9488',
    btnPrimaryHover: '#0f766e',
    focusRing: 'rgba(13,148,136,0.22)',
  },
  rose: {
    name: 'Neon Rose',
    primary: '#e11d48',
    primaryDark: '#be123c',
    primaryLight: '#ffe4e6',
    sidebarActive: '#fb7185',
    sidebarActiveBg: 'rgba(225,29,72,0.22)',
    sidebarActiveGlow: '#e11d48',
    accent: '#f43f5e',
    btnPrimary: '#e11d48',
    btnPrimaryHover: '#be123c',
    focusRing: 'rgba(225,29,72,0.22)',
  },
  orange: {
    name: 'Vibrant Orange',
    primary: '#ea580c',
    primaryDark: '#c2410c',
    primaryLight: '#ffedd5',
    sidebarActive: '#fb923c',
    sidebarActiveBg: 'rgba(234,88,12,0.22)',
    sidebarActiveGlow: '#ea580c',
    accent: '#f97316',
    btnPrimary: '#ea580c',
    btnPrimaryHover: '#c2410c',
    focusRing: 'rgba(234,88,12,0.18)',
  },
};

export const BG_THEMES = {
  visionOS: {
    id: 'visionOS',
    name: 'Apple VisionOS Dark',
    desc: 'Deep purple & cosmic glowing backdrop',
    layoutBg: `
      radial-gradient(ellipse 70% 60% at 5% 10%, rgba(124, 58, 237, 0.55) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 95% 90%, rgba(99, 102, 241, 0.45) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 50% 50%, rgba(168, 85, 247, 0.20) 0%, transparent 65%),
      radial-gradient(ellipse 80% 80% at 80% 20%, rgba(236, 72, 153, 0.18) 0%, transparent 55%),
      linear-gradient(160deg, #1a0e3a 0%, #0f0a2e 40%, #130d35 100%)
    `,
    contentBg: '#f8fafc',
    previewBg: '#1a0e3a',
    isDark: true,
  },
  lavender: {
    id: 'lavender',
    name: 'Soft Lavender',
    desc: 'Light & airy pastel lavender backdrop',
    layoutBg: `
      radial-gradient(ellipse 80% 60% at 10% 20%, rgba(196, 181, 253, 0.55) 0%, transparent 60%),
      radial-gradient(ellipse 70% 50% at 90% 80%, rgba(221, 214, 254, 0.55) 0%, transparent 60%),
      linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #e0e7ff 100%)
    `,
    contentBg: '#ffffff',
    previewBg: '#ede9fe',
    isDark: false,
  },
  slate: {
    id: 'slate',
    name: 'Midnight Slate',
    desc: 'Cool navy blue & dark slate aura',
    layoutBg: `
      radial-gradient(ellipse 70% 60% at 20% 20%, rgba(56, 189, 248, 0.35) 0%, transparent 60%),
      radial-gradient(ellipse 70% 60% at 80% 80%, rgba(99, 102, 241, 0.35) 0%, transparent 60%),
      linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #090d16 100%)
    `,
    contentBg: '#f8fafc',
    previewBg: '#0f172a',
    isDark: true,
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Aurora',
    desc: 'Teal & deep forest ambient glow',
    layoutBg: `
      radial-gradient(ellipse 70% 60% at 15% 15%, rgba(20, 184, 166, 0.45) 0%, transparent 60%),
      radial-gradient(ellipse 70% 60% at 85% 85%, rgba(16, 185, 129, 0.40) 0%, transparent 60%),
      linear-gradient(160deg, #064e3b 0%, #022c22 45%, #0d2019 100%)
    `,
    contentBg: '#f8fafc',
    previewBg: '#064e3b',
    isDark: true,
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    desc: 'Warm rose & deep amber twilight',
    layoutBg: `
      radial-gradient(ellipse 70% 60% at 10% 20%, rgba(244, 63, 94, 0.45) 0%, transparent 60%),
      radial-gradient(ellipse 70% 60% at 90% 80%, rgba(249, 115, 22, 0.40) 0%, transparent 60%),
      linear-gradient(160deg, #31121d 0%, #1c0a14 50%, #12050d 100%)
    `,
    contentBg: '#f8fafc',
    previewBg: '#31121d',
    isDark: true,
  },
  light: {
    id: 'light',
    name: 'Studio White',
    desc: 'Ultra clean, minimal studio light backdrop',
    layoutBg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    contentBg: '#ffffff',
    previewBg: '#ffffff',
    isDark: false,
  },
};

export const TEXT_COLORS = {
  slate: {
    id: 'slate',
    name: 'Dark Slate',
    primary: '#0f172a',
    secondary: '#334155',
    muted: '#64748b',
    preview: '#0f172a',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Navy',
    primary: '#091e42',
    secondary: '#172b4d',
    muted: '#42526e',
    preview: '#091e42',
  },
  violet: {
    id: 'violet',
    name: 'Deep Violet',
    primary: '#1e1b4b',
    secondary: '#312e81',
    muted: '#4338ca',
    preview: '#1e1b4b',
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Dark',
    primary: '#022c22',
    secondary: '#064e3b',
    muted: '#047857',
    preview: '#022c22',
  },
  charcoal: {
    id: 'charcoal',
    name: 'Pitch Black',
    primary: '#000000',
    secondary: '#18181b',
    muted: '#3f3f46',
    preview: '#000000',
  },
  chocolate: {
    id: 'chocolate',
    name: 'Espresso',
    primary: '#271c19',
    secondary: '#44322d',
    muted: '#785b52',
    preview: '#271c19',
  },
};

export const SIDEBAR_GLASS = {
  darkGlass: {
    id: 'darkGlass',
    name: 'Dark Glass',
    desc: 'Frosted dark glass pane with white text (High contrast on all backdrops)',
  },
  lightGlass: {
    id: 'lightGlass',
    name: 'Light Glass',
    desc: 'Light glass pane with sharp dark slate text',
  },
};

function applyTheme(themeKey, bgThemeKey, textColorKey, sidebarGlassKey = 'darkGlass') {
  const t = THEMES[themeKey] || THEMES.purple;
  const bg = BG_THEMES[bgThemeKey] || BG_THEMES.visionOS;
  const tc = TEXT_COLORS[textColorKey] || TEXT_COLORS.slate;
  const root = document.documentElement;

  // Primary Theme CSS Variables
  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--primary-dark', t.primaryDark);
  root.style.setProperty('--primary-light', t.primaryLight);
  root.style.setProperty('--sidebar-active', t.sidebarActive);
  root.style.setProperty('--sidebar-active-bg', t.sidebarActiveBg);
  root.style.setProperty('--sidebar-active-glow', t.sidebarActiveGlow);
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--btn-primary', t.btnPrimary);
  root.style.setProperty('--btn-primary-hover', t.btnPrimaryHover);
  root.style.setProperty('--focus-ring', t.focusRing);

  // Background Custom Properties
  root.style.setProperty('--layout-bg', bg.layoutBg);
  root.style.setProperty('--content-bg', bg.contentBg);

  // Custom Text Color Variables
  root.style.setProperty('--text-primary', tc.primary);
  root.style.setProperty('--text-secondary', tc.secondary);
  root.style.setProperty('--text-muted', tc.muted);

  // Dynamic Sidebar Glass & Contrast Styling
  if (sidebarGlassKey === 'lightGlass') {
    // Light Glass with Dark Text
    root.style.setProperty('--sidebar-bg-glass', 'rgba(255, 255, 255, 0.88)');
    root.style.setProperty('--sidebar-border-glass', 'rgba(227, 223, 242, 0.80)');
    root.style.setProperty('--sidebar-brand-name', tc.primary);
    root.style.setProperty('--sidebar-brand-sub', tc.muted);
    root.style.setProperty('--sidebar-section-label', tc.muted);
    root.style.setProperty('--sidebar-item-color', tc.secondary);
    root.style.setProperty('--sidebar-item-hover-bg', 'rgba(124, 58, 237, 0.08)');
    root.style.setProperty('--sidebar-item-hover-color', t.primary);
    root.style.setProperty('--sidebar-subitem-color', tc.muted);
    root.style.setProperty('--sidebar-chevron', tc.muted);
    root.style.setProperty('--sidebar-user-bg', 'rgba(241, 245, 249, 0.85)');
    root.style.setProperty('--sidebar-user-border', 'rgba(203, 213, 225, 0.60)');
    root.style.setProperty('--sidebar-user-name', tc.primary);
    root.style.setProperty('--sidebar-user-role', tc.muted);
  } else {
    // Dark Frosted Glass (Default: Works flawlessly on Soft Lavender & Studio White as well as dark themes!)
    root.style.setProperty('--sidebar-bg-glass', 'rgba(18, 14, 38, 0.78)');
    root.style.setProperty('--sidebar-border-glass', 'rgba(255, 255, 255, 0.16)');
    root.style.setProperty('--sidebar-brand-name', 'rgba(255, 255, 255, 0.96)');
    root.style.setProperty('--sidebar-brand-sub', 'rgba(255, 255, 255, 0.68)');
    root.style.setProperty('--sidebar-section-label', 'rgba(255, 255, 255, 0.58)');
    root.style.setProperty('--sidebar-item-color', 'rgba(255, 255, 255, 0.88)');
    root.style.setProperty('--sidebar-item-hover-bg', 'rgba(255, 255, 255, 0.12)');
    root.style.setProperty('--sidebar-item-hover-color', 'rgba(255, 255, 255, 0.98)');
    root.style.setProperty('--sidebar-subitem-color', 'rgba(255, 255, 255, 0.75)');
    root.style.setProperty('--sidebar-chevron', 'rgba(255, 255, 255, 0.58)');
    root.style.setProperty('--sidebar-user-bg', 'rgba(255, 255, 255, 0.09)');
    root.style.setProperty('--sidebar-user-border', 'rgba(255, 255, 255, 0.15)');
    root.style.setProperty('--sidebar-user-name', 'rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--sidebar-user-role', 'rgba(255, 255, 255, 0.68)');
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('clinic-theme') || 'purple';
  });

  const [bgTheme, setBgThemeState] = useState(() => {
    return localStorage.getItem('clinic-bg-theme') || 'visionOS';
  });

  const [textColor, setTextColorState] = useState(() => {
    return localStorage.getItem('clinic-text-color') || 'slate';
  });

  const [sidebarGlass, setSidebarGlassState] = useState(() => {
    return localStorage.getItem('clinic-sidebar-glass') || 'darkGlass';
  });

  useEffect(() => {
    applyTheme(theme, bgTheme, textColor, sidebarGlass);
  }, [theme, bgTheme, textColor, sidebarGlass]);

  const setTheme = (key) => {
    setThemeState(key);
    localStorage.setItem('clinic-theme', key);
  };

  const setBgTheme = (key) => {
    setBgThemeState(key);
    localStorage.setItem('clinic-bg-theme', key);
  };

  const setTextColor = (key) => {
    setTextColorState(key);
    localStorage.setItem('clinic-text-color', key);
  };

  const setSidebarGlass = (key) => {
    setSidebarGlassState(key);
    localStorage.setItem('clinic-sidebar-glass', key);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes: THEMES,
        bgTheme,
        setBgTheme,
        bgThemes: BG_THEMES,
        textColor,
        setTextColor,
        textColors: TEXT_COLORS,
        sidebarGlass,
        setSidebarGlass,
        sidebarGlassOptions: SIDEBAR_GLASS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
