import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Settings, X, Check, Palette, Type, Layout } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import styles from './TopBar.module.css';

const THEME_ORDER = ['purple', 'blue', 'green', 'teal', 'rose', 'orange'];
const BG_THEME_ORDER = ['visionOS', 'lavender', 'slate', 'emerald', 'sunset', 'light'];
const TEXT_COLOR_ORDER = ['slate', 'midnight', 'violet', 'emerald', 'charcoal', 'chocolate'];
const SIDEBAR_GLASS_ORDER = ['darkGlass', 'lightGlass'];

export default function TopBar() {
  const { clinicInfo } = useApp();
  const {
    theme, setTheme, themes,
    bgTheme, setBgTheme, bgThemes,
    textColor, setTextColor, textColors,
    sidebarGlass, setSidebarGlass, sidebarGlassOptions
  } = useTheme();

  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);
  const settingsBtnRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        settingsBtnRef.current && !settingsBtnRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen]);

  return (
    <header className={styles.topbar}>
      {/* Left: Title */}
      <div className={styles.titleWrap}>
        <span className={styles.title}>
          {clinicInfo?.name || 'Hospital'} Management
        </span>
      </div>

      {/* Center: Search */}
      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search patients, doctors, appointments..."
          className={styles.searchInput}
        />
        <span className={styles.searchShortcut}>Ctrl K</span>
      </div>

      {/* Right: Actions & Profile */}
      <div className={styles.actions}>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>

        {/* Settings Wrapper */}
        <div className={styles.settingsWrapper}>
          <button
            ref={settingsBtnRef}
            className={`${styles.iconBtn} ${panelOpen ? styles.iconBtnActive : ''}`}
            onClick={() => setPanelOpen(p => !p)}
            title="Theme & Appearance Settings"
          >
            <Settings size={18} />
          </button>

          {/* Theme & Background Dropdown Panel */}
          {panelOpen && (
            <div ref={panelRef} className={styles.themePanel}>
              <div className={styles.themePanelHeader}>
                <span className={styles.themePanelTitle}>
                  <Palette size={14} strokeWidth={2} />
                  Appearance & Theme Settings
                </span>
                <button className={styles.panelClose} onClick={() => setPanelOpen(false)}>
                  <X size={13} />
                </button>
              </div>

              {/* Section 1: Accent Color */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Accent Color</span>
              </div>
              <div className={styles.themeGrid}>
                {THEME_ORDER.map(key => {
                  const t = themes[key];
                  const isActive = theme === key;
                  return (
                    <button
                      key={key}
                      className={`${styles.themeChip} ${isActive ? styles.themeChipActive : ''}`}
                      onClick={() => setTheme(key)}
                      style={{ '--chip-color': t.primary }}
                      title={t.name}
                    >
                      <span
                        className={styles.chipSwatch}
                        style={{ background: t.primary }}
                      />
                      <span className={styles.chipLabel}>{t.name}</span>
                      {isActive && (
                        <span className={styles.chipCheck}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className={styles.themePanelDivider} />

              {/* Section 2: App Background Style */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>App Background Theme</span>
              </div>
              <div className={styles.bgGrid}>
                {BG_THEME_ORDER.map(key => {
                  const bg = bgThemes[key];
                  const isActive = bgTheme === key;
                  return (
                    <button
                      key={key}
                      className={`${styles.bgCard} ${isActive ? styles.bgCardActive : ''}`}
                      onClick={() => setBgTheme(key)}
                      title={bg.desc}
                    >
                      <span
                        className={styles.bgPreview}
                        style={{ background: bg.previewBg }}
                      />
                      <div className={styles.bgCardMeta}>
                        <span className={styles.bgCardName}>{bg.name}</span>
                      </div>
                      {isActive && (
                        <span className={styles.bgCheck}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className={styles.themePanelDivider} />

              {/* Section 3: Text & Font Color */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>
                  <Type size={11} style={{ marginRight: 4 }} />
                  Font & Text Color
                </span>
              </div>
              <div className={styles.bgGrid}>
                {TEXT_COLOR_ORDER.map(key => {
                  const tc = textColors[key];
                  const isActive = textColor === key;
                  return (
                    <button
                      key={key}
                      className={`${styles.bgCard} ${isActive ? styles.bgCardActive : ''}`}
                      onClick={() => setTextColor(key)}
                      title={`Primary: ${tc.primary}`}
                    >
                      <span
                        className={styles.bgPreview}
                        style={{ background: tc.preview, borderRadius: '50%' }}
                      />
                      <div className={styles.bgCardMeta}>
                        <span className={styles.bgCardName}>{tc.name}</span>
                      </div>
                      {isActive && (
                        <span className={styles.bgCheck}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className={styles.themePanelDivider} />

              {/* Section 4: Sidebar Contrast */}
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>
                  <Layout size={11} style={{ marginRight: 4 }} />
                  Sidebar Glass Tint
                </span>
              </div>
              <div className={styles.sidebarGlassGrid}>
                {SIDEBAR_GLASS_ORDER.map(key => {
                  const sg = sidebarGlassOptions[key];
                  const isActive = sidebarGlass === key;
                  return (
                    <button
                      key={key}
                      className={`${styles.glassBtn} ${isActive ? styles.glassBtnActive : ''}`}
                      onClick={() => setSidebarGlass(key)}
                      title={sg.desc}
                    >
                      <span>{sg.name}</span>
                      {isActive && <Check size={11} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              <div className={styles.themePanelDivider} />
              <a href="/settings/clinic-info" className={styles.settingsLink} onClick={() => setPanelOpen(false)}>
                <Settings size={13} strokeWidth={1.8} />
                Clinic Information Settings
              </a>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=doctor&backgroundColor=b6e3f4"
            alt="User"
            className={styles.avatarImg}
          />
          <span className={styles.avatarStatus} />
        </div>
      </div>
    </header>
  );
}
