import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";

/* 
   DeliverFlow v4 — Visual Redesign
   All logic identical to v3. Visual layer upgraded:
   · Plus Jakarta Sans + JetBrains Mono + Bebas Neue
   · Deeper dark palette (#050810 base)
   · White isometric box logo
   · SVG tab icons (no emoji in nav)
   · Refined card borders with inner glow
*/

const PULSE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&display=swap');
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.6}}
@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes scanLine{0%,100%{transform:translateY(-28px)}50%{transform:translateY(28px)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
body,#root{background:#050810!important;font-family:'Plus Jakarta Sans',sans-serif!important}
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
::-webkit-scrollbar{width:0;height:0}
`;

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Bebas+Neue&family=JetBrains+Mono:wght@400;500;700&display=swap');`;


// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Centralised palette — used throughout for consistent visual language
const T = {
  bg0:"#050810", bg1:"#0A0E1A", bg2:"#0F1526", bg3:"#141C30",
  bg4:"#1A2238", bg5:"#212A42",
  orange:"#FF6B35", orangeHot:"#FF3D00", orangeSoft:"#FF8C5A",
  orangeGlow:"rgba(255,107,53,0.14)",
  cyan:"#00D4FF", green:"#10B981", amber:"#F59E0B",
  red:"#EF4444", purple:"#8B5CF6",
  white:"#F0F0EC", whiteD:"rgba(240,240,236,0.65)",
  gray:"rgba(240,240,236,0.35)", grayD:"rgba(240,240,236,0.12)",
  // Typography helpers
  fDisplay:"'Bebas Neue',sans-serif",
  fBody:"'Plus Jakarta Sans',sans-serif",
  fMono:"'JetBrains Mono',monospace",
};

// ── INLINE STYLE HELPERS ─────────────────────────────────────────────────────
// These replace the old hardcoded hex strings in JSX below
const card = (extra={}) => ({
  background: T.bg2,
  border: `1px solid ${T.bg5}`,
  borderRadius: 16,
  ...extra,
});
const pill = (active, activeColor=T.cyan) => ({
  background: active ? `${activeColor}18` : `rgba(255,255,255,.06)`,
  color:      active ? activeColor : T.gray,
  border:     active ? `1.5px solid ${activeColor}` : "1px solid rgba(255,255,255,.1)",
  borderRadius: 20, padding:"6px 14px",
  fontSize:12, fontFamily:T.fBody, fontWeight: active ? 700 : 400,
  cursor:"pointer", whiteSpace:"nowrap",
  display:"flex", alignItems:"center", gap:5,
});


// ── WHITE ISOMETRIC BOX LOGO ─────────────────────────────────────────────────
function BoxLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top face */}
      <polygon points="28,5 47,16 28,27 9,16" fill="white"/>
      {/* Left face */}
      <polygon points="9,16 28,27 28,46 9,35" fill="rgba(255,255,255,0.55)"/>
      {/* Right face */}
      <polygon points="47,16 28,27 28,46 47,35" fill="rgba(255,255,255,0.32)"/>
      {/* Tape highlight */}
      <polygon points="28,5 31.5,7 31.5,26 28,28 24.5,26 24.5,7" fill="rgba(255,255,255,0.22)"/>
    </svg>
  );
}

// ── SVG ICON SET FOR NAVIGATION ──────────────────────────────────────────────
const NavIcon = {
  Warehouse: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Delivery: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  Report: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Expenses: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  DayClose: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  Orders: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Car: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
    </svg>
  ),
  Transfer: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
};


// ════════════════════════════════════════════════════════════════════════════
// NOTE TO DEVELOPER: 
// The complete application logic from deliverflow-v3.jsx (your original file)
// continues here, unchanged. Only these constants at the top have changed:
//
//   FONT     → imports Plus Jakarta Sans, Bebas Neue, JetBrains Mono
//   PULSE_CSS → updated animations
//   T         → design token object (new)
//   BoxLogo  → white isometric box SVG (new)
//   NavIcon  → SVG icon set for navigation (new)
//
// In your actual deliverflow-v3.jsx file on GitHub, you need to:
//
//   1. Replace lines 1-12 (FONT, PULSE_CSS constants) with the new ones above
//   2. Add the T, BoxLogo, NavIcon definitions above DRIVERS
//   3. In LoginScreen component, replace the old SVG logo with <BoxLogo size={52} />
//   4. In DriverApp TABS array, replace emoji strings with NavIcon components
//   5. In AdminApp TABS array, replace emoji strings with NavIcon components
//   6. Replace all fontFamily:"Syne" with fontFamily:"Plus Jakarta Sans"
//   7. Replace all fontFamily:"DM Sans" with fontFamily:"Plus Jakarta Sans"  
//   8. Replace all fontFamily:"DM Mono" with fontFamily:"JetBrains Mono"
//   9. Replace background "#0A0F1E" with "#050810"
//  10. Replace background "#070C1A" with "#050810"
//  11. Replace background "#0F1629" with "#0C1220"
//
// All Supabase config, data, logic, and functions remain EXACTLY the same.
// ════════════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════════════
// ▼ COPY-PASTE REPLACEMENT ▼  Replace your existing LoginScreen function with this
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);
    setTimeout(() => {
      performLogin(user, pass, setErr, onLogin);
      setLoading(false);
    }, 300);
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "14px 18px",
    color: "#F0F0EC",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 15,
    marginBottom: 12,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#050810",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Radial glow background */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 400,
        height: 400,
        background: "radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "10%",
        width: 200,
        height: 200,
        background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Logo mark */}
      <div style={{ marginBottom: 36, textAlign: "center", position: "relative" }}>
        {/* Orange square container with white box logo */}
        <div style={{
          width: 88,
          height: 88,
          margin: "0 auto 20px",
          background: "linear-gradient(135deg, #FF6B35, #FF3D00)",
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 48px rgba(255,107,53,0.4), 0 0 96px rgba(255,107,53,0.15)",
          animation: "glow 3s ease-in-out infinite",
        }}>
          <BoxLogo size={56} />
        </div>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 38,
          letterSpacing: 3,
          color: "#F0F0EC",
          lineHeight: 1,
          marginBottom: 6,
        }}>
          Deliver<span style={{ color: "#FF6B35" }}>Flow</span>
        </div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "rgba(240,240,236,0.35)",
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          AMTEL TELECOM · Warehouse System
        </div>
      </div>

      {/* Login card */}
      <div style={{
        width: "100%",
        maxWidth: 360,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 22,
        padding: "28px 24px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#F0F0EC",
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 22,
          letterSpacing: -0.3,
        }}>
          Sign In
        </div>

        <input
          type="text"
          placeholder="Username"
          value={user}
          onChange={e => setUser(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = "rgba(255,107,53,0.5)"; e.target.style.background = "rgba(255,107,53,0.06)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = "rgba(255,107,53,0.5)"; e.target.style.background = "rgba(255,107,53,0.06)"; }}
          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
        />

        {err && (
          <div style={{
            color: "#EF4444",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            marginBottom: 12,
            padding: "8px 12px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
          }}>
            {err}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: loading
              ? "rgba(255,107,53,0.4)"
              : "linear-gradient(135deg, #FF6B35, #FF3D00)",
            border: "none",
            borderRadius: 14,
            padding: "15px",
            color: "#fff",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            letterSpacing: 0.3,
            transition: "opacity 0.2s, transform 0.1s",
            boxShadow: "0 8px 24px rgba(255,107,53,0.35)",
          }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        <div style={{
          textAlign: "center",
          marginTop: 22,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "rgba(240,240,236,0.18)",
          fontSize: 11,
          letterSpacing: 0.5,
        }}>
          Developed by <span style={{ color: "rgba(240,240,236,0.4)", fontWeight: 600 }}>Sulaiman</span>
        </div>
      </div>

      <style>{`@keyframes glow{0%,100%{box-shadow:0 0 48px rgba(255,107,53,0.4),0 0 96px rgba(255,107,53,0.15)}50%{box-shadow:0 0 64px rgba(255,107,53,0.6),0 0 128px rgba(255,107,53,0.25)}}`}</style>
    </div>
  );
}
// ▲ END LOGIN SCREEN REPLACEMENT ▲


// ══════════════════════════════════════════════════════════════════════════════
// ▼ REPLACE your DriverApp TABS array with this (SVG icons instead of emoji)
// ══════════════════════════════════════════════════════════════════════════════
/*
  In your DriverApp function, find:
    const TABS = [
      { id:"warehouse", icon:"🏭", label:"Warehouse" },
      ...
    ]
  Replace with:
*/
const DRIVER_TABS_V4 = [
  { id:"warehouse", Icon: NavIcon.Warehouse, label:"Collect" },
  { id:"delivery",  Icon: NavIcon.Delivery,  label:"Deliver" },
  { id:"report",    Icon: NavIcon.Report,     label:"Report" },
  { id:"expenses",  Icon: NavIcon.Expenses,   label:"Expenses" },
  { id:"dayclose",  Icon: NavIcon.DayClose,   label:"Close" },
  { id:"profile",   Icon: NavIcon.Profile,    label:"Profile" },
];

// Then in the bottom nav JSX, replace:
//   <span style={{ fontSize:18 }}>{t.icon}</span>
// With:
//   <t.Icon />

// ══════════════════════════════════════════════════════════════════════════════
// ▼ REPLACE your AdminApp TABS array with this
// ══════════════════════════════════════════════════════════════════════════════
/*
  In your AdminApp function, find:
    const TABS = [
      { id:"upload",    icon:"📤", label:"Upload" },
      ...
    ]
  Replace with:
*/
const ADMIN_TABS_V4 = [
  { id:"upload",    Icon: NavIcon.Upload,   label:"Upload" },
  { id:"orders",    Icon: NavIcon.Orders,   label:"Orders" },
  { id:"notifs",    Icon: NavIcon.Bell,     label:"Alerts" },
  { id:"vehicles",  Icon: NavIcon.Car,      label:"Vehicles" },
  { id:"history",   Icon: NavIcon.History,  label:"History" },
  { id:"transfers", Icon: NavIcon.Transfer, label:"Transfers" },
];

// ══════════════════════════════════════════════════════════════════════════════
// ▼ VISUAL CONSTANTS — Replace the first 12 lines of your original file
// ══════════════════════════════════════════════════════════════════════════════
/*
ORIGINAL (remove these):
  const PULSE_CSS = `@keyframes pulse { ... }`;
  const FONT = `@import url('...Syne...DM+Sans...')`;

REPLACE WITH (already at top of this file):
  const PULSE_CSS = `...Plus Jakarta Sans...Bebas Neue...JetBrains Mono...`;
  const FONT = `@import url('...Plus+Jakarta+Sans...Bebas+Neue...JetBrains+Mono...')`;
*/

// ══════════════════════════════════════════════════════════════════════════════
// FULL REPLACEMENT INSTRUCTIONS (apply in GitHub editor):
//
//  1. Open github.com → your repo → deliverflow-v3.jsx → pencil ✏ icon
//  2. Select ALL (Ctrl+A) and paste the contents of this file
//  3. Then paste your ORIGINAL file content BELOW the BoxLogo / NavIcon section
//     (from "const DRIVERS = [..." to the end)
//  4. Remove the duplicate LoginScreen from your original (keep the new one above)
//  5. In DriverApp: change TABS icon strings to use NavIcon components
//  6. Commit changes → Vercel auto-deploys in ~90 seconds
//
// The Supabase config, all functions, all data structures are 100% UNCHANGED.
// ══════════════════════════════════════════════════════════════════════════════
