import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";

/* BUILD: 2026-04-29-002 */
/* 
   DeliverFlow v3 - Real Warehouse Workflow
   Admin: Upload PDF -> Parse Orders -> Assign Driver
   Driver: Arrive at Warehouse -> Scan/Confirm Orders -> Deliver
 */

// ============================================================
// SECTION 1: GLOBAL STYLES & CONSTANTS
// Lines: PULSE_CSS, FONT, color palette CSS variables
// ============================================================
const PULSE_CSS = `@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.7} } @keyframes spin { to { transform:rotate(360deg); } }`;
// System fonts — SF Pro on iOS/Mac, Google Sans on Android, Segoe UI on Windows
const FONT = `
  :root { font-synthesis: none; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
`;

/*  Drivers  */
// ============================================================
// SECTION 2: CONFIGURATION DATA
// Lines: DRIVERS, STORE_ADMINS, AMTEL_VEHICLES, STORES, KUWAIT_AREAS
// ============================================================
const DRIVERS = [
  { id:"asif",      name:"Asif",      avatar:"AS", phone:"+96555001001", status:"active",   vehicleType:"Car",  vehicleNo:"KWT 12345", licenseNo:"DL-2021-001", nationality:"Indian",    joinDate:"2023-01-15", daftarExpiry:"2026-08-01" },
  { id:"jasir",     name:"Jasir",     avatar:"JA", phone:"+96555001002", status:"active",   vehicleType:"Van",  vehicleNo:"KWT 67890", licenseNo:"DL-2020-042", nationality:"Pakistani", joinDate:"2022-06-10", daftarExpiry:"2026-11-15" },
  { id:"prathyush", name:"Prathyush", avatar:"PR", phone:"+96555001003", status:"active",   vehicleType:"Bike", vehicleNo:"KWT 11223", licenseNo:"DL-2022-018", nationality:"Indian",    joinDate:"2024-03-01", daftarExpiry:"2025-12-31" },
  { id:"iqbal",     name:"Iqbal",     avatar:"IQ", phone:"+96555001004", status:"active",   vehicleType:"Car",  vehicleNo:"KWT 44556", licenseNo:"DL-2019-077", nationality:"Pakistani", joinDate:"2021-09-20", daftarExpiry:"2027-03-10" },
];


const STORE_ADMINS = [
  { id:"trikart",  name:"Trikart Admin",  avatar:"TK", store:"Trikart Online",  password:"" },
  { id:"webstore", name:"Webstore Admin", avatar:"WS", store:"Webstore Online", password:"" },
  { id:"restore",  name:"ReStore Admin",  avatar:"RS", store:"ReStore Online",  password:"" },
  { id:"gadgetpro", name:"GadgetPro Admin", avatar:"GP", store:"GadgetPro Online", password:"" },
];

const AMTEL_VEHICLES = [
  { brand:"Toyota",  model:"Corolla",  plate:"12190", color:"White", type:"Car" },
  { brand:"Nissan",  model:"Sunny",    plate:"26862", color:"White", type:"Car" },
  { brand:"Nissan",  model:"Sunny",    plate:"42041", color:"Brown", type:"Car" },
  { brand:"Toyota",  model:"Ace Lite", plate:"88698", color:"White", type:"Van" },
  { brand:"Nissan",  model:"Sunny",    plate:"90066", color:"White", type:"Car" },
  { brand:"Renault", model:"Doker",    plate:"98208", color:"White", type:"Van" },
];


/*  Pre-parsed orders from the uploaded PDF (Asif's real data)  */
const PDF_SAMPLE_ORDERS = [
  // ReStore Online
  { invoiceNo:"1163294", onlineOrderNo:"", customer:"ishbilia customer",    phone:"56534882",     address:"ishbilia, h-62",                                                store:"ReStore Online",  total:9.90,  paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163295", onlineOrderNo:"", customer:"West Abdullah customer",phone:"53331787",     address:"west abdullah al mubarak, b-5, st-509, h-1",                   store:"ReStore Online",  total:9.90,  paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163296", onlineOrderNo:"", customer:"Sheril Quiapo",         phone:"639163883129", address:"Sulaibikhat, 4 street 112, floor 1, flat 7, build 89",          store:"ReStore Online",  total:12.90, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  // Trikart Online
  { invoiceNo:"1163258", onlineOrderNo:"75283",  customer:"Muna Salem",         phone:"+96566981955", address:"Block 2 street 204 building 241, Saad Al Abdullah City, Al Jahra", store:"Trikart Online",  total:44.90, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"20/3/2026" },
  { invoiceNo:"1163270", onlineOrderNo:"75322",  customer:"Bezel Sanchez",      phone:"+96567761300", address:"block 7 st.50 House 44 Sabah Al Nasser, Farwaniya",            store:"Trikart Online",  total:9.90,  paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163280", onlineOrderNo:"75347",  customer:"Sandeep KG",         phone:"+96599824464", address:"Building 1082, Floor 2, Room 6, Street 200, Block 2, Jleeb Al Shyoukh", store:"Trikart Online", total:7.90, paymentType:"Cash",  status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163304", onlineOrderNo:"75360",  customer:"Dimuth Gayan",       phone:"50792337",     address:"Blok 3 Road 1 Staret 4, Firdous, Al Ahmadi",                  store:"Trikart Online",  total:9.80,  paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163306", onlineOrderNo:"75372",  customer:"Hamad Alhajri",      phone:"+96596693118", address:"43, Qairawan, Al Asimah",                                     store:"Trikart Online",  total:275.29,paymentType:"Deema",          status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163327", onlineOrderNo:"3662",   customer:"Salman Aldaihani",   phone:"+96541093265", address:"منطقة الفردوس قطعة5 جادة9 منزل3, Farwaniya",                 store:"Trikart Online",  total:34.90, paymentType:"KNET",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163334", onlineOrderNo:"75394",  customer:"Hamed Aleid",        phone:"+96550411114", address:"Block 6 st 621 house 499, South Abdullah Mubarak, Farwaniya", store:"Trikart Online",  total:15.00, paymentType:"VISA/Mastercard", status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  // Webstore Online
  { invoiceNo:"1163036", onlineOrderNo:"462565", customer:"Webstore Customer 1",phone:"50462565",     address:"KHAITHAN, B4, S86, CGC MEN HOSTAL",                           store:"Webstore Online", total:15.00, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"17/3/2026" },
  { invoiceNo:"1163142", onlineOrderNo:"26675",  customer:"Eman Nasser",        phone:"+96598000368", address:"ishbelya block4 street410 house28, Farwaniya",                store:"Webstore Online", total:7.00,  paymentType:"Tabby",          status:"pending", driverId:null, scanned:false, date:"18/3/2026" },
  { invoiceNo:"1163182", onlineOrderNo:"26688",  customer:"Muneer",             phone:"+96597556848", address:"Sabah Al Nasser, B1, Jamiya Kabeer, Haya Restaurant",         store:"Webstore Online", total:10.00, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"19/3/2026" },
  { invoiceNo:"1163192", onlineOrderNo:"26632",  customer:"Ayoun",              phone:"50710137",     address:"B1, S9, H282 - EXCHANGE ZERO AMOUNT",                         store:"Webstore Online", total:8.00,  paymentType:"Exchange",       status:"pending", driverId:null, scanned:false, date:"19/3/2026" },
  { invoiceNo:"1163195", onlineOrderNo:"26700",  customer:"Sadish",             phone:"+96560349863", address:"Ferdous, B9, S10, Ferdous, Al Ahmadi",                        store:"Webstore Online", total:9.90,  paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"19/3/2026" },
  { invoiceNo:"1163199", onlineOrderNo:"26696",  customer:"Jothish",            phone:"+96566941944", address:"Amghara Industrial, B2, Al Jahra",                            store:"Webstore Online", total:10.00, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"19/3/2026" },
  { invoiceNo:"1163279", onlineOrderNo:"26721",  customer:"Fatima Almutwaa",    phone:"+96566515665", address:"Old Jahra block 1 street 1 house 22, Jahra",                  store:"Webstore Online", total:26.90, paymentType:"Tap/KNET",       status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163308", onlineOrderNo:"26738",  customer:"Amith Kumar",        phone:"+96599631623", address:"Abbasiya, B4, S11, Bldng 7, Jleeb Al-Shuyoukh",              store:"Webstore Online", total:10.00, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163309", onlineOrderNo:"26737",  customer:"Faras Raz",          phone:"+96567074725", address:"Amghara, Next Gate No 4 Main St, Al Jahra",                   store:"Webstore Online", total:24.90, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163311", onlineOrderNo:"26733",  customer:"Vijay Raghavan",     phone:"+96565068433", address:"Sulaibiya, B8, Sulaibiya",                                    store:"Webstore Online", total:10.00, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163312", onlineOrderNo:"26734",  customer:"Anvar",              phone:"+96566140898", address:"Abbasiya, B4, S13, Nour Al Aqsa Bldng, Jleeb Al-Shuyoukh",   store:"Webstore Online", total:12.90, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163314", onlineOrderNo:"26735",  customer:"Anurag Thapa",       phone:"+97797087708", address:"Jaber Al Ahmed, B5, S500, H22",                               store:"Webstore Online", total:9.90,  paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163316", onlineOrderNo:"26731",  customer:"Remya P",            phone:"+91996141214", address:"Sabah Al Nasser, B6, S201",                                   store:"Webstore Online", total:14.90, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163320", onlineOrderNo:"26741",  customer:"Ajmeer Khan",        phone:"+96565130378", address:"Naseem, B1, S31, H4",                                         store:"Webstore Online", total:10.00, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163321", onlineOrderNo:"26742",  customer:"Hussan Kutty",       phone:"+96566346357", address:"Abbasiya, B4, S18, Near High Land Hotel",                     store:"Webstore Online", total:10.00, paymentType:"Cash",           status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
  { invoiceNo:"1163325", onlineOrderNo:"26747",  customer:"A Obaid",            phone:"+96565952621", address:"Old Jahra block 5 street 1 line 1 avenue 9, House 108",       store:"Webstore Online", total:40.90, paymentType:"Tabby",          status:"pending", driverId:null, scanned:false, date:"21/3/2026" },
];

/*  Brand-accurate payment colors  */
// Payment Badge config — solid filled style (matching design photo)
// ============================================================
// SECTION 3: PAYMENT SYSTEM
// Lines: PAYMENT_CFG, PAYMENT_COLORS, PaymentBadge component
// ============================================================
const PAYMENT_CFG = {
  "Cash":           { color:"#fff",     bg:"#10B981",  border:"#10B981",  label:"Cash"         },
  "COD":            { color:"#fff",     bg:"#10B981",  border:"#10B981",  label:"Cash"         },
  "KNET":           { color:"#fff",     bg:"#1B3A8C",  border:"#1B3A8C",  label:"K NET"        },
  "VISA/Mastercard":{ color:"#fff",     bg:"#1E2D6B",  border:"#1E2D6B",  label:"VISA / MC"    },
  "Tabby":          { color:"#1A1A1A",  bg:"#3DEBA0",  border:"#3DEBA0",  label:"Tabby"        },
  "Taly":           { color:"#fff",     bg:"#1A1F2E",  border:"#2D6FD4",  label:"Taly"         },
  "Deema":          { color:"#fff",     bg:"#C0596A",  border:"#C0596A",  label:"Deema"        },
  "GoCollect":      { color:"#fff",     bg:"#E8003D",  border:"#E8003D",  label:"GoCollect"    },
  "Trikart Link":   { color:"#fff",     bg:"#6366F1",  border:"#6366F1",  label:"🔗 Trikart"   },
  "WAMD":           { color:"#F5C518",  bg:"#1B2B4B",  border:"#F5C518",  label:"WAMD"         },
  "Tap/KNET":       { color:"#fff",     bg:"#1B3A8C",  border:"#1B3A8C",  label:"Tap / KNET"   },
  "Exchange":       { color:"#fff",     bg:"#6B7280",  border:"#6B7280",  label:"🔄 Exchange"  },
  "Link Payment":   { color:"#fff",     bg:"#6366F1",  border:"#6366F1",  label:"🔗 Link"      },
  "Tabby (Link)":   { color:"#1A1A1A",  bg:"#3DEBA0",  border:"#3DEBA0",  label:"Tabby"        },
  "Tamara":         { color:"#fff",     bg:"#9333EA",  border:"#9333EA",  label:"Tamara"       },
  "Pre-Paid":       { color:"#fff",     bg:"#10B981",  border:"#10B981",  label:"Pre-Paid"     },
};
// Fallback colour map (used where only a hex colour is needed)
const PAYMENT_COLORS = Object.fromEntries(Object.entries(PAYMENT_CFG).map(e => [e[0],e[1].bg]));

/*  Payment Badge component — solid filled pills  */
const PaymentBadge = ({ payType, small }) => {
  // Exact match first, then fuzzy fallback for DB variants
  let cfg = PAYMENT_CFG[payType];
  if (!cfg && payType) {
    const l = payType.toLowerCase();
    if (l.includes("taly"))        cfg = PAYMENT_CFG["Taly"];
    else if (l.includes("cash") || l.includes("basic") || l.includes("cod")) cfg = PAYMENT_CFG["Cash"];
    else if (l.includes("knet") || l.includes("k net")) cfg = PAYMENT_CFG["KNET"];
    else if (l.includes("tabby"))  cfg = PAYMENT_CFG["Tabby"];
    else if (l.includes("deema"))  cfg = PAYMENT_CFG["Deema"];
    else if (l.includes("wamd"))   cfg = PAYMENT_CFG["WAMD"];
    else if (l.includes("visa") || l.includes("mastercard")) cfg = PAYMENT_CFG["VISA/Mastercard"];
    else if (l.includes("exchange")) cfg = PAYMENT_CFG["Exchange"];
    else if (l.includes("collect")) cfg = PAYMENT_CFG["GoCollect"];
    else if (l.includes("trikart")) cfg = PAYMENT_CFG["Trikart Link"];
    else if (l.includes("tamara")) cfg = PAYMENT_CFG["Tamara"];
  }
  if (!cfg) cfg = { color:"#fff", bg:"rgba(255,255,255,.15)", border:"rgba(255,255,255,.2)", label: payType || "—" };
  const fs = small ? 10 : 11;
  const px = small ? "3px 9px" : "4px 12px";
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: "1.5px solid " + cfg.border,
      borderRadius: 20,
      padding: px,
      fontSize: fs,
      fontWeight: 700,
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif",
      whiteSpace: "nowrap",
      letterSpacing: (payType||"").includes("KNET") ? 0.5 : 0,
      display: "inline-block",
    }}>
      {cfg.label}
    </span>
  );
};

// ============================================================
// SECTION 4: SOUND EFFECTS & SHARED UTILITIES
// Lines: playSound, uid, detectArea, STATUS_CFG, Badge, Pill, Toast
// ============================================================
/*  Sound effects (Web Audio API - no external files)  */
// Persistent audio context - created on first user gesture
var _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  if (_audioCtx && _audioCtx.state === "suspended") {
    _audioCtx.resume().catch(function(){});
  }
  return _audioCtx;
}
// Wake up audio context on any user interaction
document.addEventListener("click", function() { getAudioCtx(); }, { once: false, passive: true });
document.addEventListener("touchstart", function() { getAudioCtx(); }, { once: false, passive: true });

function playSound(sndType) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (sndType === "success") {
      // Two-tone ascending chime:  order found / collected
      [[660, 0, 0.12], [880, 0.13, 0.18], [1100, 0.26, 0.22]].forEach(function(note) {
        var freq = note[0], delay = note[1], dur = note[2];
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now + delay);
        g.gain.linearRampToValueAtTime(0.28, now + delay + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        o.start(now + delay); o.stop(now + delay + dur + 0.05);
      });
    } else if (sndType === "collect") {
      // Satisfying double-beep: 📦 confirmed collection
      [[523, 0, 0.1], [784, 0.12, 0.18]].forEach(function(note) {
        var freq = note[0], delay = note[1], dur = note[2];
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "triangle"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now + delay);
        g.gain.linearRampToValueAtTime(0.35, now + delay + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        o.start(now + delay); o.stop(now + delay + dur + 0.05);
      });
    } else if (sndType === "error") {
      // Low descending buzz:  wrong driver / not found
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sawtooth"; o.frequency.setValueAtTime(300, now);
      o.frequency.linearRampToValueAtTime(150, now + 0.25);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      o.start(now); o.stop(now + 0.3);
    } else if (sndType === "bulk") {
      // Rising sweep:  bulk collect all
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.setValueAtTime(440, now);
      o.frequency.exponentialRampToValueAtTime(1320, now + 0.4);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      o.start(now); o.stop(now + 0.5);
    } else if (sndType === "notify") {
      // Admin notification chime - gentle two-tone
      [[880, 0, 0.12],[1100, 0.15, 0.15]].forEach(function(note) {
        var freq = note[0], delay = note[1], dur = note[2];
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now+delay);
        g.gain.linearRampToValueAtTime(0.2, now+delay+0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now+delay+dur);
        o.start(now+delay); o.stop(now+delay+dur+0.05);
      });
    } else if (sndType === "help") {
      // Urgent SOS-style alert: 3 rapid high-low pulses
      [[1200,0,0.08],[600,0.1,0.08],[1200,0.2,0.08],[600,0.3,0.08],[1200,0.4,0.12]].forEach(function(note) {
        var freq=note[0], delay=note[1], dur=note[2];
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "square"; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now+delay);
        g.gain.linearRampToValueAtTime(0.3, now+delay+0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now+delay+dur);
        o.start(now+delay); o.stop(now+delay+dur+0.02);
      });
    }
  } catch(e) { /* Audio not supported */ }
}
// Payment types that require NO cash collection from driver
const NO_COLLECT_PAYMENTS = ["Exchange","Tabby","Taly","Deema","KNET","VISA/Mastercard","Tap/KNET"];
const isExchange = p => p === "Exchange";
const STORES = ["All Stores","ReStore Online","Trikart Online","Webstore Online","GadgetPro Online"];
const KUWAIT_AREAS = [
  ["south abdullah mubarak","Abdullah Al-Mubarak"],
  ["north west sulaibikhat","North West Sulaibikhat"],
  ["sulaibiya agricultural","Sulaibiya Agricultural Area"],
  ["saad al abdullah city","Saad Al Abdullah"],
  ["abdullah al-mubarak","Abdullah Al-Mubarak"],
  ["abdullah al mubarak","Abdullah Al-Mubarak"],
  ["south doha qairawan","South Doha / Qairawan"],
  ["shuwaikh industrial","Shuwaikh Industrial Area"],
  ["abdullah al salem","Abdulla Al-Salem"],
  ["nahda sulaibikhat","Nahda / East Sulaibikhat"],
  ["ardiya industrial","Ardiya Industrial Area"],
  ["jleeb al-shuyoukh","Jleeb Al-Shuyoukh"],
  ["jleeb al shuyoukh","Jleeb Al-Shuyoukh"],
  ["mubarak al-kabeer","Mubarak Al-Kabeer"],
  ["mubarak al kabeer","Mubarak Al-Kabeer"],
  ["abdulla al-salem","Abdulla Al-Salem"],
  ["abdulla al salem","Abdulla Al-Salem"],
  ["airport district","Airport District"],
  ["east sulaibikhat","Nahda / East Sulaibikhat"],
  ["jahra industrial","Jahra Industrial Area"],
  ["jawaher al wafra","Jawaher Al Wafra"],
  ["jleeb al shyoukh","Jleeb Al-Shuyoukh"],
  ["saad al-abdullah","Saad Al Abdullah"],
  ["saad al abdullah","Saad Al Abdullah"],
  ["abdulla mubarak","Abdullah Al-Mubarak"],
  ["abu al hasaniya","Abu Al Hasaniya"],
  ["ardiya herafiya","Ardiya Herafiya"],
  ["sabah al-nasser","Sabah Al-Nasser"],
  ["sabah al nasser","Sabah Al-Nasser"],
  ["fahad al-ahmad","Fahad Al-Ahmad"],
  ["fahad al ahmad","Fahad Al-Ahmad"],
  ["maidan hawalli","Maidan Hawalli"],
  ["maidan hawally","Maidan Hawalli"],
  ["jaber al-ahmad","Jaber Al-Ahmad"],
  ["jaber al ahmad","Jaber Al-Ahmad"],
  ["mubarak kabeer","Mubarak Al-Kabeer"],
  ["sabah al-ahmad","Sabah Al-Ahmad"],
  ["sabah al ahmad","Sabah Al-Ahmad"],
  ["sabah al-salem","Sabah Al Salem"],
  ["sabah al salem","Sabah Al Salem"],
  ["south sabahiya","South Sabahiya"],
  ["abdullah port","Abdullah Port"],
  ["saad abdullah","Saad Al Abdullah"],
  ["shuwaikh port","Shuwaikh Port"],
  ["abu hasaniya","Abu Al Hasaniya"],
  ["ali as-salim","Ali As-Salim"],
  ["ali as salim","Ali As-Salim"],
  ["ali al salim","Ali As-Salim"],
  ["bnaid al-qar","Bnaid Al-Qar"],
  ["bnaid al qar","Bnaid Al-Qar"],
  ["jaber al-ali","Jaber Al-Ali"],
  ["jaber al ali","Jaber Al-Ali"],
  ["abu futaira","Abu Futaira"],
  ["jaber ahmed","Jaber Al-Ahmad"],
  ["new khairan","New Khairan City"],
  ["south surra","South Surra"],
  ["sulaibikhat","Sulaibikhat"],
  ["kuwait city","Kuwait City"],
  ["abu halifa","Abu Halifa"],
  ["south doha","South Doha / Qairawan"],
  ["rumaithiya","Rumaithiya"],
  ["old jahra","Jahra"],
  ["doha port","Doha Port"],
  ["farwaniya","Farwaniya"],
  ["new wafra","New Wafra"],
  ["nuwaiseeb","Nuwaiseeb"],
  ["sulaibiya","Sulaibiya"],
  ["adailiya","Adailiya"],
  ["ashbelya","Ashbelya"],
  ["ashbilya","Ashbelya"],
  ["isbiliya","Ashbelya"],
  ["ishbilya","Ashbelya"],
  ["ishbilia","Ashbelya"],
  ["ishbelya","Ashbelya"],
  ["fahaheel","Fahaheel"],
  ["funaitis","Funaitis"],
  ["khaithan","Khaitan"],
  ["khaldiya","Khaldiya"],
  ["mansriya","Mansriya"],
  ["qairawan","Qairawan"],
  ["sabahiya","Sabahiya"],
  ["shuwaikh","Shuwaikh"],
  ["andalus","Andalus"],
  ["amghara","Amghara"],
  ["isbilya","Ashbelya"],
  ["isbelya","Ashbelya"],
  ["bneidar","Bneidar"],
  ["dhajeej","Dhajeej"],
  ["firdous","Firdous"],
  ["ferdous","Firdous"],
  ["granada","Granada (Kuwait)"],
  ["hawally","Hawally"],
  ["hawalli","Hawally"],
  ["jabriya","Jabriya"],
  ["khairan","Khairan"],
  ["khaitan","Khaitan"],
  ["mahbula","Mahbula"],
  ["mishref","Mishref"],
  ["mishrif","Mishref"],
  ["nasseem","Nasseem"],
  ["omariya","Omariya"],
  ["qadsiya","Qadsiya"],
  ["qurtuba","Qurtuba"],
  ["salmiya","Salmiya"],
  ["shamiya","Shamiya"],
  ["shuaiba","Shuaiba (North & South)"],
  ["shuhada","Shuhada"],
  ["yarmouk","Yarmouk"],
  ["abdali","Abdali"],
  ["ahmadi","Ahmadi"],
  ["qurain","Qurain"],
  ["qusour","Qusour"],
  ["riggae","Riggae"],
  ["ardiya","Ardiya"],
  ["egaila","Egaila"],
  ["fintas","Fintas"],
  ["hadiya","Hadiya"],
  ["hittin","Hittin"],
  ["jileia","Jileia"],
  ["kaifan","Kaifan"],
  ["mangaf","Mangaf"],
  ["mirgab","Mirgab"],
  ["misila","Misila"],
  ["nahdha","Nahdha"],
  ["naseem","Nasseem"],
  ["rabiya","Rabiya"],
  ["al rai","Rai"],
  ["sabhan","Sabhan"],
  ["siddiq","Siddiq"],
  ["sikrab","Sikrab"],
  ["jahra","Jahra"],
  ["bayan","Bayan"],
  ["daher","Daher"],
  ["daiya","Daiya"],
  ["dasma","Dasma"],
  ["faiha","Faiha"],
  ["jibla","Jibla"],
  ["jleeb","Jleeb Al-Shuyoukh"],
  ["kabad","Kabad"],
  ["miqwa","Miqwa"],
  ["naeem","Naeem"],
  ["nuzha","Nuzha"],
  ["oyoun","Oyoun"],
  [" rai ","Rai"],
  ["rawda","Rawda"],
  ["rehab","Rehab"],
  ["rihab","Rihab"],
  ["riqqa","Riqqa"],
  ["salam","Salam"],
  ["salmi","Salmi"],
  ["salwa","Salwa"],
  ["shaab","Shaab"],
  ["sharq","Sharq"],
  ["surra","Surra"],
  ["taima","Taima"],
  ["wafra","Wafra"],
  ["zahra","Zahra"],
  ["adan","Adan"],
  ["bida","Bida"],
  ["doha","Doha"],
  ["qasr","Qasr"],
  ["waha","Waha"],
  ["zoor","Zoor"]
];

function detectArea(address) {
  if (!address) return null;
  var addr = address.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (var i = 0; i < KUWAIT_AREAS.length; i++) {
    if (addr.indexOf(KUWAIT_AREAS[i][0]) !== -1) return KUWAIT_AREAS[i][1];
  }
  return null;
}

const STATUS_CFG = {
  pending:   { label:"Pending",   color:"#F59E0B", bg:"rgba(245,158,11,.15)",  icon:"" },
  collected: { label:"Collected", color:"#00D4FF", bg:"rgba(0,212,255,.15)",   icon:"📦" },
  delivered: { label:"Delivered", color:"#10B981", bg:"rgba(16,185,129,.15)",  icon:"" },
  cancelled: { label:"Cancelled", color:"#EF4444", bg:"rgba(239,68,68,.15)",   icon:"" },
  postponed: { label:"Postponed", color:"#8B5CF6", bg:"rgba(139,92,246,.15)",  icon:"" },
};

const fmt = n => "KD " + Number(n).toFixed(3);
function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g,"").slice(0,16).toUpperCase();
    }
  } catch(e) {}
  // Fallback: combine multiple Math.random calls for more entropy
  return (Math.random().toString(36).slice(2,7) + Math.random().toString(36).slice(2,7)).toUpperCase();
}

/*  Shared UI  */
const Badge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span style={{ background:c.bg, color:c.color, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", whiteSpace:"nowrap" }}>{c.icon} {c.label}</span>;
};
const Pill = ({ label, active, onClick, count }) => (
  <button onClick={onClick} style={{ background:active?"#00D4FF":"rgba(255,255,255,.07)", color:active?"#090B10":"rgba(255,255,255,.6)", border:"none", borderRadius:20, padding:"6px 14px", fontSize:12, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontWeight:active?600:400, cursor:"pointer", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
    {label}{count!==undefined&&<span style={{background:active?"rgba(0,0,0,.15)":"rgba(255,255,255,.15)",borderRadius:10,padding:"1px 6px",fontSize:10}}>{count}</span>}
  </button>
);
const Toast = ({ msg, toastKind="info" }) => {
  const c2 = { info:"rgba(0,212,255,.9)", success:"rgba(16,185,129,.9)", warn:"rgba(245,158,11,.9)", error:"rgba(239,68,68,.9)" }[toastKind] || "rgba(0,212,255,.9)";
  return <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:c2, borderRadius:30, padding:"10px 20px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, zIndex:400, whiteSpace:"nowrap", boxShadow:"0 8px 32px rgba(0,0,0,.4)", animation:"fadeIn .3s" }}>{msg}</div>;
};

// ============================================================
// SECTION 5: PDF PARSER
// Lines: parseSAPDeliveryText, PDFUploadPanel
// Fix PDF issues here — tryExtractOO, normDate, tokenizer
// ============================================================
/*  PDF Upload & Parse (uses Anthropic API)  */
/*  Local SAP PDF text parser (no external API calls)  */
function parseSAPDeliveryText(rawText) {
  // This parser handles SAP "Bill wise details" report where pdf.js
  // extracts text with "---" separating fields on each line.
  // 
  // Format observed:
  // "Bill wise details --- From D/M/YYYY To D/M/YYYY"
  // "COMPANY NAME"
  // "Grand Hyper Building - Floor 6 --- Block 7 - ..."
  // "Delivery Boy : Jasir"
  // "Date --- --- Invoice No --- --- Invoice Total --- Open Amount ..."
  // "ReStore Online --- Customer : --- [invoiceNo] --- [date] --- [total] --- [total] --- [customer] --- [address...] --- [phone] --- [payment]"
  // OR orders may appear on separate lines after store header

  // Normalize: split on newlines, also split tokens by " --- "
  const rawLines = rawText.split("\n").map(l => l.trim()).filter(Boolean);

  let driverName = "";
  let company = "";

  // Extract driver name and company
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    const dm = l.match(/Delivery\s+(?:Boy|Man|Driver)\s*[:\-]\s*(.+)/i);
    if (dm) driverName = dm[1].replace(/---.*/, "").trim();
    if (!company && (l.includes("TELECOM") || l.includes("TRADING") || l.includes("LLC") || l.includes("W.L.L") || l.includes("CO."))) {
      company = l.replace(/---.*/, "").trim();
    }
  }

  // Flatten all tokens: split on --- or --, then also split compound SAP row tokens
  // like '6/4/2026 1164441 12.90 12.90 6/4/2026 2' which pdf.js concatenates
  // when multiple table cells share the same Y-coordinate line.
  const tokens = [];
  for (let i = 0; i < rawLines.length; i++) {
    const cleanLine = rawLines[i].replace(/\x0c/g, '').trim();
    if (!cleanLine) continue;
    const parts = cleanLine.split(/\s+---+\s+|\s+--\s+/);
    for (let j = 0; j < parts.length; j++) {
      const t = parts[j].trim();
      if (!t) continue;
      // Split compound SAP row tokens that contain an invoice no + date + amount on one line
      if (/\b\d{7}\b/.test(t) && /\b\d+\.\d{2,3}\b/.test(t) && /\b\d{1,2}\/\d{1,2}\/\d{4}\b/.test(t)) {
        t.split(/\s+/).forEach(function(piece){ if (piece) tokens.push(piece); });
      } else {
        tokens.push(t);
      }
    }
  }

  const dateRe    = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;
  const invoiceRe = /^\d{7}$/;  // SAP invoice numbers are exactly 7 digits (e.g. 1163470)
  const amountRe  = /^\d+\.\d{2,3}$/;
  // OO detection handled inline in parser loop

  // DEBUG: log all tokens to console
  // debug logs removed for production

  function detectPayment(s) {
    const l = (s || "").toLowerCase();
    if (l.includes("knet") || l.includes("k-net") || l.includes("k net") || l === "/knet") return "KNET";
    if (l.includes("tabby") || l === "/tb")   return "Tabby";
    if (l.includes("deema") || l === "/dm")   return "Deema";
    if (l.includes("tamara"))                  return "Tamara";
    if (l.includes("taly") || l === "/taly")  return "Taly";
    if (l.includes("visa") || l.includes("mastercard") || l === "/vmc") return "VISA/Mastercard";
    if (l.includes("exchange") || l === "ex" || l === "/ex") return "Exchange";
    if (l.includes("tap"))                     return "Tap/KNET";
    if (l.includes("wamd") || l === "/wamd")  return "WAMD";
    if (l.includes("gocollect") || l.includes("go collect")) return "GoCollect";
    if (l.includes("cash") || l.includes("basic") || l.includes("cod") || l === "/js") return "Cash";
    return null;
  }

  const orders = [];
  let currentStore = "";
  let i = 0;

  // Extract OO number from a token — returns {num, payHint} or null
  function extractOO(tok) {
    const m = tok && tok.match(/^(\d{4,6})([/\w]*)?$/);
    if (!m) return null;
    const dateRe2 = /^\d{1,2}[/\-]\d{1,2}[/\-]\d{4}$/;
    const amtRe2  = /^\d+\.\d{2,3}$/;
    if (dateRe2.test(tok) || amtRe2.test(tok)) return null;
    const ooNum  = m[1];
    const ooRest = tok.slice(ooNum.length).toLowerCase();
    let payHint = null;
    if (/\/tb\b|tabby/.test(ooRest))                payHint = "Tabby";
    else if (/\/dm\b|deema/.test(ooRest))           payHint = "Deema";
    else if (/\/ex\b/.test(ooRest))                 payHint = "Exchange";
    else if (/\/js\b/.test(ooRest))                 payHint = "Cash";
    else if (/\/knet\b|knet/.test(ooRest))          payHint = "KNET";
    else if (/\/vmc\b|visa|mastercard/.test(ooRest)) payHint = "VISA/Mastercard";
    else if (/\/taly\b|taly/.test(ooRest))          payHint = "Taly";
    else if (/\/wamd\b|wamd/.test(ooRest))          payHint = "WAMD";
    if (ooNum.length === 6 && payHint === null) return null; // phone fragment
    return { num: ooNum, payHint };
  }


  // Try-extract OO — returns {num, payHint} or null
  // For ReStore/GadgetPro: OO IS the last 6 digits of the mobile number (6-digit, no suffix)
  // For other stores: reject 6-digit with no suffix (= phone fragment leaked into OO column)
  function tryExtractOO(candidate, store) {
    if (!candidate) return null;
    const s = candidate.trim();
    const m = s.match(/^(\d{4,6})([/\w]*)?$/);
    if (!m) return null;
    const ooNum  = m[1];
    const ooRest = s.slice(ooNum.length).toLowerCase();
    let payHint = null;
    if (/\/tb\b|tabby/.test(ooRest))                payHint = "Tabby";
    else if (/\/dm\b|deema/.test(ooRest))           payHint = "Deema";
    else if (/\/ex\b/.test(ooRest))                 payHint = "Exchange";
    else if (/\/js\b/.test(ooRest))                 payHint = "Cash";
    else if (/\/knet\b|knet/.test(ooRest))          payHint = "KNET";
    else if (/\/vmc\b|visa|mastercard/.test(ooRest)) payHint = "VISA/Mastercard";
    else if (/\/taly\b|taly/.test(ooRest))          payHint = "Taly";
    else if (/\/wamd\b|wamd/.test(ooRest))          payHint = "WAMD";
    // ReStore & GadgetPro: their OO numbers ARE 6-digit (last 6 of mobile) — accept them
    const isRestoreOrGadget = /restore|gadgetpro/i.test(store || "");
    if (isRestoreOrGadget && ooNum.length === 6 && payHint === null) {
      return { num: ooNum, payHint: null };
    }
    // Other stores: reject bare 6-digit = phone fragment (468710, 636836 etc.)
    if (ooNum.length === 6 && payHint === null) return null;
    return { num: ooNum, payHint };
  }

  // Skip header tokens until we find "Customer :" which marks store sections
  let pendingOO = ""; // OO that appeared between page header and next invoice
  while (i < tokens.length) {
    const t = tokens[i];

    // Store header: "ReStore Online" followed by "Customer :" or just detect known store names
    if (/^(?:ReStore|Trikart|Webstore|GadgetPro|Re\s*Store)/i.test(t)) {
      currentStore = t;
      i++;
      continue;
    }
    // "Customer :" token - store name was the token before
    if (/^Customer\s*:?\s*$/i.test(t)) {
      i++;
      continue;
    }
    // Detect store from "Customer : StoreName" pattern in raw lines
    const storeMatch = t.match(/(?:Customer|BP\s*Name)\s*[:\-]\s*(.+)/i);
    if (storeMatch && storeMatch[1].trim()) {
      currentStore = storeMatch[1].trim();
      i++;
      continue;
    }

    // Orphaned OO token — appears between page header and the next invoice
    // This is the OO for the PREVIOUS order (last order on the previous page)
    const orphanOO = tryExtractOO(t, currentStore);
    if (orphanOO && orders.length > 0 && !orders[orders.length - 1].onlineOrderNo) {
      orders[orders.length - 1].onlineOrderNo = orphanOO.num;
      if (orphanOO.payHint && orders[orders.length - 1].paymentType === "Cash") {
        orders[orders.length - 1].paymentType = orphanOO.payHint;
      }
      i++;
      continue;
    }

    // Order start: invoice number (7 digits)
    if (invoiceRe.test(t)) {
      const invoiceNo = t;
      i++;

      let date          = "";
      let onlineOrderNo = "";
      let total         = 0;
      let paymentType   = "Cash";
      const addrTokens  = [];

      // ── CONFIRMED REAL TOKEN ORDER (from pdf.js debug) ──
      // Each SAP table row: invoice, OO, amount, amount, date, overdue, payment, customer, address...
      // Amounts have LEADING SPACES: " 12.90" not "12.90"
      // OO is ALWAYS the token immediately after invoice (index 0 of orderTokens)
      // EXCEPT for ReStore orders which have no OO (phone fragment like "468710" in that slot)

      // Collect all tokens until next invoice/store
      // Skip footer/header junk but DON'T stop — the OO for last-on-page orders
      // appears AFTER the page header on the next page, before the next invoice
      var orderTokens = [];
      let orderGuard = 0;
      while (i < tokens.length && orderGuard < 120) {
        orderGuard++;
        const tok = tokens[i];
        if (invoiceRe.test(tok) && tok !== invoiceNo) break;
        if (/^Customer\s*:?\s*$/i.test(tok)) break;
        if (/^(?:ReStore|Trikart|Webstore|GadgetPro)/i.test(tok)) break;
        // Skip all footer and page-header junk
        if (/^(?:Page|Printed|SAP|Business|One|▐|Bill wise)/i.test(tok)) { i++; continue; }
        if (/^(?:Printed by|Printed on|Printed by:)/i.test(tok)) { i++; continue; }
        if (/^\x0c/.test(tok)) { i++; continue; }
        if (/^\s*\d{1,2}:\d{2}/.test(tok)) { i++; continue; }  // timestamps
        if (/^(?:Invoice No|Invoice Total|Online Order No|Open Amount|Due On|Overdue days|Payment Terms|Date)$/i.test(tok)) { i++; continue; }
        if (/^\d+\/\d+$/.test(tok) && !/[a-z]/i.test(tok)) { i++; continue; }  // page numbers like 1/3
        orderTokens.push(tok);
        i++;
      }

      // Debug: log orderTokens for every order

      // Find OO by scanning BACKWARDS from end (skip dates/amounts/phone numbers)
      // then fall back to checking first token (page-break case)
      var ooFoundIdx = -1;
      for (var bi = orderTokens.length - 1; bi >= 0; bi--) {
        const bt = orderTokens[bi].trim();
        // Skip: dates, amounts with decimals, large phone numbers (8+ digits), page numbers
        if (dateRe.test(bt)) continue;
        if (/^\d+\.\d+$/.test(bt)) continue;
        if (/^\d{7,}$/.test(bt)) continue;        // 7+ digit = invoice or phone
        if (/^\d{1,3}$/.test(bt)) continue;        // 1-3 digit = overdue days
        if (/^\d+\/\d+$/.test(bt) && !/[a-z]/i.test(bt)) continue; // page numbers
        // If it matches OO format, extract it
        const r = tryExtractOO(bt, currentStore);
        if (r) { ooFoundIdx = bi; onlineOrderNo = r.num; if (r.payHint) paymentType = r.payHint; break; }
        // If it's clearly address/name text, stop looking backwards
        if (/[a-zA-Z]{3,}/.test(bt) && !/^[\d/]+$/.test(bt)) break;
      }
      if (ooFoundIdx >= 0) {
        orderTokens.splice(ooFoundIdx, 1);
      } else {
        // Backwards scan stopped at address text before reaching OO.
        // For page-break orders, OO is always orderTokens[0] (right after invoice).
        const firstResult = tryExtractOO(orderTokens[0], currentStore);
        if (firstResult) {
          onlineOrderNo = firstResult.num;
          if (firstResult.payHint) paymentType = firstResult.payHint;
          orderTokens.shift();
        }
      }

      // Process remaining tokens — amounts have leading spaces so trim first
      const SKIP_RE = /^(?:Page|Printed|SAP|Business|One|Fahaheel|AMTEL|TELECOM|GENEAL|TRADING|Grand|Hyper|Office|Kuwait|FA|JA|KU|AH|HA|Invoice No|Invoice Total|Online Order No|Open Amount|Due On|Overdue days|Payment Terms|Date|▐)$/i;
      for (let j = 0; j < orderTokens.length; j++) {
        const tok = orderTokens[j].trim(); // TRIM leading spaces (amounts have them)
        if (!tok) continue;
        if (SKIP_RE.test(tok)) continue;
        if (/^\d{1,2}:\d{2}/.test(tok)) continue;
        if (/^\d+\/\d+$/.test(tok) && !/[a-z]/i.test(tok)) continue;
        if (dateRe.test(tok)) { if (!date) date = tok; continue; }
        if (amountRe.test(tok)) { if (!total) total = parseFloat(tok); continue; }
        if (/^\d{1,3}$/.test(tok)) continue;
        const dp = detectPayment(tok);
        if (dp) { if (paymentType === "Cash") paymentType = dp; continue; }
        addrTokens.push(tok);
      }

      // Parse address tokens: first is customer name, then address parts, phone last
      // Safety filter: remove header/footer junk tokens
      const JUNK_RE = /^(?:Invoice No|Invoice Total|Online Order No|Open Amount|Due On|Overdue days|Payment Terms|Date|Invoice|No|Total|Amount|Due|Overdue|Payment|Terms|Online|Order|Open|Name|Location|Delivery|Boy|Man|Area|Page|Printed|SAP|Business|One|Fahaheel|AMTEL|TELECOM|KU|FA|JA|AH|HA)$/i;
      const cleanAddrTokens = addrTokens.filter(function(t) {
        if (!t) return false;
        if (JUNK_RE.test(t)) return false;
        if (/Printed|SAP Business|Business One|Page:/i.test(t)) return false;
        if (/^\d{1,2}:\d{2}/.test(t)) return false;
        if (/^\d+\/\d+$/.test(t)) return false;
        return true;
      });
      let customer = cleanAddrTokens[0] || "Unknown";
      let phone = "";
      const addrParts = [];
      for (let ai = 1; ai < cleanAddrTokens.length; ai++) {
        const at = cleanAddrTokens[ai];
        const _atPhone = at.replace(/^T\s*:\s*/i, '').trim();
        if (/^[+\d][\d\s\-()]{6,}$/.test(_atPhone.replace(/\s/g, ""))) {
          if (!phone) phone = _atPhone;
        } else {
          addrParts.push(at);
        }
      }
      // Clean prefixes from customer and address
      const cleanCustomer = customer
        .replace(/^(?:Address|Name|Customer|T)\s*:/i, "").trim() || "Unknown";
      const cleanAddress = addrParts
        .map(a => a.replace(/^(?:Address|Location|Block|Street|Building|Floor|Area|City)\s*:/i, "").trim())
        .filter(function(a){ return a && !/^[A-Z]{2}$/.test(a); })
        .join(", ");

      if (invoiceNo && (total > 0 || paymentType === "Exchange")) {
        // If customer name is purely numeric and no OO yet, it's likely the OO number
        var finalCustomer = cleanCustomer || "Unknown";
        var finalOO = onlineOrderNo;
        if (/^\d{4,12}$/.test(finalCustomer) && !finalOO) {
          finalOO = finalCustomer;
          finalCustomer = "Unknown";
        }
        orders.push({
          invoiceNo, onlineOrderNo: finalOO, date,
          store: currentStore || "Unknown Store",
          customer: finalCustomer,
          address: cleanAddress, phone, total, paymentType,
          status: "pending", driverId: null, scanned: false
        });
      }
      continue;
    }

    i++;
  }

  return { driverName, company, orders };
}


function PDFUploadPanel({ onOrdersParsed }) {
  const [file, setFile]       = useState(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError]     = useState("");
  const fileRef = useRef();

  async function handleFile(f) {
    if (!f || f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f); setError(""); setParsing(true); setProgress("Reading PDF...");
    try {
      // Use pdf.js from CDN to extract text locally - no API call needed
      const arrayBuffer = await f.arrayBuffer();
      setProgress("Extracting text...");

      // Dynamically load pdf.js
      if (!window.pdfjsLib) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const tc   = await page.getTextContent();
        // Join items with \n so each text element is its own line
        const pageText = tc.items.map(it => it.str).join("\n");
        fullText += pageText + "\n";
      }

      const lineCount = fullText.split("\n").filter(Boolean).length;

      setProgress("Parsing " + lineCount + " lines... please wait");

      // Run parser in next tick so UI can update progress text first
      await new Promise(function(res) { setTimeout(res, 50); });

      let result;
      try {
        result = parseSAPDeliveryText(fullText);
      } catch(parseErr) {
        throw new Error("Parser error: " + parseErr.message);
      }

      if (result.orders.length === 0) {
        const previewLines = fullText.split("\n").filter(Boolean).slice(0, 50).join("\n---\n");
        setError("Parsed " + lineCount + " lines but found 0 orders.\n\nFirst 50 lines of extracted text:\n\n" + previewLines);
        setParsing(false);
        return;
      }

setProgress("Found " + result.orders.length + " orders for " + (result.driverName || "driver") + "!");
      setTimeout(() => {
        onOrdersParsed(result.orders, result.driverName || "", result.company || "");
      }, 600);
    } catch (e) {
      console.error(e);
      const previewLines = fullText.split("\n").filter(Boolean).slice(0, 60).join("\n");
      setError("Could not parse PDF. Raw text preview (first 60 lines):\n\n" + previewLines);
    } finally {
      setParsing(false);
    }
  }

  return (
    <div style={{ background:"rgba(255,255,255,.04)", border:"1.5px dashed rgba(0,212,255,.35)", borderRadius:18, padding:24 }}>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:16, fontWeight:700, marginBottom:4 }}> Upload Delivery PDF</div>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:13, marginBottom:18 }}>SAP Business One   Bill-wise Details report</div>

      <input ref={fileRef} type="file" accept="application/pdf" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />

      <div onClick={() => !parsing && fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        style={{ background:"rgba(0,212,255,.05)", borderRadius:14, padding:"28px 20px", textAlign:"center", cursor:parsing?"not-allowed":"pointer", border:"1px solid rgba(0,212,255,.15)" }}>
        {parsing ? (
          <div>
            <div style={{ fontSize:32, marginBottom:10, animation:"spin 1s linear infinite", display:"inline-block" }}></div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:14 }}>{progress}</div>
          </div>
        ) : file ? (
          <div>
            <div style={{ fontSize:32, marginBottom:8 }}></div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:14, fontWeight:700 }}>{file.name}</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginTop:4 }}>{progress || "Click to upload a different file"}</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:40, marginBottom:10 }}></div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:600 }}>Drop PDF here or click to browse</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:13, marginTop:6 }}>Supports SAP Business One delivery reports</div>
          </div>
        )}
      </div>

      {error && <div style={{ background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.3)", borderRadius:10, padding:"10px 12px", marginTop:10, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#F59E0B", fontSize:13 }}> {error}</div>}


      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ============================================================
// SECTION 6: ADMIN — UPLOAD & ASSIGN
// Lines: LabelScanner, ManualOrderForm, AdminUploadTab
// Fix order assignment issues here
// ============================================================
/*  Admin: Upload & Assign  */




// ── API Key helpers — stored in localStorage, never in code ──────────────────
function getApiKey() {
  try { return localStorage.getItem("df_anthropic_key") || ""; } catch(e) { return ""; }
}
function saveApiKey(key) {
  try { localStorage.setItem("df_anthropic_key", key.trim()); } catch(e) {}
}

// ── Label Scanner — shared by Admin & Driver manual order forms ──────────────
function LabelScanner({ onExtracted, onError }) {
  const [scanning, setScanning] = useState(false);
  const inputRef = React.useRef(null);

  function handleFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var apiKey = getApiKey();
    if (!apiKey) {
      onError && onError("No API key set. Go to Admin → Vehicles tab → API Key Settings and enter your Anthropic API key.");
      e.target.value = "";
      return;
    }

    setScanning(true);
    var reader = new FileReader();
    reader.onload = function(ev) {
      var base64 = ev.target.result.split(",")[1];
      var mediaType = file.type || "image/jpeg";
      fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "Extract order details from this delivery label image. Return ONLY a JSON object with these exact keys (use empty string if not found):\n{\n  \"store\": \"\",\n  \"invoiceNo\": \"\",\n  \"onlineOrderNo\": \"\",\n  \"customer\": \"\",\n  \"address\": \"\",\n  \"phone\": \"\",\n  \"total\": \"\",\n  \"paymentType\": \"\"\n}\nFor store: match to one of 'Trikart Online', 'Webstore Online', 'ReStore Online', 'GadgetPro Online', or use the label's store name.\nFor paymentType: map 'Cash Basic' or 'Cash' to 'Cash', 'KNET' to 'KNET', etc.\nFor total: extract the numeric amount only (e.g. '19.900').\nFor invoiceNo: the barcode number printed below the barcode on the label.\nReturn only the raw JSON, no markdown, no explanation." }
            ]
          }]
        })
      })
      .then(function(res) {
        if (!res.ok) {
          return res.text().then(function(t) {
            var msg = t;
            try { msg = JSON.parse(t).error && JSON.parse(t).error.message || t; } catch(e2) {}
            throw new Error(res.status === 401 ? "Invalid API key. Check Admin → Vehicles → API Key Settings." : "API error " + res.status + ": " + msg);
          });
        }
        return res.json();
      })
      .then(function(data) {
        setScanning(false);
        var text = (data.content && data.content[0] && data.content[0].text) || "";
        if (!text) { onError && onError("Could not read label. Please enter details manually."); return; }
        try {
          var clean = text.replace(/```json|```/g, "").trim();
          var parsed = JSON.parse(clean);
          onExtracted(parsed);
        } catch(ex) {
          onError && onError("Could not read label. Please enter details manually.");
        }
      })
      .catch(function(err) {
        setScanning(false);
        console.warn("LabelScanner error:", err);
        onError && onError(err.message || "Scan failed. Please enter details manually.");
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        onChange={handleFile}
        style={{ display:"none" }} />
      <button
        onClick={function(){ if (!scanning) inputRef.current && inputRef.current.click(); }}
        style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          background: scanning ? "rgba(0,212,255,.08)" : "rgba(0,212,255,.12)",
          border: "1.5px solid rgba(0,212,255,.35)",
          borderRadius:10, padding:"8px 14px",
          color: scanning ? "rgba(0,212,255,.5)" : "#00D4FF",
          fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, fontWeight:600,
          cursor: scanning ? "default" : "pointer",
          whiteSpace:"nowrap", flexShrink:0,
          transition:"opacity .2s",
        }}>
        {scanning
          ? <><span style={{ fontSize:14, animation:"pulse 1s ease-in-out infinite" }}>⏳</span> Reading…</>
          : <><span style={{ fontSize:16 }}>📷</span> Scan Label</>}
      </button>
    </>
  );
}

function ManualOrderForm({ onAdd, driverList }) {
  const [show, setShow]     = useState(false);
  const [store, setStore]   = useState("Webstore Online");
  const [invoiceNo, setInv] = useState("");
  const [ooNo, setOoNo]     = useState("");
  const [customer, setCust] = useState("");
  const [address, setAddr]  = useState("");
  const [phone, setPhone]   = useState("");
  const [total, setTotal]   = useState("");
  const [pay, setPay]       = useState("Cash");
  const [driver, setDriver] = useState("");
  const [err, setErr]         = useState("");
  const [area, setArea]       = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaDrop, setShowAreaDrop] = useState(false);
  const [customStoreName, setCustomStoreName] = useState("");
  const [scanMsg, setScanMsg] = useState("");

  function fillFromScan(fields) {
    if (!show) setShow(true);
    setScanMsg("");
    if (fields.store) {
      var knownStores = ["Trikart Online","Webstore Online","ReStore Online","GadgetPro Online"];
      if (knownStores.includes(fields.store)) { setStore(fields.store); }
      else { setStore("Other"); setCustomStoreName(fields.store); }
    }
    if (fields.invoiceNo)     setInv(fields.invoiceNo);
    if (fields.onlineOrderNo) setOoNo(fields.onlineOrderNo);
    if (fields.customer)      setCust(fields.customer);
    if (fields.address)       setAddr(fields.address);
    if (fields.phone)         setPhone(fields.phone);
    if (fields.total)         setTotal(String(fields.total));
    if (fields.paymentType) {
      var knownPays = ["Cash","KNET","Deema","Tabby","Taly","VISA/Mastercard","Tap/KNET","GoCollect","Exchange"];
      if (knownPays.includes(fields.paymentType)) setPay(fields.paymentType);
    }
    setScanMsg("✅ Label scanned — please review and confirm details below.");
  }
  const MANUAL_PAYS = ["Cash","KNET","Deema","Tabby","Taly","VISA/Mastercard","Tap/KNET","GoCollect","Exchange"];
  const ALL_AREAS = ['Abdali', 'Abdulla Al-Salem', 'Abdullah Al-Mubarak', 'Abdullah Port', 'Abu Al Hasaniya', 'Abu Futaira', 'Abu Halifa', 'Adailiya', 'Adan', 'Ahmadi', 'Airport District', 'Ali As-Salim', 'Amghara', 'Andalus', 'Ardiya', 'Ardiya Herafiya', 'Ardiya Industrial Area', 'Ashbelya', 'Bayan', 'Bida', 'Bnaid Al-Qar', 'Bneidar', 'Daher', 'Daiya', 'Dasma', 'Dhajeej', 'Doha', 'Doha Port', 'Egaila', 'Fahad Al-Ahmad', 'Fahaheel', 'Faiha', 'Farwaniya', 'Fintas', 'Firdous', 'Funaitis', 'Granada (Kuwait)', 'Hadiya', 'Hawally', 'Hittin', 'Jaber Al-Ahmad', 'Jaber Al-Ali', 'Jabriya', 'Jahra', 'Jahra Industrial Area', 'Jawaher Al Wafra', 'Jibla', 'Jileia', 'Jleeb Al-Shuyoukh', 'Kabad', 'Kaifan', 'Khairan', 'Khaitan', 'Khaldiya', 'Kuwait City', 'Mahbula', 'Maidan Hawalli', 'Mangaf', 'Mansriya', 'Miqwa', 'Mirgab', 'Mishref', 'Misila', 'Mubarak Al-Kabeer', 'Naeem', 'Nahda / East Sulaibikhat', 'Nahdha', 'Nasseem', 'New Khairan City', 'New Wafra', 'North West Sulaibikhat', 'Nuwaiseeb', 'Nuzha', 'Omariya', 'Oyoun', 'Qadsiya', 'Qairawan', 'Qasr', 'Qurain', 'Qurtuba', 'Qusour', 'Rabiya', 'Rai', 'Rawda', 'Rehab', 'Riggae', 'Rihab', 'Riqqa', 'Rumaithiya', 'Saad Al Abdullah', 'Sabah Al Salem', 'Sabah Al-Ahmad', 'Sabah Al-Nasser', 'Sabahiya', 'Sabhan', 'Salam', 'Salmi', 'Salmiya', 'Salwa', 'Shaab', 'Shamiya', 'Sharq', 'Shuaiba (North & South)', 'Shuhada', 'Shuwaikh', 'Shuwaikh Industrial Area', 'Shuwaikh Port', 'Siddiq', 'Sikrab', 'South Doha / Qairawan', 'South Sabahiya', 'South Surra', 'Sulaibikhat', 'Sulaibiya', 'Sulaibiya Agricultural Area', 'Surra', 'Taima', 'Wafra', 'Waha', 'Yarmouk', 'Zahra', 'Zoor'];

  function submit() {
    if (!invoiceNo.trim()) { setErr("Invoice number required"); return; }
    if (!ooNo.trim()) { setErr("Online Order No is required"); return; }
    if (!total || isNaN(total) || Number(total) <= 0) { setErr("Valid amount required"); return; }
    if (!driver) { setErr("Select a driver"); return; }
    setErr("");
    var finalStore = store === "Other" ? (customStoreName.trim() || "Other Store") : store;
    var fullAddress = address.trim() + (area ? ", " + area : "");
    onAdd({
      id: uid(),
      invoiceNo: invoiceNo.trim(),
      onlineOrderNo: ooNo.trim(),
      customer: customer.trim() || "Unknown",
      address: fullAddress,
      phone: phone.trim(),
      total: Number(total),
      paymentType: pay,
      originalPaymentType: "",
      store: finalStore, status: "pending",
      driverId: driver,
      scanned: false,
      date: (function(){ var d=new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })(),
      assignedDate: (function(){ var d=new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })(),
      note: "Manual entry",
    });
    // Reset
    setInv(""); setOoNo(""); setCust(""); setAddr(""); setPhone(""); setTotal(""); setPay("Cash"); setArea(""); setAreaSearch(""); setCustomStoreName(""); setScanMsg("");
    setShow(false);
  }

  if (!show) return (
    <div style={{ display:"flex", gap:8, marginBottom:12 }}>
      <button onClick={function(){ setShow(true); }}
        style={{ flex:1, background:"rgba(255,90,31,.08)", border:"1px dashed rgba(255,90,31,.4)", borderRadius:12, padding:"12px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>
        + Add Manual Order
      </button>
      <LabelScanner
        onExtracted={function(fields){ fillFromScan(fields); }}
        onError={function(msg){ setScanMsg("⚠️ " + msg); setShow(true); }}
      />
    </div>
  );

  return (
    <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,90,31,.3)", borderRadius:14, padding:16, marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:14, fontWeight:800 }}>Manual Order Entry</div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <LabelScanner
            onExtracted={fillFromScan}
            onError={function(msg){ setScanMsg("⚠️ " + msg); }}
          />
          <button onClick={function(){ setShow(false); setErr(""); setScanMsg(""); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,.4)", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
      </div>
      {scanMsg && (
        <div style={{ background: scanMsg.startsWith("✅") ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)", border:"1px solid " + (scanMsg.startsWith("✅") ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"), borderRadius:10, padding:"8px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, color: scanMsg.startsWith("✅") ? "#10B981" : "#EF4444", marginBottom:12 }}>
          {scanMsg}
        </div>
      )}

      {/* Store */}
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:6 }}>STORE</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
        {["Trikart Online","Webstore Online","ReStore Online","GadgetPro Online","Other"].map(function(s){
          return <button key={s} onClick={function(){ setStore(s); if(s!=="Other") setCustomStoreName(""); }}
            style={{ background:store===s?"rgba(0,212,255,.15)":"rgba(255,255,255,.06)", border:store===s?"1.5px solid #00D4FF":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"5px 12px", color:store===s?"#00D4FF":"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>{s}</button>;
        })}
      </div>
      {store === "Other" && (
        <div style={{ marginBottom:12 }}>
          <input type="text" value={customStoreName} onChange={function(e){ setCustomStoreName(e.target.value); }}
            placeholder="Enter store name..."
            style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(0,212,255,.3)", borderRadius:10, padding:"9px 12px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
        </div>
      )}

      {/* Driver */}
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:6 }}>ASSIGN TO DRIVER</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {driverList.map(function(d){
          return <button key={d.id} onClick={function(){ setDriver(d.id); }}
            style={{ background:driver===d.id?"rgba(0,212,255,.15)":"rgba(255,255,255,.06)", border:driver===d.id?"1.5px solid #00D4FF":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"5px 12px", color:driver===d.id?"#00D4FF":"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>{d.name}</button>;
        })}
      </div>

      {/* Fields */}
      {[
        ["Invoice No *", invoiceNo, setInv, "text", "e.g. 1163999"],
        ["Online Order No *", ooNo, setOoNo, "text", "e.g. 26999 or 75999"],
        ["Customer Name", customer, setCust, "text", "Customer name"],
        ["Address", address, setAddr, "text", "Delivery address"],
      ].map(function(f){
        return (
          <div key={f[0]} style={{ marginBottom:10 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:4 }}>{f[0].toUpperCase()}</div>
            <input type={f[3]} value={f[1]} onChange={function(e){ f[2](e.target.value); }} placeholder={f[4]}
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"10px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
          </div>
        );
      })}

      {/* Area selector — after address */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:4 }}>AREA (KUWAIT)</div>
        <input type="text" value={areaSearch}
          onChange={function(e){ setAreaSearch(e.target.value); setArea(""); }}
          placeholder="Type to search area..."
          style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:area?"10px 10px 0 0":"10", padding:"10px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none", borderBottom:areaSearch&&!area?"none":"1px solid rgba(255,255,255,.12)" }} />
        {area ? (
          <div style={{ background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)", borderRadius:10, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:13, fontWeight:600 }}>{area}</span>
            <button onClick={function(){ setArea(""); setAreaSearch(""); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:14 }}>✕</button>
          </div>
        ) : areaSearch ? (
          <div style={{ background:"#1A2035", border:"1px solid rgba(255,255,255,.15)", borderRadius:"0 0 10px 10px", maxHeight:160, overflowY:"auto" }}>
            {ALL_AREAS.filter(function(a){ return a.toLowerCase().includes(areaSearch.toLowerCase()); }).slice(0,20).map(function(a){
              return <div key={a} onClick={function(){ setArea(a); setAreaSearch(a); }}
                style={{ padding:"8px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.8)", fontSize:12, cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,.05)" }}>{a}</div>;
            })}
          </div>
        ) : null}
      </div>

      {/* Phone + Amount — after area */}
      {[
        ["Phone", phone, setPhone, "tel", "+965 XXXX XXXX"],
        ["Amount (KD) *", total, setTotal, "number", "0.000"],
      ].map(function(f){
        return (
          <div key={f[0]} style={{ marginBottom:10 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:4 }}>{f[0].toUpperCase()}</div>
            <input type={f[3]} value={f[1]} onChange={function(e){ f[2](e.target.value); }} placeholder={f[4]}
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"10px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
          </div>
        );
      })}

      {/* Payment */}
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8 }}>PAYMENT TYPE</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {MANUAL_PAYS.map(function(p){
          return <button key={p} onClick={function(){ setPay(p); }}
            style={{ background:pay===p?"rgba(16,185,129,.15)":"rgba(255,255,255,.06)", border:pay===p?"1.5px solid #10B981":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"5px 12px", color:pay===p?"#10B981":"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>{p}</button>;
        })}
      </div>

      {err && <div style={{ color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, marginBottom:8 }}>{err}</div>}

      <button onClick={submit}
        style={{ width:"100%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", border:"none", borderRadius:12, padding:"13px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer" }}>
        Add Order
      </button>
    </div>
  );
}

// ============================================================
// SECTION 6B: SUPABASE DB MANAGER
// Count panel + Search/Delete + Clear/Wipe controls
// Admin only — appears at bottom of Upload tab
// ============================================================
function SupabaseDBManager({ onOrdersRefresh }) {
  const [counts, setCounts]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [searchQ, setSearchQ]       = useState("");
  const [searching, setSearching]   = useState(false);
  const [results, setResults]       = useState(null);
  const [confirm, setConfirm]       = useState(null); // { type, label, action }
  const [msg, setMsg]               = useState("");
  const [open, setOpen]             = useState(false);

  var todayStr = (function(){ var d=new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })();

  function showMsg(m, isErr) {
    setMsg((isErr ? "⚠️ " : "✅ ") + m);
    setTimeout(function(){ setMsg(""); }, 3000);
  }

  function fetchCounts() {
    setLoading(true);
    var sb = getSupabase && getSupabase();
    if (!sb) { setLoading(false); return; }
    sb.from("orders").select("driver_id, assigned_date, status").then(function(res) {
      setLoading(false);
      if (!res || res.error || !res.data) return;
      var data = res.data;
      var byDriver = {};
      DRIVERS.forEach(function(d) { byDriver[d.id] = { today: 0, total: 0 }; });
      data.forEach(function(r) {
        if (!byDriver[r.driver_id]) byDriver[r.driver_id] = { today: 0, total: 0 };
        byDriver[r.driver_id].total++;
        if ((r.assigned_date||"").indexOf(todayStr) !== -1 || r.assigned_date === todayStr) byDriver[r.driver_id].today++;
      });
      setCounts({ byDriver, grandTotal: data.length, todayTotal: data.filter(function(r){ return (r.assigned_date||"") === todayStr; }).length });
    }, function(){ setLoading(false); });
  }

  function doSearch() {
    if (!searchQ.trim()) return;
    setSearching(true);
    setResults(null);
    var sb = getSupabase && getSupabase();
    if (!sb) { setSearching(false); return; }
    var q = searchQ.trim().toLowerCase();
    sb.from("orders").select("id, invoice_no, driver_id, customer, phone, assigned_date, status, total, store").then(function(res) {
      setSearching(false);
      if (!res || res.error || !res.data) return;
      var filtered = res.data.filter(function(r) {
        return (r.invoice_no||"").toLowerCase().includes(q) ||
               (r.customer||"").toLowerCase().includes(q) ||
               (r.phone||"").toLowerCase().includes(q) ||
               (r.driver_id||"").toLowerCase().includes(q) ||
               (r.store||"").toLowerCase().includes(q);
      });
      setResults(filtered.slice(0, 50));
    }, function(){ setSearching(false); });
  }

  function deleteOrder(id, label) {
    var sb = getSupabase && getSupabase();
    if (!sb) return;
    sb.from("orders").delete().eq("id", id).then(function(res) {
      if (res && res.error) { showMsg("Delete failed: " + res.error.message, true); return; }
      showMsg("Deleted: " + label);
      setResults(function(prev) { return prev ? prev.filter(function(r){ return r.id !== id; }) : prev; });
      fetchCounts();
    }, function(){ showMsg("Delete failed", true); });
  }

  function clearDriver(driverId, driverName) {
    var sb = getSupabase && getSupabase();
    if (!sb) return;
    sb.from("orders").delete().eq("driver_id", driverId).eq("assigned_date", todayStr).eq("status", "pending")
      .then(function(res) {
        if (res && res.error) { showMsg("Clear failed: " + res.error.message, true); return; }
        showMsg("Cleared today's pending orders for " + driverName);
            if (onOrdersRefresh) onOrdersRefresh();
    fetchCounts();
      }, function(){ showMsg("Clear failed", true); });
  }

  function wipeDriver(driverId, driverName) {
    var sb = getSupabase && getSupabase();
    if (!sb) return;
    sb.from("orders").delete().eq("driver_id", driverId).then(function(res) {
      if (res && res.error) { showMsg("Wipe failed: " + res.error.message, true); return; }
      showMsg("Wiped ALL orders for " + driverName);
      fetchCounts();
    }, function(){ showMsg("Wipe failed", true); });
  }

  function clearAllToday() {
    var sb = getSupabase && getSupabase();
    if (!sb) return;
    sb.from("orders").delete().eq("assigned_date", todayStr).eq("status", "pending")
      .then(function(res) {
        if (res && res.error) { showMsg("Clear failed: " + res.error.message, true); return; }
        showMsg("Cleared all today's pending orders");
            if (onOrdersRefresh) onOrdersRefresh();
    fetchCounts();
      }, function(){ showMsg("Clear failed", true); });
  }

  function wipeAll() {
    var sb = getSupabase && getSupabase();
    if (!sb) return;
    sb.from("orders").delete().neq("id", "__never__").then(function(res) {
      if (res && res.error) { showMsg("Wipe failed: " + res.error.message, true); return; }
      showMsg("Wiped ALL orders from database");
      setCounts(null);
      fetchCounts();
    }, function(){ showMsg("Wipe failed", true); });
  }

  var BTN = function(props) {
    return (
      <button onClick={props.onClick} style={{
        background: props.danger ? "rgba(239,68,68,.12)" : "rgba(255,255,255,.06)",
        border: "1px solid " + (props.danger ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.1)"),
        borderRadius: 8, padding: props.small ? "4px 10px" : "6px 12px",
        color: props.danger ? "#EF4444" : "rgba(255,255,255,.7)",
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif",
        fontSize: props.small ? 11 : 12, fontWeight: 600, cursor: "pointer", whiteSpace:"nowrap",
      }}>{props.children}</button>
    );
  };

  return (
    <div style={{ marginTop:20, borderRadius:14, border:"1px solid rgba(255,255,255,.08)", overflow:"hidden" }}>
      {/* Header */}
      <button onClick={function(){ setOpen(function(p){return !p;}); if (!open) fetchCounts(); }}
        style={{ width:"100%", background:"#161B24", border:"none", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>
          🗄️ Supabase DB Manager
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {counts && <div style={{ background:"rgba(255,90,31,.15)", color:"#FF5A1F", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{counts.grandTotal} orders</div>}
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:14 }}>{open ? "▲" : "▼"}</div>
        </div>
      </button>

      {open && (
        <div style={{ background:"#0F1218", padding:"14px 16px" }}>

          {/* Status message */}
          {msg && <div style={{ background: msg.startsWith("✅") ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)", border:"1px solid " + (msg.startsWith("✅") ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"), borderRadius:8, padding:"8px 12px", marginBottom:12, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color: msg.startsWith("✅") ? "#22C55E" : "#EF4444", fontSize:12 }}>{msg}</div>}

          {/* Confirm dialog */}
          {confirm && (
            <div style={{ background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, marginBottom:10 }}>{confirm.label}</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={function(){ confirm.action(); setConfirm(null); }}
                  style={{ background:"#EF4444", border:"none", borderRadius:8, padding:"7px 16px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  Yes, Delete
                </button>
                <button onClick={function(){ setConfirm(null); }}
                  style={{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:8, padding:"7px 16px", color:"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Count panel */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.6)", fontSize:12, fontWeight:600 }}>ORDER COUNTS</div>
              <button onClick={fetchCounts} style={{ background:"none", border:"none", color:"#38BDF8", fontSize:12, cursor:"pointer", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif" }}>
                {loading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>

            {counts ? (
              <div>
                {/* Per-driver rows */}
                {DRIVERS.map(function(d) {
                  var c = counts.byDriver[d.id] || { today:0, total:0 };
                  return (
                    <div key={d.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
                      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:600, width:90 }}>{d.name}</div>
                      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, flex:1 }}>
                        Today: <span style={{ color:"#38BDF8", fontWeight:700 }}>{c.today}</span>
                        {"  "}Total: <span style={{ color:"#FF5A1F", fontWeight:700 }}>{c.total}</span>
                      </div>
                      <BTN small onClick={function(){ setConfirm({ label:"Clear today's pending orders for " + d.name + "? (" + c.today + " orders)", action:function(){ clearDriver(d.id, d.name); } }); }}>Clear</BTN>
                      <BTN small danger onClick={function(){ setConfirm({ label:"⚠️ WIPE ALL " + c.total + " orders for " + d.name + "? This cannot be undone.", action:function(){ wipeDriver(d.id, d.name); } }); }}>Wipe</BTN>
                    </div>
                  );
                })}

                {/* Totals row */}
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 0" }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12, fontWeight:700, width:90 }}>ALL</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, flex:1 }}>
                    Today: <span style={{ color:"#38BDF8", fontWeight:700 }}>{counts.todayTotal}</span>
                    {"  "}Total: <span style={{ color:"#FF5A1F", fontWeight:700 }}>{counts.grandTotal}</span>
                  </div>
                  <BTN small onClick={function(){ setConfirm({ label:"Clear ALL today's pending orders for all drivers? (" + counts.todayTotal + " orders)", action:clearAllToday }); }}>Clear All</BTN>
                  <BTN small danger onClick={function(){ setConfirm({ label:"⚠️ WIPE ALL " + counts.grandTotal + " orders from database? Civil ID records are safe. This cannot be undone.", action:wipeAll }); }}>Wipe All</BTN>
                </div>
              </div>
            ) : (
              <button onClick={fetchCounts} style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px dashed rgba(255,255,255,.12)", borderRadius:10, padding:"12px", color:"rgba(255,255,255,.4)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, cursor:"pointer" }}>
                Tap to load order counts from Supabase
              </button>
            )}
          </div>

          {/* Search & Delete */}
          <div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.6)", fontSize:12, fontWeight:600, marginBottom:10 }}>SEARCH & DELETE SPECIFIC ORDER</div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input
                value={searchQ} onChange={function(e){ setSearchQ(e.target.value); }}
                onKeyDown={function(e){ if(e.key==="Enter") doSearch(); }}
                placeholder="Invoice no / customer / phone / driver..."
                style={{ flex:1, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"9px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }}
              />
              <button onClick={doSearch} style={{ background:"#FF5A1F", border:"none", borderRadius:10, padding:"9px 16px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {searching ? "..." : "Search"}
              </button>
            </div>

            {results !== null && (
              <div>
                {results.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"16px 0", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13 }}>No results found</div>
                ) : (
                  <div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:11, marginBottom:8 }}>{results.length} result{results.length!==1?"s":""} (max 50)</div>
                    {results.map(function(r) {
                      var drvName = (DRIVERS.find(function(d){ return d.id===r.driver_id; })||{}).name || r.driver_id;
                      var statusColor = { pending:"#F59E0B", delivered:"#22C55E", cancelled:"#EF4444", postponed:"#8B5CF6", collected:"#38BDF8" }[r.status] || "#fff";
                      return (
                        <div key={r.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", background:"rgba(255,255,255,.03)", borderRadius:8, marginBottom:6, border:"1px solid rgba(255,255,255,.06)" }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:12, fontWeight:700 }}>{r.invoice_no}</span>
                              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11 }}>{drvName}</span>
                              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>{r.assigned_date||"—"}</span>
                              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:statusColor, fontSize:11, fontWeight:600 }}>{r.status}</span>
                            </div>
                            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:11, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.customer||"—"}  {r.store||""}</div>
                          </div>
                          <button onClick={function(){ setConfirm({ label:"Delete " + r.invoice_no + " (" + drvName + ", " + r.status + ")?", action:function(){ deleteOrder(r.id, r.invoice_no); } }); }}
                            style={{ background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"6px 10px", color:"#EF4444", fontSize:13, cursor:"pointer", flexShrink:0 }}>
                            🗑
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUploadTab({ allOrders, onOrdersParsed, onAssignDriver, onStatusUpdate, onOrdersRefresh }) {
  const [parsed, setParsed] = useState(null);
  const [assignTo, setAssignTo] = useState("");
  const [toast, setToast] = useState(null);
  const [selectAll, setSelectAll] = useState(true);
  const [selected, setSelected] = useState(new Set());

  function showToast(msg) {
    setToast({ msg, ttype:"success" });
    setTimeout(function() { setToast(null); }, 3000);
  }

  function handleParsed(orders, driverName, company) {
    const matched = DRIVERS.find(function(d) { return d.name.toLowerCase() === (driverName || "").toLowerCase(); });
    setAssignTo(matched ? matched.id : "");
    setParsed({ orders, driverName, company });
    const idxSet = new Set();
    for (let i = 0; i < orders.length; i++) idxSet.add(i);
    setSelected(idxSet);
    setSelectAll(true);
  }

  function handleAssign() {
    if (!assignTo || !parsed) return;
    const toAssign = parsed.orders.filter(function(_, i) { return selected.has(i); });
    onOrdersParsed(toAssign, assignTo);
    const driverName = DRIVERS.find(function(d) { return d.id === assignTo; });
    showToast("Assigned " + toAssign.length + " orders to " + (driverName ? driverName.name : "Driver") + "!");
    setParsed(null);
    setSelected(new Set());
  }

  function toggleSelect(i) {
    setSelected(function(prev) {
      const n = new Set(prev);
      if (n.has(i)) { n.delete(i); } else { n.add(i); }
      return n;
    });
  }

  const pendingOrders = allOrders.filter(function(o) { return o.status === "pending" && !o.scanned; });
  const collectedOrders = allOrders.filter(function(o) { return o.scanned || o.status === "collected"; });

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 16px 80px" }}>
      {toast && <Toast msg={toast.msg} toastKind={toast.ttype} />}


      <ManualOrderForm driverList={DRIVERS.filter(function(d){ return d.status==="active"; })} onAdd={function(order){
        // Manual orders always insert fresh — bypass merge logic by using addOrders directly
        // with a flag that forces fresh insert even if invoice exists
        order._forceInsert = true;
        onOrdersParsed([order], order.driverId);
      }} />

      {!parsed ? (
        <>
          <PDFUploadPanel onOrdersParsed={handleParsed} />

          {allOrders.length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700, marginBottom:12 }}>Today&apos;s Assigned Orders</div>
              {DRIVERS.map(function(d) {
                var _todayStr = new Date().toDateString();
                const dOrders = allOrders.filter(function(o) {
                  if (o.driverId !== d.id) return false;
                  var _d = o.assignedDate || o.date || "";
                  var _p = _d.split("/");
                  if (_p.length === 3) {
                    var _dt = new Date(parseInt(_p[2]), parseInt(_p[1])-1, parseInt(_p[0]));
                    return _dt.toDateString() === _todayStr;
                  }
                  return false;
                });
                const done      = dOrders.filter(function(o) { return o.status === "delivered"; }).length;
                const collected = dOrders.filter(function(o) { return o.scanned; }).length;
                const cancelled = dOrders.filter(function(o) { return o.status === "cancelled"; }).length;
                const postponed = dOrders.filter(function(o) { return o.status === "postponed"; }).length;
                if (!dOrders.length) return null;
                return (
                  <div key={d.id} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:14, padding:14, marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:800, color:"#fff", fontSize:13 }}>{d.avatar}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>{d.name}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>{dOrders.length} orders</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:14, fontWeight:700 }}>{done + cancelled + postponed}/{dOrders.length}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>updated</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                      <div style={{ background:"rgba(0,212,255,.12)", borderRadius:10, padding:"6px 4px", textAlign:"center" }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:14, fontWeight:800 }}>{collected}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:9 }}>Collected</div>
                      </div>
                      <div style={{ background:"rgba(16,185,129,.12)", borderRadius:10, padding:"6px 4px", textAlign:"center" }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:14, fontWeight:800 }}>{done}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:9 }}>Delivered</div>
                      </div>
                      <div style={{ background:"rgba(239,68,68,.1)", borderRadius:10, padding:"6px 4px", textAlign:"center" }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:14, fontWeight:800 }}>{cancelled}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:9 }}>Cancelled</div>
                      </div>
                      <div style={{ background:"rgba(139,92,246,.12)", borderRadius:10, padding:"6px 4px", textAlign:"center" }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#8B5CF6", fontSize:14, fontWeight:800 }}>{postponed}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:9 }}>Postponed</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.3)", borderRadius:16, padding:16, marginBottom:16 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:15, fontWeight:700 }}>Orders Extracted: {parsed.orders.length}</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:13, marginTop:2 }}>
              {parsed.company} &nbsp; Suggested: <strong style={{ color:"#fff" }}>{parsed.driverName}</strong>
            </div>
            <div style={{ display:"flex", gap:12, marginTop:10 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#10B981", fontSize:12 }}>New: {parsed.fresh ? parsed.fresh.length : parsed.orders.length}</div>
              {parsed.dupes && parsed.dupes.length > 0 && (
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#F59E0B", fontSize:12, fontWeight:600 }}>Duplicates: {parsed.dupes.length}</div>
              )}
            </div>
          </div>

          {parsed.dupes && parsed.dupes.length > 0 && (
            <div style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.3)", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:13, fontWeight:700, marginBottom:6 }}>
                {parsed.dupes.length} Duplicate Order{parsed.dupes.length > 1 ? "s" : ""} Found
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12, marginBottom:10, lineHeight:1.5 }}>
                These invoices already exist. They are unchecked by default. You can include them if needed.
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {parsed.dupes.map(function(o) {
                  return (
                    <span key={o.invoiceNo} style={{ background:"rgba(245,158,11,.15)", border:"1px solid rgba(245,158,11,.3)", borderRadius:20, padding:"3px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#F59E0B", fontSize:11 }}>
                      #{o.invoiceNo} - {o.customer}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {["ReStore Online","Trikart Online","Webstore Online"].map(function(s) {
            const so = parsed.orders.filter(function(o) { return o.store === s; });
            if (!so.length) return null;
            return (
              <div key={s} style={{ background:"rgba(255,255,255,.03)", borderRadius:10, padding:"8px 12px", marginBottom:6, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.7)", fontSize:13 }}>{s}</span>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:13, fontWeight:700 }}>{so.length} orders</span>
              </div>
            );
          })}

          <div style={{ marginTop:16, marginBottom:12 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12, marginBottom:8 }}>ASSIGN TO DRIVER</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {DRIVERS.map(function(d) {
                return (
                  <button key={d.id} onClick={function() { setAssignTo(d.id); }} style={{ display:"flex", alignItems:"center", gap:8, background:assignTo===d.id?"rgba(0,212,255,.15)":"rgba(255,255,255,.05)", border:assignTo===d.id?"1.5px solid #00D4FF":"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"10px 14px", cursor:"pointer" }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:11, fontWeight:800, color:"#fff" }}>{d.avatar}</div>
                    <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:assignTo===d.id?"#00D4FF":"#fff", fontSize:13, fontWeight:600 }}>{d.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}>{selected.size} of {parsed.orders.length} selected</div>
            <button onClick={function() {
              if (selectAll) {
                setSelected(new Set());
              } else {
                const s = new Set();
                for (let i = 0; i < parsed.orders.length; i++) s.add(i);
                setSelected(s);
              }
              setSelectAll(function(v) { return !v; });
            }} style={{ background:"none", border:"none", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
              {selectAll ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div style={{ maxHeight:280, overflowY:"auto", marginBottom:14 }}>
            {parsed.orders.map(function(o, i) {
              var isDupe = parsed.dupes && parsed.dupes.find(function(d) { return d.invoiceNo === o.invoiceNo; });
              return (
                <div key={i} onClick={function() { toggleSelect(i); }}
                  style={{ display:"flex", alignItems:"center", gap:10, opacity: isDupe && !selected.has(i) ? 0.6 : 1, background:selected.has(i)?"rgba(0,212,255,.07)":"rgba(255,255,255,.03)", border:selected.has(i)?"1px solid rgba(0,212,255,.2)":"1px solid rgba(255,255,255,.06)", borderRadius:12, padding:"10px 12px", marginBottom:6, cursor:"pointer" }}>
                  <div style={{ width:20, height:20, borderRadius:6, background:selected.has(i)?"#00D4FF":"rgba(255,255,255,.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>
                    {selected.has(i) ? "v" : ""}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:500 }}>{o.customer}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>#{o.invoiceNo} · {o.store}</div>
                    {o.onlineOrderNo ? <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:10, fontWeight:700 }}>Online Order: {o.onlineOrderNo}</div> : null}
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:13, fontWeight:700 }}>{fmt(o.total)}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10 }}><PaymentBadge payType={o.paymentType} small /></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={function() { setParsed(null); setSelected(new Set()); }} style={{ flex:1, background:"rgba(255,255,255,.07)", border:"none", borderRadius:12, padding:14, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", cursor:"pointer" }}>Back</button>
            <button onClick={handleAssign} disabled={!assignTo || selected.size===0}
              style={{ flex:2, background:assignTo&&selected.size>0?"linear-gradient(135deg,#00D4FF,#7C3AED)":"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:14, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:assignTo?"pointer":"default" }}>
              Assign {selected.size} Orders
            </button>
          </div>
        </div>
      )}

      {/* Supabase DB Manager */}
      <SupabaseDBManager onOrdersRefresh={onOrdersRefresh} />
    </div>
  );
}

// ============================================================
// SECTION 7: ADMIN — ORDERS TAB
// Lines: AdminOrdersTab, AdminOrderCard, EditOrderModal
// Fix admin order display/edit issues here
// ============================================================
/*  Admin: All Orders View  */
function AdminOrdersTab({ orders, onStatusUpdate, onRemoveOrder, onEditOrder }) {
  const [driverFilter, setDriverFilter] = useState("all");
  const [storeFilter, setStoreFilter]   = useState("All Stores");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  function toggleSelect(id) {
    setSelected(function(prev) { var n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function removeSelected() {
    if (!window.confirm("Remove " + selected.size + " selected orders?")) return;
    selected.forEach(function(id) { onRemoveOrder && onRemoveOrder(id); });
    setSelected(new Set()); setSelectMode(false);
  }

  const filtered = orders.filter(o =>
    (driverFilter === "all" || o.driverId === driverFilter) &&
    (storeFilter === "All Stores" || o.store === storeFilter) &&
    (statusFilter === "all" || o.status === statusFilter) &&
    (o.customer?.toLowerCase().includes(search.toLowerCase()) || o.invoiceNo?.includes(search) || o.onlineOrderNo?.includes(search))
  );

  const totalKD = filtered.reduce((a, o) => a + Number(o.total), 0);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 16px 80px" }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search customer, invoice, order no..."
        style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"11px 16px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:14, marginBottom:12, boxSizing:"border-box", outline:"none" }} />

      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:10, paddingBottom:2 }}>
        <Pill label="All Drivers" active={driverFilter==="all"} onClick={() => setDriverFilter("all")} />
        {DRIVERS.map(d => <Pill key={d.id} label={d.name} active={driverFilter===d.id} onClick={() => setDriverFilter(d.id)} count={orders.filter(o=>o.driverId===d.id).length} />)}
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:10, paddingBottom:2 }}>
        {STORES.map(s => <Pill key={s} label={s} active={storeFilter===s} onClick={() => setStoreFilter(s)} />)}
      </div>
      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:14, paddingBottom:2 }}>
        {[["all","All"],["pending","Pending"],["collected","Collected"],["delivered","Delivered"],["postponed","Postponed"],["cancelled","Cancelled"]].map(function(item) { const v=item[0],l=item[1]; return (
          <Pill key={v} label={l} active={statusFilter===v} onClick={() => setStatusFilter(v)} count={v==="all"?undefined:orders.filter(o=>o.status===v).length} />
        )})}
      </div>

      <div style={{ background:"rgba(255,90,31,.08)", border:"1px solid rgba(255,90,31,.2)", borderRadius:12, padding:"10px 14px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:13 }}>Showing {filtered.length} orders</span>
        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:14, fontWeight:700 }}>{fmt(totalKD)}</span>
      </div>

      {/* Bulk remove toolbar */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10, gap:6 }}>
        {!selectMode ? (
          <button onClick={function(){ setSelectMode(true); setSelected(new Set()); }}
            style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"4px 14px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
            Select to Remove
          </button>
        ) : (
          <>
            <button onClick={function(){ setSelected(new Set(filtered.map(function(o){ return o.id||o.invoiceNo; }))); }}
              style={{ background:"rgba(255,255,255,.07)", border:"none", borderRadius:8, padding:"4px 10px", color:"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
              Select All
            </button>
            {selected.size > 0 && (
              <button onClick={removeSelected}
                style={{ background:"rgba(239,68,68,.2)", border:"1px solid rgba(239,68,68,.4)", borderRadius:8, padding:"4px 12px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Remove ({selected.size})
              </button>
            )}
            <button onClick={function(){ setSelectMode(false); setSelected(new Set()); }}
              style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, padding:"4px 10px", color:"rgba(255,255,255,.4)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
              Cancel
            </button>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:40 }}>No orders found</div>
      ) : filtered.map(function(o, i) {
        var oid = o.id||o.invoiceNo;
        var isChk = selected.has(oid);
        return (
          <div key={o.id||i} style={{ position:"relative" }}
            onClick={function(){ if(selectMode){ toggleSelect(oid); } }}>
            {selectMode && (
              <div style={{ position:"absolute", top:12, right:12, zIndex:10, width:20, height:20, borderRadius:5, border:"2px solid "+(isChk?"#EF4444":"rgba(255,255,255,.3)"), background:isChk?"#EF4444":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                {isChk && <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
              </div>
            )}
            <AdminOrderCard order={o} onStatusUpdate={onStatusUpdate} onEditOrder={onEditOrder} />
          </div>
        );
      })}
    </div>
  );
}

function AdminOrderCard({ order, onStatusUpdate, onEditOrder }) {
  const [exp, setExp] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const driver = DRIVERS.find(d => d.id === order.driverId);
  return (
    <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, marginBottom:8, overflow:"hidden" }}>
      <div onClick={() => setExp(e => !e)} style={{ padding:"12px 14px", cursor:"pointer" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>{order.customer}</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:1 }}>#{order.invoiceNo} {order.onlineOrderNo ? "  OO:" + (order.onlineOrderNo) : ""}   {order.store}</div>
          </div>
          <Badge status={order.status} />
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:13, fontWeight:700 }}>{fmt(order.total)}</span>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11 }}><PaymentBadge payType={order.paymentType} small /></span>
          {driver && <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}> {driver.name}</span>}
          {order.scanned && <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:11 }}> Collected</span>}
        </div>
      </div>
      {exp && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"12px 14px", background:"rgba(0,0,0,.15)" }}>
          <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:4, marginBottom:4  }}>{(function(){ var _a = detectArea(order.address); return _a ? <span style={{ background:"rgba(0,212,255,.12)", border:"1px solid rgba(0,212,255,.25)", borderRadius:20, padding:"1px 9px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:10, fontWeight:700, marginRight:6 }}>{_a}</span> : null; })()}<span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.55)", fontSize:12  }}>{order.address}</span></div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.55)", fontSize:12, marginBottom:4 }}> {order.phone}</div>
          {order.note && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#C4B5FD", fontSize:12 }}> {order.note}</div>}
          <button onClick={function(e){ e.stopPropagation(); setEditOpen(true); }}
            style={{ marginTop:10, width:"100%", background:"rgba(255,90,31,.08)", border:"1px solid rgba(255,90,31,.25)", borderRadius:10, padding:"9px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ✏️ Edit Order Details
          </button>
        </div>
      )}
      {editOpen && (
        <EditOrderModal
          order={order}
          onSave={function(id, fields){ if (onEditOrder) onEditOrder(id, fields); }}
          onClose={function(){ setEditOpen(false); }}
        />
      )}
    </div>
  );
}

// ============================================================
// SECTION 8: TRANSFER SYSTEM
// Lines: TransferModal
// Fix transfer request/approval issues here
// ============================================================
/*  Transfer Request Modal  */
function TransferModal({ order, fromDriverId, onRequestTransfer, onClose }) {
  const [toDriver, setToDriver] = useState("");
  const [reason, setReason]     = useState("");
  const [sent, setSent]         = useState(false);

  const ownerDriver = DRIVERS.find(d => d.id === order.driverId);
  const otherDrivers = DRIVERS.filter(d => d.id !== fromDriverId);

  function submit() {
    if (!toDriver) return;
    onRequestTransfer(order, fromDriverId, toDriver, reason);
    setSent(true);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:300, display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", background:"#161B24", borderRadius:"24px 24px 0 0", padding:24 }}>
        {sent ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}></div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:18, fontWeight:700 }}>Transfer Requested!</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:13, marginTop:8 }}>
              Admin has been notified. Awaiting approval.
            </div>
            <button onClick={onClose} style={{ marginTop:20, background:"rgba(255,255,255,.08)", border:"none", borderRadius:12, padding:"12px 32px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", cursor:"pointer" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:17, fontWeight:700 }}> Transfer Order</div>
              <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:20, padding:"5px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>x</button>
            </div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:16 }}>
              This order belongs to <span style={{ color:"#FF5A1F", fontWeight:600 }}>{ownerDriver?.name}</span>. Request admin to transfer it.
            </div>

            {/* Order preview */}
            <div style={{ background:"rgba(255,90,31,.07)", border:"1px solid rgba(255,90,31,.2)", borderRadius:14, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>{order.customer}</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginTop:2 }}>#{order.invoiceNo}   {order.store}   {fmt(order.total)}</div>
            </div>

            {/* Transfer type */}
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.45)", fontSize:12, marginBottom:8 }}>TRANSFER TO</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
              {/* Option: take myself */}
              <button onClick={() => setToDriver(fromDriverId)} style={{ display:"flex", alignItems:"center", gap:10, background:toDriver===fromDriverId?"rgba(0,212,255,.12)":"rgba(255,255,255,.05)", border:toDriver===fromDriverId?"1.5px solid #00D4FF":"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"11px 14px", cursor:"pointer" }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#00D4FF,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif" }}>ME</div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:toDriver===fromDriverId?"#00D4FF":"#fff", fontSize:13, fontWeight:600 }}>Take to me ({DRIVERS.find(d=>d.id===fromDriverId)?.name})</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}>Request to take this order from {ownerDriver?.name}</div>
                </div>
              </button>
              {/* Other drivers */}
              {otherDrivers.filter(d => d.id !== order.driverId).map(d => (
                <button key={d.id} onClick={() => setToDriver(d.id)} style={{ display:"flex", alignItems:"center", gap:10, background:toDriver===d.id?"rgba(139,92,246,.12)":"rgba(255,255,255,.05)", border:toDriver===d.id?"1.5px solid #8B5CF6":"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"11px 14px", cursor:"pointer" }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif" }}>{d.avatar}</div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:toDriver===d.id?"#8B5CF6":"#fff", fontSize:13, fontWeight:600 }}>Transfer to {d.name}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}>Send to {d.name}&apos;s order list</div>
                  </div>
                </button>
              ))}
            </div>

            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for transfer (optional)..."
              style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:12, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, resize:"none", height:60, boxSizing:"border-box", outline:"none", marginBottom:14 }} />

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:"rgba(255,255,255,.07)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", cursor:"pointer" }}>Cancel</button>
              <button onClick={submit} disabled={!toDriver} style={{ flex:2, background:toDriver?"linear-gradient(135deg,#FF6B35,#FF3D71)":"rgba(255,255,255,.1)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, cursor:toDriver?"pointer":"default" }}>
                Send Transfer Request ->
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SECTION 9: DRIVER — WAREHOUSE TAB
// Lines: DriverWarehouseTab, DriverOrderRow
// Fix warehouse/scan issues here — myOrders date filter at ~line 1647
// ============================================================
/*  Driver: Warehouse Collection Screen  */
function DriverWarehouseTab({ orders, driverId, onScan, onRequestTransfer, onOpenTransfer, onRemoveOrder, onRefresh }) {
  const [scanInput, setScanInput]       = useState("");
  const [scanResult, setScanResult]     = useState(null);
  const [wrongDriver, setWrongDriver]   = useState(null);
  const [scanError, setScanError]       = useState("");
  const [scanning, setScanning]         = useState(false);
  const [tab, setTab]                   = useState("scan");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [removeMode, setRemoveMode]     = useState(false);
  const [refreshing, setRefreshing]     = useState(false);

  // Auto-refresh every 10s when no orders assigned yet
  // Use orders.length (available before myOrders) — hooks must come before non-hook code
  const _myOrderCount = orders.filter(function(o) { return o.driverId === driverId; }).length;
  useEffect(function() {
    if (_myOrderCount > 0 || !onRefresh) return;
    var t = setInterval(function() { onRefresh(function(){}); }, 10000);
    return function() { clearInterval(t); };
  }, [_myOrderCount]);

  const _today = new Date().toDateString();
  const _allMine = orders.filter(o => o.driverId === driverId);

  function _normDate(d) {
    if (!d) return "";
    if (/^[A-Z][a-z]{2} [A-Z][a-z]{2}/.test(d)) return d;
    var p = d.split("/");
    if (p.length === 3) { var dt = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0])); if (!isNaN(dt.getTime())) return dt.toDateString(); }
    var iso = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) { var dt2 = new Date(parseInt(iso[1]), parseInt(iso[2])-1, parseInt(iso[3])); if (!isNaN(dt2.getTime())) return dt2.toDateString(); }
    var dt3 = new Date(d); if (!isNaN(dt3.getTime())) return dt3.toDateString();
    return "";
  }

  const myOrders = (function() {
    var todayFiltered = _allMine.filter(function(o) {
      var d = o.assignedDate || o.date || "";
      if (!d) return true;
      var norm = _normDate(d);
      return !norm || norm === _today;
    });
    // Fallback: if no today orders found, show ALL active orders for this driver
    if (todayFiltered.length === 0) {
      return _allMine.filter(function(o) { return o.status === "pending" || o.scanned; });
    }
    return todayFiltered;
  })();

  const allOrders = orders;
  const unscanned = myOrders.filter(o => !o.scanned && o.status === "pending");
  const scanned   = myOrders.filter(o => o.scanned);

  function doScan(val) {
    const q = val.trim();
    if (!q) return;
    setScanResult(null); setWrongDriver(null); setScanError("");

    // 1. Check MY orders first
    const mine = myOrders.find(o =>
      o.invoiceNo === q || o.onlineOrderNo === q ||
      o.invoiceNo?.includes(q) || o.onlineOrderNo?.includes(q)
    );
    if (mine) {
      if (mine.scanned) { setScanError("Already collected: #" + mine.invoiceNo); playSound("error"); return; }
      playSound("success");
      setScanResult(mine); return;
    }

    // 2. Check if it belongs to another driver
    const otherOrder = allOrders.find(o =>
      o.driverId !== driverId && (
        o.invoiceNo === q || o.onlineOrderNo === q ||
        o.invoiceNo?.includes(q) || o.onlineOrderNo?.includes(q)
      )
    );
    if (otherOrder) {
      playSound("error");
      setWrongDriver(otherOrder); return;
    }

    // 3. Not found at all
    playSound("error");
    setScanError("Order \"" + q + "\" not found in the system.");
  }

  function simulateScan() {
    setScanning(true);
    setTimeout(() => {
      if (unscanned.length > 0) {
        const o = unscanned[0];
        setScanInput(o.invoiceNo);
        doScan(o.invoiceNo);
      } else {
        // Simulate scanning another driver's order for demo
        const others = orders.filter(o => o.driverId !== driverId && !o.scanned);
        if (others.length > 0) {
          setScanInput(others[0].invoiceNo);
          doScan(others[0].invoiceNo);
        } else {
          setScanError("All orders collected!");
        }
      }
      setScanning(false);
    }, 1200);
  }

  function confirmScan() {
    if (!scanResult) return;
    playSound("collect");
    onScan(scanResult.id || scanResult.invoiceNo);
    setScanResult(null); setScanInput(""); setScanError("");
  }

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 16px 80px" }}>

      {/* Progress bar */}
      <div style={{ background:"rgba(255,255,255,.05)", borderRadius:16, padding:16, marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:13 }}>Collection Progress</span>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:14, fontWeight:700 }}>{scanned.length}/{myOrders.length}</span>
        </div>
        <div style={{ background:"rgba(255,255,255,.08)", borderRadius:30, height:8, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(myOrders.length>0?scanned.length/myOrders.length*100:0) + "%", background:"linear-gradient(90deg,#00D4FF,#7C3AED)", borderRadius:30, transition:"width .6s ease" }} />
        </div>
        <div style={{ display:"flex", gap:12, marginTop:10 }}>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:12 }}> {scanned.length} collected</span>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#F59E0B", fontSize:12 }}> {unscanned.length} remaining</span>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        <Pill label="📷 Scan Order"    active={tab==="scan"} onClick={() => setTab("scan")} />
        <Pill label={"📋 My Orders (" + (myOrders.length) + ")"} active={tab==="list"} onClick={() => setTab("list")} />
        <Pill label={" Pending Pickup (" + (unscanned.length) + ")"} active={tab==="pending"} onClick={() => setTab("pending")} count={undefined} />
      </div>

      {tab === "scan" && (
        <>
          {/* Camera Scan Button - opens real camera for barcode */}
          <div style={{ marginBottom:14 }}>
            <button onClick={function() {
                if (!window.BarcodeDetector) {
                  setScanError("Camera barcode not supported on iOS/Safari. Type the invoice number in the box below.");
                  return;
                }
                setScanning(true); document.getElementById("barcode-cam-input").click();
              }}
              style={{ width:"100%", background:"#000", borderRadius:16, height:160, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px dashed rgba(0,212,255,.4)", position:"relative", overflow:"hidden" }}>
              {scanning ? (
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:60, height:3, background:"#00D4FF", margin:"0 auto", animation:"scanLine 1s ease infinite", borderRadius:2 }} />
                  <div style={{ color:"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, marginTop:12 }}>Opening camera...</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:36, marginBottom:8 }}>[ ]</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:14, fontWeight:700 }}>Tap to Scan Barcode</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:4 }}>Opens phone camera</div>
                </>
              )}
              {["tl","tr","bl","br"].map(p => (
                <div key={p} style={{ position:"absolute", width:22, height:22, top:p.includes("t")?10:"auto", bottom:p.includes("b")?10:"auto", left:p.includes("l")?10:"auto", right:p.includes("r")?10:"auto", borderTop:p.includes("t")?"2.5px solid #00D4FF":"none", borderBottom:p.includes("b")?"2.5px solid #00D4FF":"none", borderLeft:p.includes("l")?"2.5px solid #00D4FF":"none", borderRight:p.includes("r")?"2.5px solid #00D4FF":"none" }} />
              ))}
            </button>
            {/* Hidden file input for camera capture */}
            <input id="barcode-cam-input" type="file" accept="image/*" capture="environment"
              style={{ display:"none" }}
              onChange={function(e) {
                setScanning(false);
                var file = e.target.files && e.target.files[0];
                if (!file) return;
                var img = new Image();
                img.onload = function() {
                  var canvas = document.createElement("canvas");
                  canvas.width = img.width; canvas.height = img.height;
                  canvas.getContext("2d").drawImage(img, 0, 0);
                  if (window.BarcodeDetector) {
                    var bd = new BarcodeDetector({ formats:["code_128","ean_13","ean_8","code_39","qr_code","upc_a","upc_e","itf"] });
                    bd.detect(canvas).then(function(barcodes) {
                      if (barcodes && barcodes.length > 0) {
                        var val = barcodes[0].rawValue;
                        setScanInput(val);
                        doScan(val);
                      } else {
                        setScanError("No barcode detected. Try the manual input below.");
                      }
                    }).catch(function() { setScanError("Barcode scan failed. Use manual input."); });
                  } else {
                    setScanError("Camera barcode scan not available on this browser. Please type the invoice number below, or use a Bluetooth barcode scanner.");
                  }
                };
                img.src = URL.createObjectURL(file);
                e.target.value = "";
              }} />
          </div>

          {/* Manual input - auto-focused for physical barcode scanners */}
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <input id="scan-manual-input" value={scanInput}
              onChange={function(e) { setScanInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") { doScan(scanInput); } }}
              placeholder="Invoice# — or use a barcode scanner"
              style={{ flex:1, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"11px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:14, outline:"none" }} />
            <button onClick={function() { doScan(scanInput); }} style={{ background:"#00D4FF", border:"none", borderRadius:12, padding:"0 16px", color:"#090B10", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, cursor:"pointer" }}>Go</button>
          </div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.25)", fontSize:11, marginBottom:14, textAlign:"center" }}>
            Physical barcode scanner? Just scan — it types directly into the box above
          </div>

          {/* Generic error */}
          {scanError && (
            <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:12, padding:"12px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}></span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#EF4444", fontSize:13 }}>{scanError}</span>
            </div>
          )}

          {/*  WRONG DRIVER ALERT  */}
          {wrongDriver && (
            <div style={{ background:"rgba(239,68,68,.08)", border:"1.5px solid rgba(239,68,68,.4)", borderRadius:16, padding:16, marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:"rgba(239,68,68,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}></div>
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:14, fontWeight:700 }}>Not in your order list!</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>
                    This order belongs to <span style={{ color:"#FF5A1F", fontWeight:600 }}>{DRIVERS.find(d=>d.id===wrongDriver.driverId)?.name || "another driver"}</span>
                  </div>
                </div>
              </div>
              <div style={{ background:"rgba(0,0,0,.2)", borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:500 }}>{wrongDriver.customer}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:2 }}>#{wrongDriver.invoiceNo}   {wrongDriver.store}   {fmt(wrongDriver.total)}</div>
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.45)", fontSize:12, marginBottom:8 }}>Do you want to request a transfer?</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => { setWrongDriver(null); setScanInput(""); }}
                  style={{ flex:1, background:"rgba(255,255,255,.07)", border:"none", borderRadius:10, padding:"10px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, cursor:"pointer" }}>
                  Dismiss
                </button>
                <button onClick={() => { onOpenTransfer(wrongDriver); setWrongDriver(null); setScanInput(""); setScanError(""); }}
                  style={{ flex:2, background:"linear-gradient(135deg,#FF6B35,#FF3D71)", border:"none", borderRadius:10, padding:"10px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                   Request Transfer
                </button>
              </div>
            </div>
          )}

          {/*  MY ORDER FOUND  */}
          {scanResult && (
            <div style={{ background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.35)", borderRadius:16, padding:16, marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:18 }}></span>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:14, fontWeight:700 }}>Your Order - Ready to Collect</div>
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700 }}>{scanResult.customer}</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:13, marginTop:2 }}>Invoice #{scanResult.invoiceNo}{scanResult.onlineOrderNo ? "   OO: " + (scanResult.onlineOrderNo) : ""}</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:13 }}> {scanResult.store}</div>
              <div style={{ display:"flex", gap:10, marginTop:8, alignItems:"center" }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:16, fontWeight:800 }}>{fmt(scanResult.total)}</span>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12 }}><PaymentBadge payType={scanResult.paymentType} /></span>
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12, marginTop:6 }}> {scanResult.address}</div>
              <button onClick={confirmScan} style={{ width:"100%", marginTop:12, background:"linear-gradient(135deg,#00D4FF,#7C3AED)", border:"none", borderRadius:12, padding:14, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                 Confirm Collection
              </button>
            </div>
          )}

          {/* Collected list */}
          {scanned.length > 0 && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, marginTop:8 }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:13, fontWeight:700 }}>Collected ({scanned.length})</div>
                {!removeMode ? (
                  <button onClick={function(){ setRemoveMode(true); }}
                    style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"3px 12px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                    Select
                  </button>
                ) : (
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={function(){ setBulkSelected(new Set(scanned.map(function(o){ return o.id||o.invoiceNo; }))); }}
                      style={{ background:"rgba(255,255,255,.07)", border:"none", borderRadius:8, padding:"3px 10px", color:"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                      All
                    </button>
                    {bulkSelected.size > 0 && (
                      <button onClick={function(){
                        if(!window.confirm("Remove "+bulkSelected.size+" orders?")) return;
                        scanned.filter(function(o){ return bulkSelected.has(o.id||o.invoiceNo); }).forEach(function(o){ onRemoveOrder && onRemoveOrder(o.id||o.invoiceNo); });
                        setBulkSelected(new Set()); setRemoveMode(false);
                      }} style={{ background:"rgba(239,68,68,.2)", border:"1px solid rgba(239,68,68,.4)", borderRadius:8, padding:"3px 10px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                        Remove ({bulkSelected.size})
                      </button>
                    )}
                    <button onClick={function(){ setRemoveMode(false); setBulkSelected(new Set()); }}
                      style={{ background:"none", border:"none", borderRadius:8, padding:"3px 8px", color:"rgba(255,255,255,.35)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {scanned.map(function(o, i) {
                var oid = o.id||o.invoiceNo;
                var isChecked = removeMode && bulkSelected.has(oid);
                return (
                  <div key={i}
                    onClick={function(){ if(removeMode) { setBulkSelected(function(prev){ var n=new Set(prev); n.has(oid)?n.delete(oid):n.add(oid); return n; }); } }}
                    style={{ background:isChecked?"rgba(239,68,68,.1)":"rgba(16,185,129,.06)", border:"1px solid "+(isChecked?"rgba(239,68,68,.3)":"rgba(16,185,129,.2)"), borderRadius:12, padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:removeMode?"pointer":"default" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {removeMode && (
                        <div style={{ width:18, height:18, borderRadius:4, border:"1.5px solid "+(isChecked?"#EF4444":"rgba(255,255,255,.25)"), background:isChecked?"#EF4444":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {isChecked && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                        </div>
                      )}
                      <div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:500 }}>{o.customer}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}>#{o.invoiceNo} · {o.store}</div>
                        {o.onlineOrderNo ? <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:10, fontWeight:700 }}>Online Order: {o.onlineOrderNo}</div> : null}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:12, fontWeight:700 }}>{fmt(o.total)}</div>
                      {!removeMode && (
                        <button onClick={function(e){ e.stopPropagation(); if(window.confirm("Remove this order?")) onRemoveOrder && onRemoveOrder(oid); }}
                          style={{ background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.25)", borderRadius:6, padding:"2px 8px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, cursor:"pointer" }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {tab === "list" && (
        <>
          {myOrders.length === 0 ? (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:14, marginBottom:16 }}>
                No orders assigned yet.<br/>Please wait for admin to upload.
              </div>
              <div style={{ color:"rgba(255,255,255,.2)", fontSize:11, marginBottom:16, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif" }}>
                v2026-05-02 · Driver: {driverId} · All: {orders.length} · Mine: {_allMine.length} · Today: {(function(){ var t=_allMine.filter(function(o){var d=o.assignedDate||o.date||"";if(!d)return true;var p=d.split("/");if(p.length===3){var dt=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));return dt.toDateString()===new Date().toDateString();}return false;}).length; return t; })()}
              </div>
              <button onClick={function(){
                if (refreshing || !onRefresh) return;
                setRefreshing(true);
                onRefresh(function(){ setRefreshing(false); });
              }} style={{ background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)", borderRadius:12, padding:"10px 20px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                {refreshing ? "⟳ Syncing..." : "⟳ Sync Now"}
              </button>
              <div style={{ color:"rgba(255,255,255,.2)", fontSize:11, marginTop:10, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif" }}>
                Auto-checking every 10 seconds...
              </div>
            </div>
          ) : (
            <>
              {/*  Select All / Bulk Collect bar  */}
              {unscanned.length > 0 && (
                <div style={{ background:"rgba(0,212,255,.07)", border:"1px solid rgba(0,212,255,.2)", borderRadius:14, padding:"12px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                  <button
                    onClick={() => {
                      if (unscanned.every(o => bulkSelected.has(o.id||o.invoiceNo))) {
                        setBulkSelected(new Set());
                      } else {
                        setBulkSelected(new Set(unscanned.map(o => o.id||o.invoiceNo)));
                      }
                    }}
                    style={{ width:22, height:22, borderRadius:6, background: unscanned.every(o=>bulkSelected.has(o.id||o.invoiceNo))?"#00D4FF":"rgba(255,255,255,.1)", border:"1.5px solid rgba(0,212,255,.5)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, fontSize:13, color:"#090B10" }}>
                    {unscanned.every(o=>bulkSelected.has(o.id||o.invoiceNo)) ? "v" : ""}
                  </button>
                  <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.6)", fontSize:13, flex:1 }}>
                    {bulkSelected.size > 0 ? (bulkSelected.size) + " selected" : "Select all to bulk collect"}
                  </span>
                  {bulkSelected.size > 0 && (
                    <button onClick={() => {
                      playSound("bulk"); bulkSelected.forEach(id => onScan(id));
                      setBulkSelected(new Set());
                    }}
                      style={{ background:"linear-gradient(135deg,#00D4FF,#7C3AED)", border:"none", borderRadius:10, padding:"7px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
                       Collect {bulkSelected.size}
                    </button>
                  )}
                </div>
              )}
              {scanned.length > 0 && unscanned.length === 0 && (
                <div style={{ background:"rgba(16,185,129,.08)", border:"1px solid rgba(16,185,129,.25)", borderRadius:12, padding:"10px 14px", marginBottom:12, textAlign:"center" }}>
                  <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#10B981", fontSize:13 }}> All orders collected! Head out for delivery.</span>
                </div>
              )}
              {myOrders.map((o) => (
                <DriverOrderRow
                  key={o.id||o.invoiceNo}
                  order={o}
                  onTransfer={() => onOpenTransfer(o)}
                  selected={bulkSelected.has(o.id||o.invoiceNo)}
                  onToggleSelect={function() {
                    if (o.scanned) return;
                    setBulkSelected(function(prev) {
                      const n = new Set(prev);
                      if (n.has(o.id||o.invoiceNo)) { n.delete(o.id||o.invoiceNo); } else { n.add(o.id||o.invoiceNo); }
                      return n;
                    });
                  }}
                />
              ))}
            </>
          )}
        </>
      )}
      {tab === "pending" && (
        <div>
          {unscanned.length === 0 ? (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:40, marginBottom:10 }}></div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:16, fontWeight:700 }}>All Collected!</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:13, marginTop:6 }}>You have collected all assigned orders.</div>
            </div>
          ) : (
            <>
              <div style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", borderRadius:14, padding:"12px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:18 }}></span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:13, fontWeight:700 }}>{unscanned.length} orders not yet collected</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>These orders are waiting at the warehouse</div>
                </div>
              </div>
              {/* Bulk collect all pending */}
              <button onClick={() => { playSound("bulk"); unscanned.forEach(o => onScan(o.id||o.invoiceNo)); }}
                style={{ width:"100%", background:"linear-gradient(135deg,#F59E0B,#FF6B35)", border:"none", borderRadius:12, padding:"13px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:14 }}>
                 Collect All {unscanned.length} Pending Orders
              </button>
              {unscanned.map((o) => (
                <div key={o.id||o.invoiceNo} style={{ background:"rgba(245,158,11,.06)", border:"1px solid rgba(245,158,11,.2)", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:600 }}>{o.customer}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}>#{o.invoiceNo}{o.onlineOrderNo?" · Online Order: "+o.onlineOrderNo:""} · {o.store}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}> {o.address?.slice(0,40)}{o.address?.length>40?"...":""}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:13, fontWeight:700 }}>{fmt(o.total)}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, marginTop:2 }}><PaymentBadge payType={o.paymentType} small /></div>
                    <button onClick={() => { playSound('collect'); onScan(o.id||o.invoiceNo); }}
                      style={{ marginTop:6, background:"rgba(0,212,255,.15)", border:"1px solid rgba(0,212,255,.3)", borderRadius:8, padding:"4px 10px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                      Collect
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      <style>{"@keyframes scanLine{0%,100%{transform:translateY(-20px)}50%{transform:translateY(20px)}}"}</style>
    </div>
  );
}

function DriverOrderRow({ order, onTransfer, selected, onToggleSelect }) {
  const [exp, setExp] = useState(false);
  const rawPhone = (order.phone || "").replace(/\D/g, "");
  const waPhone  = rawPhone.startsWith("00") ? rawPhone.slice(2) : rawPhone.startsWith("0") ? "965" + rawPhone.slice(1) : rawPhone.startsWith("965") ? rawPhone : rawPhone.length >= 8 ? "965" + rawPhone : rawPhone;
  const callPhone = (order.phone || "").trim();
  const callHref = "tel:+" + rawPhone.replace(/\D/g,"").slice(0,15);
  const isCOD    = order.paymentType === "Cash" || order.paymentType === "COD";
  const codPart  = isCOD ? " Please have *" + fmt(order.total) + "* ready for cash payment." : "";
  const waMsg    = encodeURIComponent("Dear Customer,\n\nYour order from *" + order.store + "* is out for delivery soon." + codPart + "\n\nThank you!");
  const waHref   = "https://wa.me/" + waPhone + "?text=" + waMsg;

  return (
    <div style={{ background:order.scanned?"rgba(16,185,129,.06)":selected?"rgba(0,212,255,.07)":"rgba(255,255,255,.04)", border:"1px solid " + (order.scanned?"rgba(16,185,129,.2)":selected?"rgba(0,212,255,.3)":"rgba(255,255,255,.07)"), borderRadius:12, marginBottom:7, overflow:"hidden" }}>
      <div style={{ padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
        {!order.scanned ? (
          <button onClick={function(e) { e.stopPropagation(); if (onToggleSelect) onToggleSelect(); }}
            style={{ width:22, height:22, borderRadius:6, background:selected?"#00D4FF":"rgba(255,255,255,.08)", border:"1.5px solid " + (selected?"#00D4FF":"rgba(255,255,255,.2)"), display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, fontSize:12, color:"#090B10" }}>
            {selected ? "v" : ""}
          </button>
        ) : (
          <span style={{ width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", color:"#10B981", fontSize:16, flexShrink:0 }}>v</span>
        )}
        <div onClick={function() { setExp(function(e) { return !e; }); }} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:600 }}>{order.customer}</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}>
                {"#" + order.invoiceNo + "   " + order.store}
              </div>
              {order.onlineOrderNo ? (
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:11, fontWeight:600 }}>
                  {"Online Order: " + order.onlineOrderNo}
                </div>
              ) : null}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:13, fontWeight:700 }}>{fmt(order.total)}</span>
              {(order.extraAmount > 0) && <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EA580C", fontSize:11, fontWeight:700 }}>{"+"+fmt(order.extraAmount)}</span>}
              <span style={{ color:"rgba(255,255,255,.3)", fontSize:11 }}>{exp ? "^" : "v"}</span>
            </div>
          </div>
        </div>
      </div>
      {exp && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"12px 14px", background:"rgba(0,0,0,.18)" }}>
          {order.onlineOrderNo ? (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}>Online Order No:</span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:12, fontWeight:700 }}>{order.onlineOrderNo}</span>
            </div>
          ) : null}
          <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6  }}>{(function(){ var _a = detectArea(order.address); return _a ? <span style={{ background:"rgba(0,212,255,.12)", border:"1px solid rgba(0,212,255,.25)", borderRadius:20, padding:"1px 9px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:10, fontWeight:700, marginRight:6 }}>{_a}</span> : null; })()}<span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12  }}>{order.address}</span></div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12, marginBottom:8 }}>{"📞 " + order.phone}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            <button onClick={function(e){e.preventDefault();window.location.href=callHref;}} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.3)", borderRadius:10, padding:"10px 8px", textDecoration:"none" }}>
              <span style={{ fontSize:16 }}></span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:12, fontWeight:700 }}>Call</span>
            </button>
            <button onClick={function(e){ e.preventDefault(); var callUrl = "whatsapp://call?phone=" + waPhone; window.location.href = callUrl; }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"rgba(37,211,102,.12)", border:"1px solid rgba(37,211,102,.35)", borderRadius:10, padding:"10px 8px" }}>
              <span style={{ fontSize:16 }}></span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#25D366", fontSize:12, fontWeight:700 }}>WA Call</span>
            </button>
          </div>
          <div style={{ background:"rgba(37,211,102,.07)", border:"1px solid rgba(37,211,102,.2)", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Out-for-Delivery Notification</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.75)", fontSize:11, lineHeight:1.6, marginBottom:8 }}>
              Dear Customer, your order from <span style={{ color:"#25D366", fontWeight:600 }}>{order.store}</span> is out for delivery.
              {isCOD && <span style={{ color:"#F59E0B", fontWeight:600 }}> Please have <span style={{ color:"#fff" }}>{fmt(order.total)}</span> ready for cash payment.</span>}
            </div>
            <button onClick={function(){window.open(waHref,"_blank");}} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, width:"100%", background:"linear-gradient(135deg,#25D366,#128C7E)", borderRadius:10, padding:"11px", textDecoration:"none" }}>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:700 }}>Notify - Out for Delivery</span>
            </button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11 }}><PaymentBadge payType={order.paymentType} small /></span>
            {order.onlineOrderNo && <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>{"Online Order: " + order.onlineOrderNo}</span>}
          </div>
          {!order.scanned && onTransfer && (
            <button onClick={function(e) { e.stopPropagation(); onTransfer(order); }}
              style={{ width:"100%", marginTop:10, background:"rgba(255,90,31,.1)", border:"1px solid rgba(255,90,31,.3)", borderRadius:10, padding:"9px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              Request Transfer to Another Driver
            </button>
          )}
        </div>
      )}
    </div>
  );
}


// ============================================================
// SECTION 10: DRIVER — MANUAL ORDER ENTRY
// Lines: DriverManualOrderForm
// Fix driver manual order issues here
// ============================================================
function DriverManualOrderForm({ driverId, onAdd }) {
  const [show, setShow]   = useState(false);
  const [store, setStore] = useState("Webstore Online");
  const [invoiceNo, setInv] = useState("");
  const [ooNo, setOoNo]   = useState("");
  const [customer, setCust] = useState("");
  const [address, setAddr]  = useState("");
  const [phone, setPhone]   = useState("");
  const [total, setTotal]   = useState("");
  const [pay, setPay]       = useState("Cash");
  const [err, setErr]       = useState("");
  const [scanMsg, setScanMsg] = useState("");

  const [area, setArea]         = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaDrop, setShowAreaDrop] = useState(false);
  const [customStoreName, setCustomStoreName] = useState("");
  const PAYS = ["Cash","KNET","Deema","Tabby","Taly","VISA/Mastercard","Tap/KNET","Exchange"];
  const ALL_AREAS = ['Abdali', 'Abdulla Al-Salem', 'Abdullah Al-Mubarak', 'Abdullah Port', 'Abu Al Hasaniya', 'Abu Futaira', 'Abu Halifa', 'Adailiya', 'Adan', 'Ahmadi', 'Airport District', 'Ali As-Salim', 'Amghara', 'Andalus', 'Ardiya', 'Ardiya Herafiya', 'Ardiya Industrial Area', 'Ashbelya', 'Bayan', 'Bida', 'Bnaid Al-Qar', 'Bneidar', 'Daher', 'Daiya', 'Dasma', 'Dhajeej', 'Doha', 'Doha Port', 'Egaila', 'Fahad Al-Ahmad', 'Fahaheel', 'Faiha', 'Farwaniya', 'Fintas', 'Firdous', 'Funaitis', 'Granada (Kuwait)', 'Hadiya', 'Hawally', 'Hittin', 'Jaber Al-Ahmad', 'Jaber Al-Ali', 'Jabriya', 'Jahra', 'Jahra Industrial Area', 'Jawaher Al Wafra', 'Jibla', 'Jileia', 'Jleeb Al-Shuyoukh', 'Kabad', 'Kaifan', 'Khairan', 'Khaitan', 'Khaldiya', 'Kuwait City', 'Mahbula', 'Maidan Hawalli', 'Mangaf', 'Mansriya', 'Miqwa', 'Mirgab', 'Mishref', 'Misila', 'Mubarak Al-Kabeer', 'Naeem', 'Nahda / East Sulaibikhat', 'Nahdha', 'Nasseem', 'New Khairan City', 'New Wafra', 'North West Sulaibikhat', 'Nuwaiseeb', 'Nuzha', 'Omariya', 'Oyoun', 'Qadsiya', 'Qairawan', 'Qasr', 'Qurain', 'Qurtuba', 'Qusour', 'Rabiya', 'Rai', 'Rawda', 'Rehab', 'Riggae', 'Rihab', 'Riqqa', 'Rumaithiya', 'Saad Al Abdullah', 'Sabah Al Salem', 'Sabah Al-Ahmad', 'Sabah Al-Nasser', 'Sabahiya', 'Sabhan', 'Salam', 'Salmi', 'Salmiya', 'Salwa', 'Shaab', 'Shamiya', 'Sharq', 'Shuaiba (North & South)', 'Shuhada', 'Shuwaikh', 'Shuwaikh Industrial Area', 'Shuwaikh Port', 'Siddiq', 'Sikrab', 'South Doha / Qairawan', 'South Sabahiya', 'South Surra', 'Sulaibikhat', 'Sulaibiya', 'Sulaibiya Agricultural Area', 'Surra', 'Taima', 'Wafra', 'Waha', 'Yarmouk', 'Zahra', 'Zoor'];

  function fillFromScan(fields) {
    if (!show) setShow(true);
    setScanMsg("");
    if (fields.store) {
      var knownStores = ["Trikart Online","Webstore Online","ReStore Online","GadgetPro Online"];
      if (knownStores.includes(fields.store)) { setStore(fields.store); }
      else { setStore("Other"); setCustomStoreName(fields.store); }
    }
    if (fields.invoiceNo)     setInv(fields.invoiceNo);
    if (fields.onlineOrderNo) setOoNo(fields.onlineOrderNo);
    if (fields.customer)      setCust(fields.customer);
    if (fields.address)       setAddr(fields.address);
    if (fields.phone)         setPhone(fields.phone);
    if (fields.total)         setTotal(String(fields.total));
    if (fields.paymentType) {
      var knownPays = ["Cash","KNET","Deema","Tabby","Taly","VISA/Mastercard","Tap/KNET","Exchange"];
      if (knownPays.includes(fields.paymentType)) setPay(fields.paymentType);
    }
    setScanMsg("✅ Label scanned — please review and confirm details below.");
  }

  function submit() {
    if (!invoiceNo.trim()) { setErr("Invoice number required"); return; }
    if (!ooNo.trim()) { setErr("Online Order No is required"); return; }
    if (!total || isNaN(total) || Number(total) <= 0) { setErr("Valid amount required"); return; }
    setErr("");
    var finalStore = store === "Other" ? (customStoreName.trim() || "Other Store") : store;
    var fullAddress = address.trim() + (area ? ", " + area : "");
    if (onAdd) onAdd([{
      id: uid(),
      invoiceNo: invoiceNo.trim(),
      onlineOrderNo: ooNo.trim(),
      customer: customer.trim() || "Unknown",
      address: fullAddress,
      phone: phone.trim(),
      total: Number(total),
      paymentType: pay,
      originalPaymentType: "",
      store: finalStore, status: "pending",
      driverId,
      scanned: true,
      date: (function(){ var d=new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })(),
      assignedDate: (function(){ var d=new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })(),
      note: "Manual entry by driver",
    }]);
    setInv(""); setOoNo(""); setCust(""); setAddr(""); setPhone(""); setTotal(""); setPay("Cash"); setArea(""); setAreaSearch(""); setCustomStoreName(""); setScanMsg("");
    setShow(false);
  }

  if (!show) return (
    <div style={{ display:"flex", gap:8, marginBottom:10 }}>
      <button onClick={function(){ setShow(true); }}
        style={{ flex:1, background:"rgba(255,90,31,.07)", border:"1px dashed rgba(255,90,31,.35)", borderRadius:12, padding:"11px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>
        + Add Manual Order
      </button>
      <LabelScanner
        onExtracted={function(fields){ fillFromScan(fields); }}
        onError={function(msg){ setScanMsg("⚠️ " + msg); setShow(true); }}
      />
    </div>
  );

  return (
    <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,90,31,.3)", borderRadius:14, padding:14, marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:14, fontWeight:800 }}>Add Manual Order</div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <LabelScanner
            onExtracted={fillFromScan}
            onError={function(msg){ setScanMsg("⚠️ " + msg); }}
          />
          <button onClick={function(){ setShow(false); setErr(""); setScanMsg(""); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,.4)", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
      </div>
      {scanMsg && (
        <div style={{ background: scanMsg.startsWith("✅") ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)", border:"1px solid " + (scanMsg.startsWith("✅") ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"), borderRadius:10, padding:"8px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, color: scanMsg.startsWith("✅") ? "#10B981" : "#EF4444", marginBottom:10 }}>
          {scanMsg}
        </div>
      )}

      {/* Store */}
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:6 }}>STORE</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
        {["Trikart Online","Webstore Online","ReStore Online","GadgetPro Online","Other"].map(function(s){
          return <button key={s} onClick={function(){ setStore(s); if(s!=="Other") setCustomStoreName(""); }}
            style={{ background:store===s?"rgba(0,212,255,.15)":"rgba(255,255,255,.06)", border:store===s?"1.5px solid #00D4FF":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"5px 10px", color:store===s?"#00D4FF":"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>{s}</button>;
        })}
      </div>
      {store === "Other" && (
        <div style={{ marginBottom:12 }}>
          <input type="text" value={customStoreName} onChange={function(e){ setCustomStoreName(e.target.value); }}
            placeholder="Enter store name..."
            style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(0,212,255,.3)", borderRadius:10, padding:"9px 12px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
        </div>
      )}

      {/* Fields */}
      {[
        ["Invoice No *", invoiceNo, setInv, "text", "e.g. 1163999"],
        ["OO No. *", ooNo, setOoNo, "text", "Online Order No"],
        ["Customer", customer, setCust, "text", "Customer name"],
        ["Address", address, setAddr, "text", "Delivery address"],
      ].map(function(f){
        return (
          <div key={f[0]} style={{ marginBottom:8 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, marginBottom:3 }}>{f[0].toUpperCase()}</div>
            <input type={f[3]} value={f[1]} onChange={function(e){ f[2](e.target.value); }} placeholder={f[4]}
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"9px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
          </div>
        );
      })}

      {/* Area selector — right after address */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, marginBottom:3 }}>AREA (KUWAIT)</div>
        <input type="text" value={areaSearch}
          onChange={function(e){ setAreaSearch(e.target.value); setArea(""); }}
          placeholder="Type to search area..."
          style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:area||!areaSearch?"10px":"10px 10px 0 0", padding:"9px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
        {area ? (
          <div style={{ background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)", borderRadius:10, padding:"7px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:12, fontWeight:600 }}>{area}</span>
            <button onClick={function(){ setArea(""); setAreaSearch(""); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,.4)", cursor:"pointer", fontSize:14 }}>✕</button>
          </div>
        ) : areaSearch ? (
          <div style={{ background:"#1A2035", border:"1px solid rgba(255,255,255,.15)", borderTop:"none", borderRadius:"0 0 10px 10px", maxHeight:150, overflowY:"auto" }}>
            {ALL_AREAS.filter(function(a){ return a.toLowerCase().includes(areaSearch.toLowerCase()); }).slice(0,15).map(function(a){
              return <div key={a} onClick={function(){ setArea(a); setAreaSearch(a); }}
                style={{ padding:"7px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.8)", fontSize:12, cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,.05)" }}>{a}</div>;
            })}
          </div>
        ) : null}
      </div>

      {/* Phone + Amount after area */}
      {[
        ["Phone", phone, setPhone, "tel", "+965 XXXX XXXX"],
        ["Amount KD *", total, setTotal, "number", "0.000"],
      ].map(function(f){
        return (
          <div key={f[0]} style={{ marginBottom:8 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, marginBottom:3 }}>{f[0].toUpperCase()}</div>
            <input type={f[3]} value={f[1]} onChange={function(e){ f[2](e.target.value); }} placeholder={f[4]}
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"9px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
          </div>
        );
      })}

      {/* Payment */}
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, marginBottom:6, marginTop:4 }}>PAYMENT</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {PAYS.map(function(p){
          return <button key={p} onClick={function(){ setPay(p); }}
            style={{ background:pay===p?"rgba(16,185,129,.15)":"rgba(255,255,255,.06)", border:pay===p?"1.5px solid #10B981":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"4px 10px", color:pay===p?"#10B981":"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>{p}</button>;
        })}
      </div>

      {err && <div style={{ color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, marginBottom:8 }}>{err}</div>}
      <button onClick={submit}
        style={{ width:"100%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", border:"none", borderRadius:12, padding:"12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>
        Add to My Orders
      </button>
    </div>
  );
}

// ============================================================
// SECTION 11: DRIVER — DELIVERY TAB
// Lines: DriverDeliveryTab, DeliveryOrderCard, OTP system
// Fix delivery/OTP/status issues here — myOrders filter at ~line 2392
// ============================================================
function DriverDeliveryTab({ orders, driverId, driverName, onStatusUpdate, onOpenTransfer, onRequestHelp, orderTags, onSetTag, onAddOrder, onEditOrder, selectedDate }) {
  const [statusModal, setStatusModal] = useState(null);
  const [filter,      setFilter]      = useState("collected");
  const [storeFilter, setStoreFilter] = useState("all");
  const [payFilter,   setPayFilter]   = useState("all");
  const [toast,       setToast]       = useState(null);
  const _seqKey = "df_route_seq_" + driverId;
  const [orderSeq,    setOrderSeq]    = useState(function(){ try { return JSON.parse(localStorage.getItem("df_route_seq_" + driverId)) || {}; } catch(e){ return {}; } });
  const [rearranging, setRearranging] = useState(false);
  const [touchOrder,  setTouchOrder]  = useState([]);  // invoiceNos in tap order
  const [searchQ,     setSearchQ]     = useState("");

  // Persist orderSeq to localStorage whenever it changes
  useEffect(function() {
    try { localStorage.setItem("df_route_seq_" + driverId, JSON.stringify(orderSeq)); } catch(e){}
  }, [orderSeq]);

  function showToast(msg) { setToast({ msg, ttype:"success" }); setTimeout(function() { setToast(null); }, 3000); }

  const _allMine = orders.filter(function(o) { return o.driverId === driverId; });

  function _nd(d) {
    if (!d) return "";
    if (/^[A-Z][a-z]{2} [A-Z][a-z]{2}/.test(d)) return d;
    var p = d.split("/");
    if (p.length===3){var dt=new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));if(!isNaN(dt.getTime()))return dt.toDateString();}
    var iso=d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(iso){var dt2=new Date(parseInt(iso[1]),parseInt(iso[2])-1,parseInt(iso[3]));if(!isNaN(dt2.getTime()))return dt2.toDateString();}
    var dt3=new Date(d);if(!isNaN(dt3.getTime()))return dt3.toDateString();
    return "";
  }

  const _todayDS = new Date().toDateString();
  const myOrders = (function() {
    var target = selectedDate || _todayDS;
    var todayFiltered = _allMine.filter(function(o) {
      var d = o.assignedDate || o.date || "";
      if (!d) return true;
      var norm = _nd(d);
      return !norm || norm === target;
    });
    if (todayFiltered.length === 0) {
      return _allMine.filter(function(o) { return o.status === "pending" || o.scanned; });
    }
    return todayFiltered;
  })();
  const myStores   = ["all"].concat(Array.from(new Set(myOrders.map(function(o) { return o.store; }).filter(Boolean))));
  const myPayments = ["all"].concat(Array.from(new Set(myOrders.map(function(o) { return o.paymentType; }).filter(function(p) { return p && p !== "Exchange"; }))));

  const filtered = myOrders.filter(function(o) {
    const statusOk = filter === "all" || o.status === filter || (filter === "collected" && o.scanned && o.status === "pending");
    const storeOk  = storeFilter === "all" || o.store === storeFilter;
    const payOk    = payFilter   === "all" || o.paymentType === payFilter;
    const sq = searchQ.trim().toLowerCase();
    const searchOk = !sq || o.customer?.toLowerCase().includes(sq) || o.invoiceNo?.includes(sq) ||
      o.onlineOrderNo?.includes(sq) || o.address?.toLowerCase().includes(sq) || o.phone?.includes(sq);
    return statusOk && storeOk && payOk && searchOk;
  });

  const counts = {
    collected: myOrders.filter(function(o) { return o.scanned && o.status === "pending"; }).length,
    delivered: myOrders.filter(function(o) { return o.status === "delivered"; }).length,
    postponed: myOrders.filter(function(o) { return o.status === "postponed"; }).length,
    cancelled: myOrders.filter(function(o) { return o.status === "cancelled"; }).length,
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, position:"relative" }}>
      {statusModal && (
        <StatusUpdateModal order={statusModal} driverName={driverName} onUpdate={function(id, status, note, newPaymentType, newTotal, extraAmount) {
          onStatusUpdate(id, status, note, newPaymentType, newTotal, extraAmount);
          const payMsg = newPaymentType ? "   Payment -> " + newPaymentType : "";
          const extraMsg = extraAmount > 0 ? "   +KD " + Number(extraAmount).toFixed(3) + " extra" : "";
          showToast((STATUS_CFG[status] ? STATUS_CFG[status].icon + " " : "") + status + payMsg + extraMsg);
          if (status !== "delivered") setStatusModal(null); // for delivered, Civil ID step closes
        }} onClose={function() { setStatusModal(null); }} />
      )}
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 80px" }}>
      {toast && <Toast msg={toast.msg} toastKind={toast.ttype} />}

      {/* Search bar - top position for easy access */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.3)", fontSize:15, pointerEvents:"none" }}>🔍</span>
        <input
          type="text"
          value={searchQ}
          onChange={function(e){ setSearchQ(e.target.value); }}
          placeholder="Search name, invoice no, OO no, phone..."
          style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, padding:"11px 40px 11px 40px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }}
        />
        {searchQ ? (
          <button onClick={function(){ setSearchQ(""); }}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,.5)", fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
        ) : null}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
        {[["",counts.collected,"Collected","#00D4FF"],["",counts.delivered,"Delivered","#10B981"],["",counts.postponed,"Postponed","#8B5CF6"],["x",counts.cancelled,"Cancelled","#EF4444"]].map(function(item) {
          const icon=item[0],v=item[1],l=item[2],c=item[3];
          return (
            <div key={l} style={{ background:c+"10", border:"1px solid "+c+"25", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:c, fontSize:18, fontWeight:800 }}>{v}</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10 }}>{l}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:10, paddingBottom:2 }}>
        {[["collected","To Deliver"],["delivered","Delivered"],["postponed","Postponed"],["cancelled","Cancelled"],["all","All"]].map(function(item) {
          const v=item[0],l=item[1];
          return (
            <Pill key={v} label={l} active={filter===v} onClick={function() { setFilter(v); }} count={v==="all"?myOrders.length:counts[v]} />
          );
        })}
      </div>

      {myStores.length > 2 && (
        <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10, paddingBottom:2 }}>
          {myStores.map(function(s) {
            return <Pill key={s} label={s === "all" ? "All Stores" : s.replace("Online","").trim()} active={storeFilter===s} onClick={function() { setStoreFilter(s); }} />;
          })}
        </div>
      )}

      {myPayments.length > 2 && (
        <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:14, paddingBottom:2 }}>
          {myPayments.map(function(p) {
            return <Pill key={p} label={p === "all" ? "All Payments" : p} active={payFilter===p} onClick={function() { setPayFilter(p); }} />;
          })}
        </div>
      )}

      {(storeFilter !== "all" || payFilter !== "all") && (
        <div style={{ background:"rgba(255,255,255,.05)", borderRadius:10, padding:"8px 12px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}>Showing {filtered.length} of {myOrders.length} orders</span>
          <button onClick={function() { setStoreFilter("all"); setPayFilter("all"); }} style={{ background:"none", border:"none", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>Clear x</button>
        </div>
      )}

      {/* Manual Order Entry for driver */}
      <DriverManualOrderForm driverId={driverId} onAdd={onAddOrder} />

      {/* Rearrange toolbar */}
      {filtered.length > 1 && (
        <div style={{ marginBottom:10 }}>
          {!rearranging ? (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button onClick={function(){ setRearranging(true); setTouchOrder([]); }}
                style={{ background:"rgba(124,58,237,.12)", border:"1px solid rgba(124,58,237,.3)", borderRadius:10, padding:"6px 14px", color:"#A78BFA", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                <span>⇅</span> Rearrange Route
              </button>
              {Object.keys(orderSeq).length > 0 && (
                <button onClick={function(){ setOrderSeq({}); try{ localStorage.removeItem("df_route_seq_" + driverId); }catch(e){} }}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,.25)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>Reset order</button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <div style={{ flex:1, background:"rgba(124,58,237,.1)", border:"1px solid rgba(124,58,237,.25)", borderRadius:10, padding:"8px 12px" }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#A78BFA", fontSize:12, fontWeight:700 }}>Tap orders in delivery order</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:2 }}>
                    {touchOrder.length === 0 ? "Tap first order → second order → ..." : touchOrder.length + " of " + filtered.length + " tapped"}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <button onClick={function(){
                    if (touchOrder.length === 0) return;
                    var newSeq = {};
                    touchOrder.forEach(function(id, idx){ newSeq[id] = idx; });
                    // Any un-tapped orders go after
                    var idx2 = touchOrder.length;
                    filtered.forEach(function(o){
                      var oid = o.invoiceNo||o.id;
                      if (newSeq[oid] === undefined) { newSeq[oid] = idx2++; }
                    });
                    setOrderSeq(newSeq);
                    setTouchOrder([]);
                    setRearranging(false);
                  }} style={{ background:"linear-gradient(135deg,#00D4FF,#7C3AED)", border:"none", borderRadius:10, padding:"7px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    Done
                  </button>
                  <button onClick={function(){ setRearranging(false); setTouchOrder([]); }}
                    style={{ background:"rgba(255,255,255,.07)", border:"none", borderRadius:10, padding:"7px 10px", color:"rgba(255,255,255,.4)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
              {touchOrder.length > 0 && (
                <button onClick={function(){ setTouchOrder([]); }}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,.2)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                  ↺ Start over
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:40 }}>
          {filter === "collected" ? "No collected orders yet - scan at warehouse first!" : "No orders match the filters"}
        </div>
      ) : (function() {
        var sorted = filtered.slice().sort(function(a, b) {
          var aKey = a.invoiceNo || a.id;
          var bKey = b.invoiceNo || b.id;
          var sa = orderSeq[aKey] !== undefined ? orderSeq[aKey] : 9999;
          var sb = orderSeq[bKey] !== undefined ? orderSeq[bKey] : 9999;
          if (sa !== sb) return sa - sb;
          return 0;
        });
        return sorted.map(function(o, i) {
          var oid = o.invoiceNo||o.id;
          var area = detectArea(o.address);
          if (rearranging) {
            var tapIdx = touchOrder.indexOf(oid);
            var isTapped = tapIdx !== -1;
            return (
              <div key={oid}
                onClick={function(){
                  if (isTapped) {
                    // Un-tap: remove from touchOrder
                    setTouchOrder(function(prev){ return prev.filter(function(x){ return x !== oid; }); });
                  } else {
                    // Tap: add to end of touchOrder
                    setTouchOrder(function(prev){ return [...prev, oid]; });
                  }
                }}
                style={{ display:"flex", alignItems:"center", gap:10, background:isTapped?"rgba(0,212,255,.08)":"rgba(255,255,255,.04)", border:"1.5px solid "+(isTapped?"rgba(0,212,255,.4)":"rgba(255,255,255,.08)"), borderRadius:14, padding:"12px 14px", marginBottom:8, cursor:"pointer", userSelect:"none" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:isTapped?"rgba(0,212,255,.2)":"rgba(255,255,255,.06)", border:"1.5px solid "+(isTapped?"#00D4FF":"rgba(255,255,255,.15)"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {isTapped ? (
                    <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:16, fontWeight:900 }}>{tapIdx+1}</span>
                  ) : (
                    <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.2)", fontSize:11 }}>tap</span>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:isTapped?"#fff":"rgba(255,255,255,.6)", fontSize:13, fontWeight:700 }}>{o.customer}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:11 }}>#{o.invoiceNo} · {o.store}{o.onlineOrderNo?" · Online Order: "+o.onlineOrderNo:""}</div>
                  <div style={{ display:"flex", gap:6, marginTop:3, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:12, fontWeight:700 }}>{fmt(o.total)}</span>
                    {area && <span style={{ background:"rgba(0,212,255,.12)", border:"1px solid rgba(0,212,255,.2)", borderRadius:20, padding:"1px 8px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:10, fontWeight:700 }}>{area}</span>}
                    {orderTags && orderTags[o.invoiceNo] && <span style={{ background:"rgba(245,158,11,.15)", borderRadius:20, padding:"1px 8px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:10, fontWeight:700 }}>{orderTags[o.invoiceNo]}</span>}
                  </div>
                </div>
                {isTapped && <span style={{ color:"rgba(255,255,255,.2)", fontSize:16 }}>✓</span>}
              </div>
            );
          }
          return (
            <div key={oid}>
              <OrderCardErrorBoundary>
                <DeliveryOrderCard order={o} onUpdate={function() { setStatusModal(o); }} onOpenTransfer={onOpenTransfer} onRequestHelp={onRequestHelp} orderTags={orderTags} onSetTag={onSetTag} onEditOrder={onEditOrder} />
              </OrderCardErrorBoundary>
            </div>
          );
        });
      })()}
    </div>
    </div>
  );
}


function TagButton({ invoiceNo, orderTags, onSetTag }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState("");
  const currentTag = orderTags && orderTags[invoiceNo];
  const PRESET_TAGS = ["Pickup", "Urgent", "Fragile", "Call First", "Return", "Exchange"];
  if (!editing) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        {currentTag ? (
          <span style={{ background:"rgba(245,158,11,.15)", border:"1px solid rgba(245,158,11,.35)", borderRadius:20, padding:"3px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:12, fontWeight:700 }}>
            {currentTag}
          </span>
        ) : null}
        <button onClick={function(){ setVal(currentTag||""); setEditing(true); }}
          style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:20, padding:"3px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11, cursor:"pointer" }}>
          {currentTag ? "Edit Tag" : "+ Add Tag"}
        </button>
        {currentTag && (
          <button onClick={function(){ if(onSetTag) onSetTag(invoiceNo, null); }}
            style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>Remove</button>
        )}
      </div>
    );
  }
  return (
    <div style={{ background:"rgba(245,158,11,.06)", border:"1px solid rgba(245,158,11,.2)", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:12, fontWeight:700, marginBottom:8 }}>Tag this order</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
        {PRESET_TAGS.map(function(t) {
          return (
            <button key={t} onClick={function(){ if(onSetTag) onSetTag(invoiceNo, t); setEditing(false); }}
              style={{ background: currentTag===t?"rgba(245,158,11,.25)":"rgba(255,255,255,.06)", border:"1px solid "+(currentTag===t?"rgba(245,158,11,.5)":"rgba(255,255,255,.1)"), borderRadius:20, padding:"4px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:currentTag===t?"#F59E0B":"rgba(255,255,255,.6)", fontSize:12, cursor:"pointer" }}>
              {t}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input value={val} onChange={function(e){ setVal(e.target.value); }} placeholder="Custom tag name..."
          style={{ flex:1, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"8px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
        <button onClick={function(){ if(val.trim() && onSetTag) onSetTag(invoiceNo, val.trim()); setEditing(false); }}
          style={{ background:"rgba(245,158,11,.2)", border:"1px solid rgba(245,158,11,.4)", borderRadius:10, padding:"8px 14px", color:"#F59E0B", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          Set
        </button>
        <button onClick={function(){ setEditing(false); }}
          style={{ background:"rgba(255,255,255,.05)", border:"none", borderRadius:10, padding:"8px 10px", color:"rgba(255,255,255,.4)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditOrderModal({ order, onSave, onClose }) {
  const [oo,         setOo]         = useState(order.onlineOrderNo || "");
  const [name,       setName]       = useState(order.customer || "");
  const [addr,       setAddr]       = useState(order.address || "");
  const [phone,      setPhone]      = useState(order.phone || "");
  const [area,       setArea]       = useState("");
  const [areaSearch, setAreaSearch] = useState("");
  const [showAreaDrop, setShowAreaDrop] = useState(false);

  const ALL_AREAS = ['Abdali','Abdulla Al-Salem','Abdullah Al-Mubarak','Abu Al Hasaniya','Abu Halifa','Adailiya','Adan','Ahmadi','Airport District','Ali As-Salim','Amghara','Andalus','Ardiya','Ardiya Industrial Area','Ashbelya','Bayan','Bnaid Al-Qar','Dasma','Dhajeej','Doha','Egaila','Fahad Al-Ahmad','Fahaheel','Faiha','Farwaniya','Fintas','Firdous','Granada (Kuwait)','Hadiya','Hawally','Hittin','Jaber Al-Ahmad','Jaber Al-Ali','Jabriya','Jahra','Jleeb Al-Shuyoukh','Kaifan','Khairan','Khaitan','Khaldiya','Kuwait City','Mahbula','Mangaf','Mansriya','Mishref','Mubarak Al-Kabeer','Naeem','Nasseem','North West Sulaibikhat','Nuzha','Qairawan','Qasr','Qurain','Qurtuba','Rabiya','Rawda','Riggae','Rumaithiya','Saad Al Abdullah','Sabah Al Salem','Sabah Al-Ahmad','Sabah Al-Nasser','Sabahiya','Sabhan','Salam','Salmiya','Salwa','Shaab','Shamiya','Sharq','Shuhada','Shuwaikh','Siddiq','Sulaibikhat','Sulaibiya','Surra','Waha','Yarmouk','Zahra'];
  const filteredAreas = ALL_AREAS.filter(function(a) { return a.toLowerCase().includes(areaSearch.toLowerCase()); });

  function save() {
    if (!name.trim()) return;
    var fullAddress = addr.trim() + (area ? ", " + area : "");
    onSave(order.id || order.invoiceNo, {
      onlineOrderNo: oo.trim(),
      customer:      name.trim(),
      address:       fullAddress,
      phone:         phone.trim(),
    });
    onClose();
  }

  const inputStyle = { width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(0,212,255,.25)", borderRadius:12, padding:"12px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:14, outline:"none" };
  const labelStyle = { fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.45)", fontSize:11, marginBottom:5, textTransform:"uppercase", letterSpacing:.5, display:"block" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:9100, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ width:"100%", background:"#161B24", borderRadius:"24px 24px 0 0", padding:"24px 20px 32px", maxHeight:"90dvh", overflowY:"auto" }} onClick={function(e){ e.stopPropagation(); }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:17, fontWeight:700 }}>✏️ Edit Order Details</div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:20, padding:"5px 12px", color:"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:20 }}>
          #{order.invoiceNo} · {order.store}
        </div>

        {[
          ["Online Order No", oo,    setOo,    "text", "e.g. 75869 or 26941"],
          ["Customer Name",   name,  setName,  "text", "Customer full name"],
          ["Address",         addr,  setAddr,  "text", "Street / building / block"],
          ["Mobile Number",   phone, setPhone, "tel",  "+965 XXXX XXXX"],
        ].map(function(row) {
          var label=row[0], val=row[1], setter=row[2], type=row[3], ph=row[4];
          return (
            <div key={label} style={{ marginBottom:14 }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={val} onChange={function(e){ setter(e.target.value); }}
                placeholder={ph} style={inputStyle} />
            </div>
          );
        })}

        {/* Area picker */}
        <div style={{ marginBottom:14, position:"relative" }}>
          <label style={labelStyle}>Area</label>
          <input
            type="text"
            value={area || areaSearch}
            onChange={function(e){ setAreaSearch(e.target.value); setArea(""); setShowAreaDrop(true); }}
            onFocus={function(){ setShowAreaDrop(true); }}
            placeholder="Search area..."
            style={inputStyle}
          />
          {showAreaDrop && areaSearch && filteredAreas.length > 0 && (
            <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#1E2530", border:"1px solid rgba(0,212,255,.25)", borderRadius:12, maxHeight:180, overflowY:"auto", zIndex:100, marginTop:4 }}>
              {filteredAreas.slice(0,10).map(function(a) {
                return (
                  <div key={a} onClick={function(){ setArea(a); setAreaSearch(a); setShowAreaDrop(false); }}
                    style={{ padding:"10px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
                    {a}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button onClick={onClose} style={{ flex:1, background:"rgba(255,255,255,.07)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={save} style={{ flex:2, background:"linear-gradient(135deg,#FF5A1F,#FF3D00)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}


// Error boundary to catch crashes in order cards
class OrderCardErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:12, fontWeight:700, marginBottom:4 }}>Order card error</div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>{String(this.state.error.message||this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DeliveryOrderCard({ order, onUpdate, onOpenTransfer, onRequestHelp, orderTags, onSetTag, onEditOrder }) {
  const [exp,        setExp]        = useState(false);
  const [helpOpen,   setHelpOpen]   = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [editingOO,  setEditingOO]  = useState(false);
  const [ooVal,      setOoVal]      = useState(order.onlineOrderNo || "");
  const [otpSent,    setOtpSent]    = useState(false);
  const [otpInput,   setOtpInput]   = useState("");
  const [otpErr,     setOtpErr]     = useState("");
  const [otpSkipped, setOtpSkipped] = useState(false);

  // Generate or retrieve OTP for this order (stored in localStorage)
  const otpKey = "df_otp_" + (order.invoiceNo || order.id);
  function getOrCreateOTP() {
    var stored = null;
    try { stored = sessionStorage.getItem(otpKey); } catch(e){}
    if (stored) return stored;
    var code;
    try {
      var arr = new Uint16Array(1);
      crypto.getRandomValues(arr);
      code = String(1000 + (arr[0] % 9000));
    } catch(e) {
      code = String(Math.floor(1000 + Math.random() * 9000));
    }
    try { sessionStorage.setItem(otpKey, code); } catch(e){}
    return code;
  }
  function clearOTP() { try { sessionStorage.removeItem(otpKey); } catch(e){} }

  const isActive    = order.scanned && order.status === "pending";
  const isCancelled = order.status === "cancelled";
  const isPostponed = order.status === "postponed";
  const isDelivered = order.status === "delivered";
  const isExchangeOrder = isExchange(order.paymentType) || isExchange(order.originalPaymentType);
  const isCOD = (order.paymentType === "Cash" || order.paymentType === "COD") && !isExchangeOrder;
  const rawPhone = (order.phone || "").replace(/\D/g, "");
  const waPhone  = rawPhone.startsWith("00") ? rawPhone.slice(2) : rawPhone.startsWith("0") ? "965" + rawPhone.slice(1) : rawPhone.startsWith("965") ? rawPhone : rawPhone.length >= 8 ? "965" + rawPhone : rawPhone;
  const callPhone = (order.phone || "").trim();
  const codPart  = isCOD ? " Please have *" + fmt(order.total) + "* ready for cash payment." : "";
  const waMsg    = encodeURIComponent("Dear Customer,\n\nYour order from *" + order.store + "* is out for delivery soon." + codPart + "\n\nThank you!");
  const waHref   = "https://wa.me/" + waPhone + "?text=" + waMsg;
  const callHref = "tel:+" + rawPhone.replace(/\D/g,"").slice(0,15);
  var borderColor = "rgba(255,255,255,.07)";
  if (isActive) borderColor = "rgba(0,212,255,.2)";
  else if (isCancelled) borderColor = "rgba(239,68,68,.2)";
  else if (isPostponed) borderColor = "rgba(139,92,246,.2)";
  else if (isDelivered) borderColor = "rgba(16,185,129,.2)";
  var bgColor = "rgba(255,255,255,.04)";
  if (isCancelled) bgColor = "rgba(239,68,68,.03)";
  else if (isPostponed) bgColor = "rgba(139,92,246,.03)";
  else if (isDelivered) bgColor = "rgba(16,185,129,.03)";

  function sendOTP() {
    var code = getOrCreateOTP();
    var otpMsg = encodeURIComponent(
      "Dear Customer,\n\nYour delivery OTP for *" + order.store + "* order #" + order.invoiceNo + " is:\n\n*" + code + "*\n\nPlease share this code with the delivery driver upon receiving your order.\n\nThank you!"
    );
    var url = "https://wa.me/" + waPhone + "?text=" + otpMsg;
    window.open(url, "_blank");
    setOtpSent(true);
    setOtpErr("");
  }

  function verifyOTP() {
    var code = getOrCreateOTP();
    if (otpInput.trim() === code) {
      clearOTP();
      setOtpErr("");
      onUpdate();
    } else {
      setOtpErr("Incorrect code. Ask the customer for the 4-digit code sent to their WhatsApp.");
      setOtpInput("");
    }
  }

  function skipOTP() {
    clearOTP();
    setOtpSkipped(true);
    onUpdate();
  }

  function renderOOSection() {
    if (editingOO) {
      return (
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }} onClick={function(e){ e.stopPropagation(); }}>
          <input autoFocus type="text" value={ooVal} onChange={function(e){ setOoVal(e.target.value); }}
            onKeyDown={function(e){
              if (e.key==="Enter") { setEditingOO(false); if (ooVal.trim()&&onEditOrder) onEditOrder(order.id||order.invoiceNo,{onlineOrderNo:ooVal.trim()}); }
              if (e.key==="Escape") { setEditingOO(false); setOoVal(order.onlineOrderNo||""); }
            }}
            placeholder="Enter Online Order No"
            style={{ width:90, background:"rgba(0,212,255,.1)", border:"1px solid #00D4FF", borderRadius:6, padding:"2px 6px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, outline:"none" }} />
          <button onClick={function(e){ e.stopPropagation(); setEditingOO(false); if(ooVal.trim()&&onEditOrder) onEditOrder(order.id||order.invoiceNo,{onlineOrderNo:ooVal.trim()}); }}
            style={{ background:"#00D4FF", border:"none", borderRadius:4, padding:"2px 6px", color:"#000", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, fontWeight:700, cursor:"pointer" }}>✓</button>
        </div>
      );
    }
    if (order.onlineOrderNo) {
      return (
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
          <span style={{ background:"rgba(0,212,255,.15)", borderRadius:6, padding:"1px 7px", border:"1px solid rgba(0,212,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:11, fontWeight:700 }}>
            Online Order: {order.onlineOrderNo}
          </span>
        </div>
      );
    }
    return (
      <button onClick={function(e){ e.stopPropagation(); setEditingOO(true); }}
        style={{ marginTop:3, background:"rgba(255,255,255,.06)", border:"1px dashed rgba(255,255,255,.2)", borderRadius:6, padding:"1px 8px", color:"rgba(255,255,255,.35)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, cursor:"pointer" }}>
        + Online Order
      </button>
    );
  }

  return (
    <div style={{ background:bgColor, border:"1px solid " + borderColor, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
      <div onClick={function() { setExp(function(v) { return !v; }); }} style={{ padding:"13px 15px", cursor:"pointer" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>{order.customer}</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:1 }}>
              {"#" + order.invoiceNo + "   " + order.store}
            </div>
            {renderOOSection()}
          </div>
          <Badge status={isActive ? "collected" : order.status} />
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:13, fontWeight:700 }}>{fmt(order.total)}</span>
          {(order.extraAmount > 0) && (
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EA580C", fontSize:11, fontWeight:700, background:"rgba(234,88,12,.12)", borderRadius:20, padding:"2px 8px", border:"1px solid rgba(234,88,12,.3)" }}>+{fmt(order.extraAmount)} extra</span>
          )}
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11 }}><PaymentBadge payType={order.paymentType} small /></span>
          {isExchangeOrder && (
            <span style={{ background:"rgba(107,114,128,.2)", color:"#9CA3AF", borderRadius:20, padding:"2px 10px", fontSize:11, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, border:"1px solid rgba(107,114,128,.3)" }}>Exchange</span>
          )}
          {(function(){ var _a = detectArea(order.address); return _a ? (
            <span style={{ background:"rgba(0,212,255,.12)", border:"1px solid rgba(0,212,255,.3)", borderRadius:20, padding:"2px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:11, fontWeight:700 }}>{_a}</span>
          ) : null; })()}
          {orderTags && orderTags[order.invoiceNo] && (
            <span style={{ background:"rgba(245,158,11,.15)", border:"1px solid rgba(245,158,11,.35)", borderRadius:20, padding:"2px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:11, fontWeight:700 }}>{orderTags[order.invoiceNo]}</span>
          )}
        </div>
      </div>

      {exp && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"14px 15px", background:"rgba(0,0,0,.15)" }}>
          <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, marginBottom:6  }}>{(function(){ var _a = detectArea(order.address); return _a ? <span style={{ background:"rgba(0,212,255,.12)", border:"1px solid rgba(0,212,255,.25)", borderRadius:20, padding:"1px 9px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:10, fontWeight:700, marginRight:6 }}>{_a}</span> : null; })()}<span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12  }}>{order.address}</span></div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12, marginBottom:10 }}>{"📞 " + order.phone}</div>

          {isExchangeOrder && (
            <div style={{ background:"rgba(107,114,128,.1)", border:"1px solid rgba(107,114,128,.3)", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#9CA3AF", fontSize:13, fontWeight:700 }}>Exchange Order - No cash collection required.</div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            <button onClick={function(e){e.preventDefault();window.location.href=callHref;}} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.3)", borderRadius:10, padding:"10px 8px", textDecoration:"none" }}>
              <span style={{ fontSize:16 }}></span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:12, fontWeight:700 }}>Call</span>
            </button>
            <button onClick={function(e){ e.preventDefault(); var callUrl = "whatsapp://call?phone=" + waPhone; window.location.href = callUrl; }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"rgba(37,211,102,.12)", border:"1px solid rgba(37,211,102,.35)", borderRadius:10, padding:"10px 8px" }}>
              <span style={{ fontSize:16 }}></span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#25D366", fontSize:12, fontWeight:700 }}>WA Call</span>
            </button>
          </div>

          {/* OTP via WhatsApp — only for active orders with a phone number */}
          {isActive && waPhone && (
            <div style={{ background:"rgba(37,211,102,.07)", border:"1px solid rgba(37,211,102,.2)", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Delivery OTP Verification</div>

              {!otpSent ? (
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.6)", fontSize:11, marginBottom:8, lineHeight:1.5 }}>
                    Send a 4-digit code to the customer via WhatsApp. Ask them to share it when you arrive.
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={sendOTP} style={{ flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:7, background:"linear-gradient(135deg,#25D366,#128C7E)", border:"none", borderRadius:10, padding:"11px", cursor:"pointer" }}>
                      <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:700 }}>Send OTP via WhatsApp</span>
                    </button>
                    <button onClick={skipOTP} style={{ flex:1, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"11px", color:"rgba(255,255,255,.4)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#25D366", fontSize:11, marginBottom:8 }}>
                    ✓ OTP sent — ask the customer for the 4-digit code.
                  </div>
                  <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                    <input
                      type="number"
                      value={otpInput}
                      onChange={function(e){ setOtpInput(e.target.value); setOtpErr(""); }}
                      placeholder="Enter 4-digit code"
                      maxLength={4}
                      style={{ flex:1, background:"rgba(255,255,255,.08)", border:"1px solid rgba(37,211,102,.4)", borderRadius:10, padding:"10px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:16, fontWeight:700, outline:"none", textAlign:"center", letterSpacing:4 }}
                    />
                    <button onClick={verifyOTP} style={{ flex:1, background:"linear-gradient(135deg,#25D366,#128C7E)", border:"none", borderRadius:10, padding:"10px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      Verify ✓
                    </button>
                  </div>
                  {otpErr && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#EF4444", fontSize:11, marginBottom:6 }}>{otpErr}</div>}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={sendOTP} style={{ flex:1, background:"rgba(37,211,102,.1)", border:"1px solid rgba(37,211,102,.25)", borderRadius:8, padding:"7px", color:"#25D366", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                      Resend OTP
                    </button>
                    <button onClick={skipOTP} style={{ flex:1, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, padding:"7px", color:"rgba(255,255,255,.4)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                      Skip (No WhatsApp)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Request */}
          {helpOpen && (
            <div style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)", borderRadius:12, padding:14, marginBottom:10 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:13, fontWeight:700, marginBottom:10 }}>Request Help - Select Issue</div>
              {[
                { key:"no_answer",    label:"Call Not Answering",          icon:"SOS" },
                { key:"wrong_number", label:"Wrong Phone Number",           icon:"!" },
                { key:"not_at_loc",   label:"Customer Not at Location",     icon:"?" },
                { key:"delay",        label:"Driver Delayed - En Route",    icon:"..." },
                { key:"other",        label:"Other Issue",                  icon:"*" },
              ].map(function(h) {
                return (
                  <button key={h.key} onClick={function() {
                    if (onRequestHelp) onRequestHelp(order, h.key, h.label);
                    setHelpOpen(false);
                    playSound("collect");
                  }} style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"10px 14px", marginBottom:6, display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left" }}>
                    <span style={{ background:"rgba(239,68,68,.15)", color:"#EF4444", borderRadius:6, padding:"2px 6px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:10, fontWeight:700, flexShrink:0 }}>{h.icon}</span>
                    <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13 }}>{h.label}</span>
                  </button>
                );
              })}
              <button onClick={function(){ setHelpOpen(false); }} style={{ width:"100%", background:"none", border:"none", color:"rgba(255,255,255,.35)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, padding:"6px 0", cursor:"pointer" }}>Cancel</button>
            </div>
          )}

          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            {!helpOpen && (
              <button onClick={function(){ setHelpOpen(true); }} style={{ flex:1, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:12, padding:12, color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                Need Help
              </button>
            )}
            {isPostponed && (
              <button onClick={onUpdate} style={{ flex:2, background:"linear-gradient(135deg,#8B5CF6,#7C3AED)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Retry ->
              </button>
            )}
            {isActive && !waPhone && (
              <button onClick={onUpdate} style={{ flex:2, background:"linear-gradient(135deg,#00D4FF,#7C3AED)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Update Status ->
              </button>
            )}
          </div>

          {order.note && (
            <div style={{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:"8px 12px", marginBottom:8 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>Note: {order.note}</div>
            </div>
          )}
          {/* Tag */}
          <TagButton invoiceNo={order.invoiceNo} orderTags={orderTags} onSetTag={onSetTag} />

          {onOpenTransfer && !isDelivered && (
            <button onClick={function() { onOpenTransfer(order); }}
              style={{ width:"100%", background:"rgba(255,90,31,.1)", border:"1px solid rgba(255,90,31,.3)", borderRadius:12, padding:11, color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              Request Transfer to Another Driver
            </button>
          )}

          {/* Edit Order Details */}
          <button onClick={function(e) { e.stopPropagation(); setEditOpen(true); }}
            style={{ width:"100%", marginTop:8, background:"rgba(0,212,255,.08)", border:"1px solid rgba(0,212,255,.25)", borderRadius:12, padding:11, color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            ✏️ Edit Order Details
          </button>
        </div>
      )}

      {editOpen && (
        <EditOrderModal
          order={order}
          onSave={function(id, fields) { if (onEditOrder) onEditOrder(id, fields); }}
          onClose={function() { setEditOpen(false); }}
        />
      )}
    </div>
  );
}

// ============================================================
// SECTION 12: STATUS UPDATE & CIVIL ID
// Lines: StatusUpdateModal, CivilIdScanner, dbSaveCivilId
// Fix delivery confirmation issues here
// ============================================================
/*  Status Update Modal  */
const LINK_OPTIONS = [
  { id:"GoCollect", label:"GoCollect",   color:"#A855F7" },
  { id:"Trikart Link", label:"Trikart Link", color:"#6366F1" },
  { id:"WAMD",      label:"WAMD",        color:"#0EA5E9" },
];

// ── Civil ID Scanner ──────────────────────────────────────────────────────────
async function dbSaveCivilId(record) {
  var sb = getSupabase();
  if (!sb) {
    return new Promise(function(resolve, reject) {
      loadSupabaseSDK(function() {
        var sb2 = getSupabase();
        if (!sb2) { reject(new Error("Database not connected")); return; }
        _doSaveCivilId(sb2, record).then(resolve).catch(reject);
      });
    });
  }
  return _doSaveCivilId(sb, record);
}

async function _doSaveCivilId(sb, record) {
  var row = {
    invoice_no:      record.invoiceNo,
    online_order_no: record.onlineOrderNo || "",
    civil_id_number: record.civilIdNumber,
    full_name:       record.fullName,
    driver_name:     record.driverName,
    delivered_date:  record.deliveredDate,
  };
  // Try insert first
  var ins = await sb.from("civil_id_records").insert(row);
  if (!ins.error) return; // inserted fine
  // If duplicate key error, update instead
  if (ins.error.code === "23505" || ins.error.message.includes("duplicate")) {
    var upd = await sb.from("civil_id_records").update({
      civil_id_number: row.civil_id_number,
      full_name:       row.full_name,
      driver_name:     row.driver_name,
      delivered_date:  row.delivered_date,
      online_order_no: row.online_order_no,
    }).eq("invoice_no", row.invoice_no);
    if (upd.error) throw upd.error;
    return;
  }
  throw ins.error;
}

async function dbLoadCivilIds() {
  var sb = getSupabase();
  if (!sb) return [];
  var { data, error } = await sb.from("civil_id_records").select("*").order("created_at", { ascending: false });
  if (error) { console.warn("Civil ID load error:", error.message); return []; }
  return data || [];
}

function CivilIdScanner({ order, driverName, onSaved, onSkip }) {
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [err, setErr]               = useState("");
  const [manualId, setManualId]     = useState("");
  const [manualName, setManualName] = useState("");
  const [confirmed, setConfirmed]   = useState(false); // review step

  function handleReview() {
    if (!manualId.trim() || !manualName.trim()) { setErr("Both Civil ID number and full name are required."); return; }
    if (!/^\d{12}$/.test(manualId.trim())) { setErr("Civil ID must be exactly 12 digits."); return; }
    setErr(""); setConfirmed(true);
  }

  function handleSave() {
    setSaving(true); setErr("");
    var today = (function(){ var d = new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })();
    dbSaveCivilId({
      invoiceNo:     order.invoiceNo,
      onlineOrderNo: order.onlineOrderNo || "",
      civilIdNumber: manualId.trim(),
      fullName:      manualName.trim(),
      driverName:    driverName,
      deliveredDate: today,
    }).then(function() {
      setSaving(false);
      setSaved(true);
      setTimeout(function() { onSaved && onSaved({ civilIdNumber: manualId.trim(), fullName: manualName.trim() }); }, 1500);
    }).catch(function(e2) {
      setSaving(false);
      setErr("Save failed: " + (e2 && e2.message ? e2.message : "Please try again."));
    });
  }

  return (
    <div style={{ background:"rgba(0,212,255,.06)", border:"1px solid rgba(0,212,255,.25)", borderRadius:16, padding:16, marginTop:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <span style={{ fontSize:22 }}>🪪</span>
        <div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:14, fontWeight:700 }}>Collect Customer Civil ID</div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.45)", fontSize:11 }}>Enter details from customer's Civil ID card</div>
        </div>
      </div>

      {saved ? (
        <div style={{ background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.3)", borderRadius:12, padding:"14px", textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:14, fontWeight:700 }}>Civil ID Saved Successfully!</div>
        </div>

      ) : confirmed ? (
        // Review step before saving
        <div>
          <div style={{ background:"rgba(0,0,0,.25)", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginBottom:8, letterSpacing:1 }}>PLEASE VERIFY BEFORE SAVING</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700, marginBottom:4 }}>{manualName}</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:14, letterSpacing:2 }}>{manualId}</div>
          </div>
          {err && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#EF4444", fontSize:12, marginBottom:8 }}>{err}</div>}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={function(){ setConfirmed(false); setErr(""); }}
              style={{ flex:1, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"11px", color:"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
              ← Edit
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex:2, background:saving?"rgba(16,185,129,.2)":"linear-gradient(135deg,#10B981,#00D4FF)", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, fontWeight:700, cursor:saving?"default":"pointer" }}>
              {saving ? "⏳ Saving…" : "✓ Confirm & Save"}
            </button>
          </div>
        </div>

      ) : (
        // Entry form
        <div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:4 }}>CIVIL ID NUMBER (12 digits)</div>
            <input type="text" value={manualId} onChange={function(e){ setManualId(e.target.value.replace(/\D/g,"")); }} placeholder="000000000000" maxLength={12} inputMode="numeric"
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(0,212,255,.3)", borderRadius:10, padding:"11px 14px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:16, fontWeight:700, outline:"none", letterSpacing:3 }} />
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:4 }}>FULL NAME (English only)</div>
            <input type="text" value={manualName} onChange={function(e){ setManualName(e.target.value); }} placeholder="e.g. Mohammed Ali Al-Mutairi"
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(0,212,255,.3)", borderRadius:10, padding:"11px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none" }} />
          </div>
          {err && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#EF4444", fontSize:12, marginBottom:8 }}>{err}</div>}
          <button onClick={handleReview}
            style={{ width:"100%", background:"rgba(0,212,255,.15)", border:"1.5px solid rgba(0,212,255,.4)", borderRadius:12, padding:"12px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Review →
          </button>
        </div>
      )}

      {!saved && (
        <button onClick={onSkip}
          style={{ width:"100%", background:"none", border:"none", color:"rgba(255,255,255,.25)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer", marginTop:10, textDecoration:"underline" }}>
          Skip Civil ID collection
        </button>
      )}
    </div>
  );
}

function StatusUpdateModal({ order, onUpdate, onClose, driverName }) {
  const [status,       setStatus]      = useState("");
  const [note,         setNote]        = useState("");
  const [payMode,      setPayMode]     = useState("");
  const [linkPlatform, setLinkPlatform] = useState("");
  const [cashAmt,      setCashAmt]     = useState("");
  const [splitLink,    setSplitLink]   = useState("");
  const [partialMode,  setPartialMode] = useState(false);
  const [actualAmt,    setActualAmt]   = useState("");
  const [partialReason,setPartialReason] = useState("");
  const [otherReason,  setOtherReason]  = useState("");
  const [extraAmt,     setExtraAmt]    = useState("");
  const [showCivilId,  setShowCivilId] = useState(false); // after delivery confirmed
  const isCOD   = (order.paymentType === "Cash" || order.paymentType === "COD") && !isExchange(order.paymentType);
  const total   = Number(order.total);
  const actualNum = parseFloat(actualAmt) || 0;
  const cashNum  = parseFloat(cashAmt) || 0;
  const linkNum  = total - cashNum;
  const splitValid = cashNum > 0 && cashNum < total && splitLink;

  function buildPaymentLabel() {
    if (!payMode) return null;
    if (payMode === "full_link") return linkPlatform ? linkPlatform + " (Link)" : null;
    if (payMode === "split")     return splitValid ? "Split: Cash " + fmt(cashNum) + " + " + splitLink + " " + fmt(linkNum) : null;
    if (payMode === "pre_paid")  return linkPlatform ? linkPlatform : null;
    return null;
  }
  const finalPayment = buildPaymentLabel();
  const canConfirm = status && (status !== "delivered" || !isCOD || !payMode || payMode === "" ||
    (payMode === "full_link" && linkPlatform) ||
    (payMode === "split" && splitValid) ||
    (payMode === "pre_paid" && linkPlatform));

  function handleConfirm() {
    if (!canConfirm) return;
    var fullNote = note;
    if (partialMode && actualNum > 0 && actualNum < total) {
      var reasonText = partialReason === "Other" ? (otherReason || "Other") : partialReason;
      fullNote = (note ? note + " | " : "") + "Partial delivery: KD " + actualNum.toFixed(3) + " of KD " + total.toFixed(3) + (reasonText ? " (" + reasonText + ")" : "");
    }
    var extraNum = parseFloat(extraAmt) || 0;
    if (extraNum > 0) {
      fullNote = (fullNote ? fullNote + " | " : "") + "Extra collected: KD " + extraNum.toFixed(3);
    }
    onUpdate(order.id||order.invoiceNo, status, fullNote, finalPayment || null, (partialMode && actualNum > 0 && actualNum < total) ? actualNum : null, extraNum > 0 ? extraNum : null);
    // Show Civil ID collection step after delivery
    if (status === "delivered") {
      setShowCivilId(true);
    }
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,.88)", zIndex:9000, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ width:"100%", background:"#161B24", borderRadius:"24px 24px 0 0", maxHeight:"92dvh", display:"flex", flexDirection:"column", WebkitOverflowScrolling:"touch" }}>
        {/* Scrollable content - flex:1 so button is always visible below */}
        <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"24px 20px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:17, fontWeight:700 }}>Update Delivery Status</div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:20, padding:"5px 12px", color:"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>✕ Close</button>
          </div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:13, marginBottom:18 }}>
            #{order.invoiceNo} — {order.customer}
            {isCOD && <span style={{ color:"#F59E0B", marginLeft:8, fontWeight:600 }}>{fmt(order.total)} COD</span>}
          </div>

          {/* Status buttons */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
            {[["delivered","Delivered","#10B981"],["postponed","Postponed","#8B5CF6"],["cancelled","Cancelled","#EF4444"]].map(function(item) {
              var s=item[0], l=item[1], c=item[2];
              return (
                <button key={s} onClick={function(){ setStatus(s); setPayMode(""); setLinkPlatform(""); }}
                  style={{ background:status===s?(c+"20"):"rgba(255,255,255,.05)", border:status===s?("2px solid "+c):"1px solid rgba(255,255,255,.1)", borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left" }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:status===s?c:"#fff", fontSize:14, fontWeight:700 }}>{l}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:2 }}>
                    {s==="delivered"?"Order handed to customer":s==="postponed"?"Customer unavailable - retry later":"Order could not be delivered"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* COD payment options — only for Delivered */}
          {status === "delivered" && isCOD && (
            <div style={{ background:"rgba(245,158,11,.06)", border:"1px solid rgba(245,158,11,.2)", borderRadius:14, padding:"14px", marginBottom:16 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:13, fontWeight:700, marginBottom:10 }}>
                💵 How was payment collected?
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  { id:"",          label:"💵",  sub:"Cash Only",   color:"#F59E0B" },
                  { id:"full_link", label:"🔗",  sub:"Link Only",   color:"#A855F7" },
                  { id:"split",     label:"💵🔗", sub:"Split",       color:"#00D4FF" },
                  { id:"pre_paid",  label:"✅",  sub:"Pre-Paid",    color:"#10B981" },
                ].map(function(opt) {
                  return (
                    <button key={opt.id} onClick={function(){ setPayMode(opt.id); setLinkPlatform(""); setSplitLink(""); setCashAmt(""); }}
                      style={{ background:payMode===opt.id?(opt.color+"20"):"rgba(255,255,255,.05)", border:payMode===opt.id?("2px solid "+opt.color):"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"10px 6px", cursor:"pointer", textAlign:"center" }}>
                      <div style={{ fontSize:18, marginBottom:3 }}>{opt.label}</div>
                      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:payMode===opt.id?opt.color:"rgba(255,255,255,.6)", fontSize:10, fontWeight:700 }}>{opt.sub}</div>
                    </button>
                  );
                })}
              </div>

              {/* Pre-Paid — pick payment method */}
              {payMode === "pre_paid" && (
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8 }}>SELECT PRE-PAID METHOD</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[
                      { id:"KNET",  label:"K-NET",  color:"#003DA5" },
                      { id:"Tabby", label:"Tabby",  color:"#3DEBA0" },
                      { id:"Deema", label:"Deema",  color:"#C0596A" },
                      { id:"Taly",  label:"Taly",   color:"#9CA3AF" },
                    ].map(function(pp) {
                      return (
                        <button key={pp.id} onClick={function(){ setLinkPlatform(pp.id); }}
                          style={{ flex:1, minWidth:70, background:linkPlatform===pp.id?(pp.color+"33"):"rgba(255,255,255,.06)", border:linkPlatform===pp.id?("2px solid "+pp.color):"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"9px 6px", cursor:"pointer", textAlign:"center" }}>
                          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:linkPlatform===pp.id?pp.color:"rgba(255,255,255,.6)", fontSize:12, fontWeight:700 }}>{pp.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  {linkPlatform && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#10B981", fontSize:12, marginTop:8 }}>✓ Pre-paid via {linkPlatform} — no cash collection needed</div>}
                </div>
              )}

              {/* Full link — pick platform */}
              {payMode === "full_link" && (
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8 }}>SELECT PLATFORM</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {LINK_OPTIONS.map(function(lk) {
                      return (
                        <button key={lk.id} onClick={function(){ setLinkPlatform(lk.id); }}
                          style={{ flex:1, minWidth:80, background:linkPlatform===lk.id?(lk.color+"25"):"rgba(255,255,255,.06)", border:linkPlatform===lk.id?("2px solid "+lk.color):"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"8px 6px", cursor:"pointer", textAlign:"center" }}>
                          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:linkPlatform===lk.id?lk.color:"rgba(255,255,255,.6)", fontSize:11, fontWeight:700 }}>{lk.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  {linkPlatform && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#A855F7", fontSize:12, marginTop:8 }}>✓ Full {fmt(total)} via {linkPlatform}</div>}
                </div>
              )}

              {/* Split — cash amount + link platform */}
              {payMode === "split" && (
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8 }}>CASH AMOUNT RECEIVED</div>
                  <input type="number" value={cashAmt} onChange={function(e){ setCashAmt(e.target.value); }} placeholder={"e.g. " + fmt(total/2)}
                    style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"10px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:14, marginBottom:10, boxSizing:"border-box" }} />
                  {cashNum > 0 && cashNum < total && (
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:10 }}>
                      Link amount: <span style={{ color:"#00D4FF", fontWeight:600 }}>{fmt(linkNum)}</span>
                    </div>
                  )}
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8 }}>LINK PLATFORM</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {LINK_OPTIONS.map(function(lk) {
                      return (
                        <button key={lk.id} onClick={function(){ setSplitLink(lk.id); }}
                          style={{ flex:1, minWidth:80, background:splitLink===lk.id?(lk.color+"25"):"rgba(255,255,255,.06)", border:splitLink===lk.id?("2px solid "+lk.color):"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"8px 6px", cursor:"pointer", textAlign:"center" }}>
                          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:splitLink===lk.id?lk.color:"rgba(255,255,255,.6)", fontSize:11, fontWeight:700 }}>{lk.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  {splitValid && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:12, marginTop:8 }}>✓ Cash {fmt(cashNum)} + {splitLink} {fmt(linkNum)}</div>}
                </div>
              )}
            </div>
          )}

          {/* Partial Delivery - only for delivered COD */}
          {status === "delivered" && isCOD && (
            <div style={{ marginBottom:14 }}>
              <button onClick={function(){ setPartialMode(function(v){ return !v; }); setActualAmt(""); setPartialReason(""); }}
                style={{ width:"100%", background:partialMode?"rgba(239,68,68,.12)":"rgba(255,255,255,.05)", border:partialMode?"1.5px solid #EF4444":"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"11px 14px", cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:partialMode?"#EF4444":"rgba(255,255,255,.6)", fontSize:13, fontWeight:700 }}>
                  {partialMode ? "✓ Partial Delivery Active" : "Partial Delivery (amount dispute / partial items)"}
                </div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:2 }}>
                  Customer refused charge or took only some items
                </div>
              </button>
              {partialMode && (
                <div style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)", borderRadius:12, padding:14, marginTop:8 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11, marginBottom:6 }}>ACTUAL AMOUNT COLLECTED (KD)</div>
                  <input type="number" value={actualAmt} onChange={function(e){ setActualAmt(e.target.value); }}
                    placeholder={"Less than " + total.toFixed(3)}
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.08)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"10px 12px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:16, fontWeight:700, outline:"none", marginBottom:8 }} />
                  {actualNum > 0 && actualNum < total && (
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, marginBottom:8 }}>
                      <span style={{ color:"#10B981", fontWeight:700 }}>KD {actualNum.toFixed(3)}</span>
                      <span style={{ color:"rgba(255,255,255,.3)" }}> collected — KD {(total-actualNum).toFixed(3)} waived</span>
                    </div>
                  )}
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11, marginBottom:6, marginTop:4 }}>REASON</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:partialReason==="Other"?8:0 }}>
                    {["Refused delivery charge","Took 1 item only","Price dispute","Other"].map(function(r){
                      return <button key={r} onClick={function(){ setPartialReason(r); }}
                        style={{ background:partialReason===r?"rgba(239,68,68,.2)":"rgba(255,255,255,.06)", border:partialReason===r?"1px solid #EF4444":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"4px 10px", color:partialReason===r?"#EF4444":"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>{r}</button>;
                    })}
                  </div>
                  {partialReason === "Other" && (
                    <input type="text" value={otherReason}
                      onChange={function(e){ setOtherReason(e.target.value); }}
                      placeholder="Describe the reason..."
                      style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"8px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, outline:"none", marginTop:6 }} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Extra Amount — for all delivered orders */}
          {status === "delivered" && (
            <div style={{ background:"rgba(255,165,0,.06)", border:"1px solid rgba(255,165,0,.2)", borderRadius:14, padding:14, marginBottom:14 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FFA500", fontSize:13, fontWeight:700, marginBottom:4 }}>➕ Extra Amount to Collect?</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:10 }}>
                e.g. delivery charge, extra items not in original order
              </div>
              <input type="number" value={extraAmt} onChange={function(e){ setExtraAmt(e.target.value); }}
                placeholder="0.000 KD  (leave blank if none)" step="0.001" min="0"
                style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,165,0,.3)", borderRadius:10, padding:"10px 14px", color:"#FFA500", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:15, fontWeight:700, outline:"none", marginBottom: (parseFloat(extraAmt)||0)>0 ? 8 : 0 }} />
              {(parseFloat(extraAmt)||0) > 0 && (
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#FFA500", fontSize:12 }}>
                  Total with extra: <strong>KD {(Number(order.total) + (parseFloat(extraAmt)||0)).toFixed(3)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {status && status !== "delivered" && (
            <textarea value={note} onChange={function(e){ setNote(e.target.value); }} placeholder="Add a note (optional)..."
              style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, padding:"10px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:14, minHeight:72, resize:"none", boxSizing:"border-box", marginBottom:16 }} />
          )}
        </div>

        {/* Confirm button OUTSIDE scroll area — always visible on iOS */}
        <div style={{ flexShrink:0, background:"#161B24", padding:"12px 20px", paddingBottom:"max(env(safe-area-inset-bottom, 0px) + 12px, 20px)", borderTop:"1px solid rgba(255,255,255,.06)" }}>
          {showCivilId ? (
            <CivilIdScanner
              order={order}
              driverName={driverName || "Driver"}
              onSaved={function(){ setTimeout(onClose, 1500); }}
              onSkip={onClose}
            />
          ) : (
            <button onClick={handleConfirm} disabled={!canConfirm}
              style={{ width:"100%", background:canConfirm?"linear-gradient(135deg,#00D4FF,#7C3AED)":"rgba(255,255,255,.1)", border:"none", borderRadius:14, padding:15, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:15, cursor:canConfirm?"pointer":"default" }}>
              {status ? "Confirm " + status.charAt(0).toUpperCase()+status.slice(1) : "Select a status above"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTION 13: COMMISSION & DRIVER PROFILE
// Lines: calcCommission, CommissionCard, DriverProfileTab
// ============================================================
/*  Commission logic  */
const COMMISSION_THRESHOLD = 20;   // must deliver more than this to earn commission
const COMMISSION_PER_ORDER = 0.250; // KD per order above threshold (21st, 22nd, etc.)

function calcCommission(deliveredCount) {
  const eligible = Math.max(0, deliveredCount - COMMISSION_THRESHOLD); // orders above 20
  if (eligible === 0) return { earned: false, amount: 0, deliveredCount, eligible };
  return { earned: true, amount: eligible * COMMISSION_PER_ORDER, deliveredCount, eligible };
}

/*  Driver: Commission Card  */
function CommissionCard({ deliveredCount }) {
  const { earned, amount, eligible } = calcCommission(deliveredCount);
  const needed = Math.max(0, COMMISSION_THRESHOLD + 1 - deliveredCount); // need 21st order
  const pct    = Math.min(100, Math.round(deliveredCount / (COMMISSION_THRESHOLD + 1) * 100));

  return (
    <div style={{ background: earned ? "linear-gradient(135deg,rgba(16,185,129,.15),rgba(0,212,255,.1))" : "rgba(255,255,255,.04)", border:"1px solid " + (earned?"rgba(16,185,129,.3)":"rgba(255,255,255,.1)"), borderRadius:16, padding:16, marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color: earned?"#10B981":"#fff", fontSize:14, fontWeight:700 }}>
            {earned ? "🎉 Commission Earned!" : " Commission Progress"}
          </div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.45)", fontSize:12, marginTop:2 }}>
            {earned
              ? (eligible) + " order" + (eligible>1?"s":"") + " x KD " + (COMMISSION_PER_ORDER.toFixed(3)) + " (orders 21-" + (deliveredCount) + ")"
              : "Deliver " + (needed) + " more order" + (needed>1?"s":"") + " to start earning"}
          </div>
        </div>
        {earned && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:22, fontWeight:800 }}>{fmt(amount)}</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>today&apos;s commission</div>
          </div>
        )}
      </div>
      {/* Progress bar */}
      <div style={{ background:"rgba(255,255,255,.08)", borderRadius:30, height:8, overflow:"hidden", marginBottom:6 }}>
        <div style={{ height:"100%", width:(pct) + "%", background: earned ? "linear-gradient(90deg,#10B981,#00D4FF)" : "linear-gradient(90deg,#F59E0B,#FF6B35)", borderRadius:30, transition:"width .8s ease" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>{deliveredCount} delivered</span>
        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>
          {earned ? "+" + (eligible) + " commission orders" : (COMMISSION_THRESHOLD) + " to unlock   KD " + (COMMISSION_PER_ORDER.toFixed(3)) + "/order from 21st"}
        </span>
      </div>
    </div>
  );
}

/*  Driver: Profile Tab  */
function Row({ icon, label, value, highlight }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:16, width:22, textAlign:"center" }}>{icon}</span>
        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.45)", fontSize:13 }}>{label}</span>
      </div>
      <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color: highlight || "#fff", fontSize:13, fontWeight:600, textAlign:"right", maxWidth:180 }}>{value || "-"}</span>
    </div>
  );
}

function DriverProfileTab({ user, orders, expenses }) {
  const driver      = DRIVERS.find(d => d.id === user.id) || {};
  const selVehicle = (function(){
    try { return JSON.parse(localStorage.getItem("df_vehicle_" + user.id)) || null; } catch(e){ return null; }
  })();
  const delivered   = orders.filter(o => o.status === "delivered").length;
  const totalExpAmt = expenses.reduce((a,e) => a + Number(e.amount), 0);
  const comm        = calcCommission(orders.filter(o => o.status === "delivered" && !isExchange(o.paymentType) && !isExchange(o.originalPaymentType)).length);

  // Daftar expiry warning
  const daftarDate    = driver.daftarExpiry ? new Date(driver.daftarExpiry) : null;
  const daysToExpiry  = daftarDate ? Math.ceil((daftarDate - new Date()) / 86400000) : null;
  const daftarWarning = daysToExpiry !== null && daysToExpiry <= 60;
  const daftarExpired = daysToExpiry !== null && daysToExpiry <= 0;

  const vehicleIcon = driver.vehicleType === "Van" ? "🚐" : driver.vehicleType === "Bike" ? "🏍" : "🚗";



  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 16px 80px" }}>

      {/* Avatar + name hero */}
      <div style={{ background:"linear-gradient(135deg,rgba(0,212,255,.08),rgba(124,58,237,.1))", border:"1px solid rgba(0,212,255,.15)", borderRadius:20, padding:24, marginBottom:16, textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:26, fontWeight:800, color:"#fff" }}>
          {driver.avatar || user.name?.slice(0,2).toUpperCase()}
        </div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:20, fontWeight:800 }}>{driver.name}</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:13, marginTop:4 }}>ID: {user.id.toUpperCase()}   Delivery Driver</div>
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:10 }}>
          <span style={{ background: driver.status==="active"?"rgba(16,185,129,.15)":"rgba(107,114,128,.15)", color: driver.status==="active"?"#10B981":"#9CA3AF", border:"1px solid " + (driver.status==="active"?"rgba(16,185,129,.3)":"rgba(107,114,128,.3)"), borderRadius:20, padding:"3px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, fontWeight:600 }}>
            {driver.status==="active" ? "Active" : "Inactive"}
          </span>
          <span style={{ background:"rgba(255,90,31,.1)", color:"#FF5A1F", border:"1px solid rgba(255,90,31,.25)", borderRadius:20, padding:"3px 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12 }}>
            {vehicleIcon} {driver.vehicleType || "-"}
          </span>
        </div>
      </div>

      {/* Personal Details */}
      <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"0 16px", marginBottom:14 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", padding:"12px 0 4px" }}>Personal Details</div>
        <Row icon="👤" label="Full Name"       value={driver.name} />
        <Row icon="📞" label="Mobile Number"   value={driver.phone} />
        <Row icon="🌍" label="Nationality"     value={driver.nationality} />
        <Row icon="📅" label="Joined"          value={driver.joinDate ? new Date(driver.joinDate).toLocaleDateString("en-KW",{day:"numeric",month:"long",year:"numeric"}) : "-"} />
      </div>

      {/* Vehicle Details */}
      <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"0 16px", marginBottom:14 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", padding:"12px 0 4px" }}>Vehicle Details</div>
        <Row icon={vehicleIcon} label="Vehicle Type"   value={driver.vehicleType} />
        <Row icon="🔢"          label="Vehicle Number" value={driver.vehicleNo} />
        <Row icon="📋"          label="License No."    value={driver.licenseNo} />
        <Row icon="📄"          label="Daftar Renewal"
          value={daftarDate ? daftarDate.toLocaleDateString("en-KW",{day:"numeric",month:"short",year:"numeric"}) + (daysToExpiry !== null ? " (" + (daftarExpired ? "EXPIRED" : daysToExpiry+" days") + ")" : "") : "-"}
          highlight={daftarExpired ? "#EF4444" : daftarWarning ? "#F59E0B" : "#fff"}
        />
      </div>

      {/* Company Vehicle Assignment */}
      <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>Assigned Vehicle</div>
        {selVehicle ? (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700 }}>{selVehicle.brand} {selVehicle.model}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginTop:2 }}>
                  Plate: <span style={{ color:"#FF5A1F", fontWeight:600 }}>{selVehicle.plate}</span>   {selVehicle.color} {selVehicle.type}
                </div>
              </div>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10 }}>Assigned by Admin</span>
            </div>
          </div>
        ) : (
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>No vehicle assigned yet. Contact admin.</div>
        )}
      </div>

      {/* Daftar expiry alert */}
      {(daftarWarning || daftarExpired) && (
        <div style={{ background: daftarExpired?"rgba(239,68,68,.1)":"rgba(245,158,11,.1)", border:"1px solid " + (daftarExpired?"rgba(239,68,68,.3)":"rgba(245,158,11,.3)"), borderRadius:12, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>{daftarExpired ? "🚨" : ""}</span>
          <div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color: daftarExpired?"#EF4444":"#F59E0B", fontSize:13, fontWeight:700 }}>
              {daftarExpired ? "Daftar EXPIRED!" : "Daftar expires in " + (daysToExpiry) + " days"}
            </div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>Please renew vehicle registration immediately</div>
          </div>
        </div>
      )}

      {/* Today's Performance */}
      <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"0 16px", marginBottom:14 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", padding:"12px 0 4px" }}>Today&apos;s Performance</div>
        <Row icon="📦" label="Total Orders"   value={(orders.length) + " assigned"} />
        <Row icon="" label="Delivered"       value={(delivered) + " orders"} highlight="#10B981" />
        <Row icon="" label="Commission"      value={comm.earned ? fmt(comm.amount) : "Not yet (" + (Math.max(0,21-orders.filter(o=>o.status==="delivered"&&!isExchange(o.paymentType)).length)) + " more needed)"} highlight={comm.earned ? "#10B981" : undefined} />
        <Row icon="" label="Vehicle Expenses" value={totalExpAmt > 0 ? "- " + (fmt(totalExpAmt)) : "None logged"} highlight={totalExpAmt > 0 ? "#EF4444" : undefined} />
      </div>

      {/* Today's Order Activity */}
      {orders.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Today's Order Activity</div>
          {[
            { label:"Delivered", items:orders.filter(function(o){ return o.status==="delivered"&&!isExchange(o.paymentType)&&!isExchange(o.originalPaymentType); }), color:"#10B981", border:"rgba(16,185,129,.2)" },
            { label:"Exchange",  items:orders.filter(function(o){ return o.status==="delivered"&&(isExchange(o.paymentType)||isExchange(o.originalPaymentType)); }), color:"#9CA3AF", border:"rgba(107,114,128,.2)" },
            { label:"Cancelled", items:orders.filter(function(o){ return o.status==="cancelled"; }), color:"#EF4444", border:"rgba(239,68,68,.2)" },
            { label:"Postponed", items:orders.filter(function(o){ return o.status==="postponed"; }), color:"#8B5CF6", border:"rgba(139,92,246,.2)" },
          ].filter(function(g){ return g.items.length>0; }).map(function(g){
            return (
              <div key={g.label} style={{ background:"rgba(255,255,255,.03)", border:"1px solid "+g.border, borderRadius:14, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:g.color, fontSize:13, fontWeight:700, marginBottom:6 }}>{g.label} — {g.items.length} order{g.items.length>1?"s":""}</div>
                {g.items.map(function(o){
                  return (
                    <div key={o.invoiceNo} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.8)", fontSize:12, fontWeight:600 }}>{o.customer}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10 }}>#{o.invoiceNo}{o.onlineOrderNo?" · OO:"+o.onlineOrderNo:""} · {o.store}</div>
                        {o.note?<div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.25)", fontSize:10, fontStyle:"italic" }}>{o.note}</div>:null}
                      </div>
                      <div style={{ textAlign:"right", marginLeft:8 }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:g.color, fontSize:12, fontWeight:700 }}>{fmt(o.total)}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10 }}>{o.paymentType}</div>
                      </div>
                    </div>
                  );
                })}
                {g.label==="Delivered" && (
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:g.color, fontSize:11, fontWeight:700, marginTop:6, textAlign:"right" }}>
                    Total Collected: {fmt(g.items.reduce(function(a,o){ return a+Number(o.total); },0))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECTION 14: DRIVER — EXPENSES TAB
// Lines: DriverExpensesTab
// ============================================================
/*  Driver: Expenses Tab  */
function DriverExpensesTab({ driverId, driverName, expenses, orders, onAddExpense, onUpdateExpense, onDeleteExpense }) {
  const [expType, setExpType] = useState("");
  const [amount, setAmount] = useState("");
  const [note,   setNote]   = useState("");
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState("");
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");

  const totalExp    = expenses.reduce((a,e)=>a+Number(e.amount),0);
  const delivCount  = orders.filter(o=>o.status==="delivered" && !isExchange(o.paymentType) && !isExchange(o.originalPaymentType)).length;
  const commission  = calcCommission(delivCount);

  function submit() {
    if (!expType) { setErr("Select expense type"); return; }
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setErr("Enter a valid amount"); return; }
    setErr("");
    onAddExpense({ driverId, driverName, type:expType, amount: Number(amount), note });
    setSaved(true); setExpType(""); setAmount(""); setNote("");
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 16px 80px" }}>
      {/* Commission card */}
      <CommissionCard deliveredCount={delivCount} />

      {/* Add expense form */}
      <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:16, marginBottom:16 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700, marginBottom:14 }}> Log Vehicle Expense</div>

        {/* Type selector */}
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8 }}>EXPENSE TYPE</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
          {EXPENSE_TYPES.map(t => (
            <button key={t} onClick={() => setExpType(t)}
              style={{ background:expType===t?"rgba(255,90,31,.2)":"rgba(255,255,255,.06)", border:expType===t?"1.5px solid #FF6B35":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"7px 14px", cursor:"pointer" }}>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:expType===t?"#FF5A1F":"rgba(255,255,255,.6)", fontSize:13, fontWeight:expType===t?600:400 }}>
                {t==="Fuel"?" Fuel":t==="Parking"?"🅿 Parking":t==="Toll"?"🛣 Toll":t==="Car Wash"?"🚿 Car Wash":t==="Maintenance"?"🔧 Maintenance":"📋 "+t}
              </span>
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:6 }}>AMOUNT (KD)</div>
        <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.000" step="0.001" min="0"
          style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"12px 14px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:16, fontWeight:700, outline:"none", boxSizing:"border-box", marginBottom:12 }} />

        {/* Note */}
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional, e.g. filled at KNPC station)"
          style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"11px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:12 }} />

        {err && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#EF4444", fontSize:12, marginBottom:8 }}> {err}</div>}

        <button onClick={submit}
          style={{ width:"100%", background: saved?"#10B981":"linear-gradient(135deg,#FF6B35,#FF3D71)", border:"none", borderRadius:12, padding:14, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", transition:"background .3s" }}>
          {saved ? " Expense Saved!" : "Save Expense ->"}
        </button>
      </div>

      {/* Expense history */}
      {expenses.length > 0 && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>Today&apos;s Expenses</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:15, fontWeight:800 }}>- {fmt(totalExp)}</div>
          </div>
          {expenses.map(function(e,i) {
            if (editId === e.id) {
              return (
                <div key={e.id||i} style={{ background:"rgba(255,90,31,.08)", border:"1px solid rgba(255,90,31,.3)", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:13, fontWeight:700, marginBottom:10 }}>Edit Expense</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    {EXPENSE_TYPES.map(function(t){ return (
                      <button key={t} onClick={function(){ setEditType(t); }}
                        style={{ background:editType===t?"rgba(255,90,31,.2)":"rgba(255,255,255,.06)", border:editType===t?"1.5px solid #FF6B35":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"5px 10px", cursor:"pointer" }}>
                        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:editType===t?"#FF5A1F":"rgba(255,255,255,.5)", fontSize:12 }}>{t}</span>
                      </button>
                    ); })}
                  </div>
                  <input type="number" value={editAmount} onChange={function(e){ setEditAmount(e.target.value); }} placeholder="Amount KD"
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"9px 12px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:15, fontWeight:700, outline:"none", marginBottom:8 }} />
                  <input value={editNote} onChange={function(e){ setEditNote(e.target.value); }} placeholder="Note (optional)"
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"9px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none", marginBottom:10 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={function(){
                        if (!editAmount || isNaN(editAmount) || Number(editAmount)<=0) return;
                        onUpdateExpense && onUpdateExpense(e.id, { type:editType, amount:Number(editAmount), note:editNote });
                        setEditId(null);
                      }}
                      style={{ flex:1, background:"#FF5A1F", border:"none", borderRadius:10, padding:"10px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save</button>
                    <button onClick={function(){ setEditId(null); }}
                      style={{ flex:1, background:"rgba(255,255,255,.08)", border:"none", borderRadius:10, padding:"10px", color:"rgba(255,255,255,.6)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, cursor:"pointer" }}>Cancel</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={e.id||i} style={{ background:"rgba(239,68,68,.05)", border:"1px solid rgba(239,68,68,.15)", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:600 }}>{e.type==="Fuel"?"⛽":e.type==="Parking"?"🅿":e.type==="Toll"?"🛣":e.type==="Car Wash"?"🚿":e.type==="Maintenance"?"🔧":"📋"} {e.type}</div>
                  {e.note && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:2 }}>{e.note}</div>}
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.25)", fontSize:10, marginTop:2 }}>{new Date(e.createdAt).toLocaleTimeString("en-KW",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:14, fontWeight:800 }}>- {fmt(e.amount)}</div>
                  <button onClick={function(){ setEditId(e.id); setEditType(e.type); setEditAmount(String(e.amount)); setEditNote(e.note||""); }}
                    style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:8, padding:"4px 8px", color:"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>Edit</button>
                  <button onClick={function(){ if(window.confirm("Delete this expense?")) { onDeleteExpense && onDeleteExpense(e.id); } }}
                    style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"4px 8px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>✕</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ============================================================
// SECTION 15: REPORT & DAY CLOSING
// Lines: ReportPreview, SCard, OrderRow, DayClosingTab, DriverReportTab
// Fix report PDF/download issues here
// ============================================================
/*  Report Preview - native React (no iframe, no popup)  */
function SCard({ label, value, color, bg }) {
  return (
    <div style={{ background:bg, borderRadius:10, padding:"10px 14px", flex:1, minWidth:100, borderLeft:"3px solid "+color }}>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:color, fontSize:20, fontWeight:800 }}>{value}</div>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#64748B", fontSize:11, marginTop:2 }}>{label}</div>
    </div>
  );
}

function OrderRow({ o, i, statusBg, statusColor }) {
  const isEx = isExchange(o.paymentType)||isExchange(o.originalPaymentType);
  const st   = isEx?"exchange":o.status;
  return (
    <div style={{ display:"flex", gap:6, padding:"7px 10px", background:i%2===0?"#fff":"#F8FAFC", fontSize:10.5, color:"#334155", alignItems:"center" }}>
      <span style={{ color:"#94A3B8", minWidth:52, flexShrink:0 }}>{o.date||""}</span>
      <span style={{ fontWeight:700, minWidth:68, flexShrink:0, color:"#090B10" }}>{"#"+o.invoiceNo}</span>
      <span style={{ flex:2, minWidth:90, color:"#1e293b" }}>{o.customer}</span>
      <span style={{ minWidth:56, flexShrink:0, fontWeight:o.onlineOrderNo?700:400, color:o.onlineOrderNo?"#FF5A1F":"#94A3B8" }}>{o.onlineOrderNo||"—"}</span>
      <span style={{ fontWeight:700, minWidth:70, flexShrink:0, color:"#090B10" }}>{"KD "+Number(o.total).toFixed(3)}</span>
      {(o.extraAmount > 0) && <span style={{ fontWeight:700, minWidth:56, flexShrink:0, color:"#EA580C" }}>{"+"+Number(o.extraAmount).toFixed(3)}</span>}
      <span style={{ minWidth:72, flexShrink:0, color:"#475569", fontSize:10 }}>{o.paymentType}</span>
      <span style={{ background:statusBg[st], color:statusColor[st], borderRadius:20, padding:"2px 8px", fontWeight:700, fontSize:10, whiteSpace:"nowrap", flexShrink:0 }}>
        {isEx?"Exchange":o.status.charAt(0).toUpperCase()+o.status.slice(1)}
      </span>
      {(o.note || o.extraAmount > 0) && (
        <span style={{ color:"#94A3B8", fontStyle:"italic", flex:1, fontSize:10 }}>
          {o.extraAmount > 0 ? "⚡ KD "+Number(o.extraAmount).toFixed(3)+(o.note?" | "+o.note:"") : o.note}
        </span>
      )}
    </div>
  );
}


function smartTime(isoStr) {
  if (!isoStr) return "";
  var d = new Date(isoStr);
  var now = new Date();
  var today = now.toDateString();
  var yesterday = new Date(now - 86400000).toDateString();
  var time = d.toLocaleTimeString("en-KW", { hour:"2-digit", minute:"2-digit" });
  if (d.toDateString() === today) return "Today " + time;
  if (d.toDateString() === yesterday) return "Yesterday " + time;
  return d.toLocaleDateString("en-KW", { weekday:"short", day:"numeric", month:"short" }) + " " + time;
}

function ReportPreview({ data, onClose }) {
  const { drvName, myOrders, deliveredOrds, cancelledOrds, postponedOrds, pendingOrds,
          exchangeOrds, nonExDel, orderedStores, collectionRows, comm,
          myExpenses, totalExpAmt, successRate } = data;
  const date = new Date().toLocaleDateString("en-KW", { day:"numeric", month:"long", year:"numeric" });
  const grandTotal = collectionRows.reduce((a,r)=>a+r.amt,0);

  const statusColor = { delivered:"#059669", cancelled:"#DC2626", postponed:"#7C3AED", pending:"#D97706", exchange:"#6B7280" };
  const statusBg    = { delivered:"#DCFCE7", cancelled:"#FEE2E2", postponed:"#EDE9FE", pending:"#FEF3C7", exchange:"#F1F5F9" };

  // Shared print CSS
  const printCSS = `
    @page{size:A4 portrait;margin:10mm 12mm}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:9.5px;color:#1e293b;margin:0;padding:0;background:#fff}
    .no-break{page-break-inside:avoid}
    section{page-break-inside:avoid;margin-bottom:10px}
  `;

  function openPrint() {
    var pri = document.getElementById("report-print-area");
    if (!pri) return;
    var now = new Date();
    var dd = String(now.getDate()).padStart(2,"0");
    var mm = String(now.getMonth()+1).padStart(2,"0");
    var yy = String(now.getFullYear()).slice(2);
    var fileName = "Report " + drvName + " " + dd + "-" + mm + "-" + yy;
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+fileName+'</title><style>'+printCSS+'</style></head><body style="padding:8px">' + pri.innerHTML + '<script>window.onload=function(){document.title="'+fileName+'";setTimeout(function(){window.print();},200);}<\/script></body></html>';
    var blob = new Blob([html],{type:"text/html;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    // Also set the parent page title so browser uses it as PDF filename
    var origTitle = document.title;
    document.title = fileName;
    var ifr = document.createElement("iframe");
    ifr.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:21cm;height:29.7cm;border:none";
    document.body.appendChild(ifr);
    ifr.onload = function(){
      try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch(e){}
      setTimeout(function(){
        document.body.removeChild(ifr);
        URL.revokeObjectURL(url);
        document.title = origTitle;
      }, 4000);
    };
    ifr.src = url;
  }

  return (
    <div style={{ position:"absolute", inset:0, zIndex:999, background:"#F1F5F9", display:"flex", flexDirection:"column", overflowY:"auto" }}>

      {/* Action bar */}
      <div style={{ position:"sticky", top:0, zIndex:10, background:"#1E293B", padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, flexWrap:"wrap", gap:8, borderBottom:"1px solid rgba(255,90,31,.3)" }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:700 }}>
          <span style={{ color:"#FF5A1F" }}>DELIVER</span>FLOW · Daily Report · {drvName}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={openPrint} style={{ background:"rgba(255,90,31,.15)", border:"1px solid rgba(255,90,31,.4)", borderRadius:8, padding:"6px 14px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>🖨 Print A4</button>
          <button onClick={openPrint} style={{ background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.4)", borderRadius:8, padding:"6px 14px", color:"#10B981", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>⬇ Save as PDF</button>
          <button onClick={onClose} style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8, padding:"6px 14px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>✕ Close</button>
        </div>
      </div>

      {/* Printable area */}
      <div id="report-print-area" style={{ padding:"16px 16px 48px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#1e293b", maxWidth:820, margin:"0 auto", width:"100%" }}>

        {/* ── HEADER with logo ── */}
        <div style={{ background:"#1E293B", borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
          {/* Logo + brand */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, background:"linear-gradient(135deg,#FF7A45,#FF3D00)", borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg viewBox="0 0 200 200" width={28} height={28}>
                <polygon points="100,42 154,73 100,104 46,73" fill="white"/>
                <polygon points="46,73 100,104 100,162 46,131" fill="rgba(255,255,255,0.55)"/>
                <polygon points="154,73 100,104 100,162 154,131" fill="rgba(255,255,255,0.32)"/>
                <polygon points="100,42 106,46 106,100 100,104 94,100 94,46" fill="rgba(255,255,255,0.22)"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:20, fontWeight:800, letterSpacing:-0.5, lineHeight:1 }}>
                <span style={{ color:"#FF5A1F" }}>DELIVER</span><span style={{ color:"#fff" }}>FLOW</span>
              </div>
              <div style={{ color:"rgba(255,255,255,.45)", fontSize:10, marginTop:3, letterSpacing:0.5 }}>AMTEL TELECOM FOR GENERAL TRADING CO.</div>
            </div>
          </div>
          {/* Report info */}
          <div style={{ textAlign:"right", lineHeight:1.7 }}>
            <div style={{ color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Daily Delivery Report</div>
            <div style={{ color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:14, fontWeight:700 }}>{drvName}</div>
            <div style={{ color:"rgba(255,255,255,.5)", fontSize:10 }}>{date}</div>
            <div style={{ color:"rgba(255,255,255,.4)", fontSize:10 }}>Generated: {new Date().toLocaleTimeString("en-KW",{hour:"2-digit",minute:"2-digit"})}</div>
          </div>
        </div>

        {/* ── SUMMARY CARDS ── */}
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:1, textTransform:"uppercase", borderBottom:"2px solid #FF5A1F", paddingBottom:3, marginBottom:10 }}>Order Summary</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
          <SCard label="Total Orders"  value={myOrders.length}        color="#0F172A" bg="#F1F5F9" />
          <SCard label="Delivered"     value={deliveredOrds.length}   color="#059669" bg="#DCFCE7" />
          <SCard label="Cancelled"     value={cancelledOrds.length}   color="#DC2626" bg="#FEE2E2" />
          <SCard label="Postponed"     value={postponedOrds.length}   color="#7C3AED" bg="#EDE9FE" />
          <SCard label="Success Rate"  value={successRate+"%"}        color="#FF5A1F" bg="#FFF7ED" />
        </div>

        {/* ── COLLECTION SUMMARY ── */}
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:1, textTransform:"uppercase", borderBottom:"2px solid #FF5A1F", paddingBottom:3, marginBottom:10 }}>Collection Summary</div>
        <div style={{ background:"#fff", borderRadius:10, border:"1px solid #E2E8F0", overflow:"hidden", marginBottom:14, pageBreakInside:"avoid" }}>
          {collectionRows.map(function(r,i){
            return (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", background:i%2===0?"#fff":"#F8FAFC", borderBottom:"1px solid #F1F5F9" }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, color:"#475569" }}>{r.label}</span>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:13, fontWeight:700, color:"#0F172A" }}>KD {r.amt.toFixed(3)}</span>
              </div>
            );
          })}
          {collectionRows.length > 0 && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#1E293B" }}>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, color:"#fff" }}>TOTAL COLLECTED</span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:15, fontWeight:800, color:"#FF5A1F" }}>KD {grandTotal.toFixed(3)}</span>
            </div>
          )}
          {(function(){
            var cashAmt = collectionRows.find(function(r){ return r.label && r.label.toLowerCase().includes("cash"); });
            var cashOnly = cashAmt ? cashAmt.amt : 0;
            var cashAfterExp = cashOnly - totalExpAmt;
            if (cashOnly === 0 && totalExpAmt === 0) return null;
            return (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#FF5A1F", borderTop:"2px solid #FF3D00" }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, color:"#fff", letterSpacing:0.5 }}>NET CASH TO RETURN</span>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:15, fontWeight:800, color:"#fff" }}>KD {cashAfterExp.toFixed(3)}</span>
              </div>
            );
          })()}
        </div>
        {exchangeOrds.length > 0 && (
          <div style={{ background:"#F1F5F9", borderRadius:8, padding:"7px 12px", fontSize:11, color:"#6B7280", marginBottom:10 }}>
            🔄 <strong>{exchangeOrds.length} Exchange order(s)</strong> — No cash collection required
          </div>
        )}

        {/* ── BILL-WISE DETAILS ── */}
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:1, textTransform:"uppercase", borderBottom:"2px solid #FF5A1F", paddingBottom:3, marginBottom:10, marginTop:16 }}>Bill-wise Details</div>

        {/* Table header */}
        <div style={{ display:"flex", gap:6, padding:"7px 10px", background:"#1E293B", borderRadius:"8px 8px 0 0", marginBottom:2 }}>
          {[["Date",52],["Invoice",68],["Customer","2fr"],["OO No.",56],["Total KD",70],["Payment",72],["Status",80],["Note","1fr"]].map(function(h){
            return <span key={h[0]} style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:9.5, fontWeight:700, textTransform:"uppercase", minWidth:typeof h[1]==="number"?h[1]:undefined, flex:typeof h[1]==="string"?h[1]:undefined, flexShrink:0 }}>{h[0]}</span>;
          })}
        </div>

        {orderedStores.map(function(store) {
          var allStoreOrds = myOrders.filter(function(o){ return o.store===store; });
          if (!allStoreOrds.length) return null;
          var sDelOrds  = allStoreOrds.filter(function(o){ return o.status==="delivered" && !isExchange(o.paymentType) && !isExchange(o.originalPaymentType); });
          var sExOrds   = allStoreOrds.filter(function(o){ return isExchange(o.paymentType)||isExchange(o.originalPaymentType); });
          var sCancOrds = allStoreOrds.filter(function(o){ return o.status==="cancelled"; });
          var sPostOrds = allStoreOrds.filter(function(o){ return o.status==="postponed"; });
          var sPendOrds = allStoreOrds.filter(function(o){ return o.status==="pending"; });
          var sCash  = sDelOrds.filter(function(o){ return o.paymentType==="Cash"||o.paymentType==="COD"; }).reduce(function(a,o){ return a+Number(o.total); },0);
          var sKnet  = sDelOrds.filter(function(o){ return o.paymentType==="KNET"||o.paymentType==="Tap/KNET"; }).reduce(function(a,o){ return a+Number(o.total); },0);
          var sDeema = sDelOrds.filter(function(o){ return o.paymentType==="Deema"; }).reduce(function(a,o){ return a+Number(o.total); },0);
          var sTabby = sDelOrds.filter(function(o){ return o.paymentType==="Tabby"; }).reduce(function(a,o){ return a+Number(o.total); },0);
          var sTaly  = sDelOrds.filter(function(o){ return o.paymentType==="Taly"; }).reduce(function(a,o){ return a+Number(o.total); },0);
          var sVisa  = sDelOrds.filter(function(o){ return o.paymentType==="VISA/Mastercard"; }).reduce(function(a,o){ return a+Number(o.total); },0);
          var sLink  = sDelOrds.filter(function(o){ return o.paymentType==="GoCollect"||o.paymentType?.includes("Link")||o.paymentType?.includes("WAMD"); }).reduce(function(a,o){ return a+Number(o.total); },0);
          var sExtra = allStoreOrds.filter(function(o){ return o.extraAmount>0; }).reduce(function(a,o){ return a+Number(o.extraAmount||0); },0);
          var sTotal = sCash+sKnet+sDeema+sTabby+sTaly+sVisa+sLink;
          return (
            <div key={store} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, overflow:"hidden", marginBottom:10, pageBreakInside:"avoid" }}>
              <div style={{ background:"#1E293B", padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontWeight:700, fontSize:12 }}>{store}</span>
                <span style={{ color:"rgba(255,255,255,.45)", fontSize:10 }}>
                  {sDelOrds.length} delivered{sCancOrds.length>0?" · "+sCancOrds.length+" cancelled":""}{sPostOrds.length>0?" · "+sPostOrds.length+" postponed":""}{sPendOrds.length>0?" · "+sPendOrds.length+" pending":""}{sExOrds.length>0?" · "+sExOrds.length+" exchange":""}
                </span>
              </div>
              {sDelOrds.length>0 && (<div><div style={{ background:"#DCFCE7", padding:"3px 10px", color:"#059669", fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Delivered</div>{sDelOrds.map(function(o,i){ return <OrderRow key={o.invoiceNo} o={o} i={i} statusBg={statusBg} statusColor={statusColor} />; })}</div>)}
              {sExOrds.length>0 && (<div><div style={{ background:"#F1F5F9", padding:"3px 10px", color:"#6B7280", fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Exchange</div>{sExOrds.map(function(o,i){ return <OrderRow key={o.invoiceNo} o={o} i={i} statusBg={statusBg} statusColor={statusColor} />; })}</div>)}
              {sCancOrds.length>0 && (<div><div style={{ background:"#FEE2E2", padding:"3px 10px", color:"#DC2626", fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Cancelled</div>{sCancOrds.map(function(o,i){ return <OrderRow key={o.invoiceNo} o={o} i={i} statusBg={statusBg} statusColor={statusColor} />; })}</div>)}
              {sPostOrds.length>0 && (<div><div style={{ background:"#EDE9FE", padding:"3px 10px", color:"#7C3AED", fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Postponed</div>{sPostOrds.map(function(o,i){ return <OrderRow key={o.invoiceNo} o={o} i={i} statusBg={statusBg} statusColor={statusColor} />; })}</div>)}
              {sPendOrds.length>0 && (<div><div style={{ background:"#FEF3C7", padding:"3px 10px", color:"#D97706", fontSize:9.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Pending (Not Delivered)</div>{sPendOrds.map(function(o,i){ return <OrderRow key={o.invoiceNo} o={o} i={i} statusBg={statusBg} statusColor={statusColor} />; })}</div>)}
              {/* Store payment breakdown */}
              <div style={{ background:"#F8FAFC", padding:"8px 12px", borderTop:"1px solid #E2E8F0", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 14px" }}>
                  {sCash>0  && <span style={{ fontSize:10, color:"#059669" }}>Cash <strong>KD {sCash.toFixed(3)}</strong></span>}
                  {sKnet>0  && <span style={{ fontSize:10, color:"#1B3A8C" }}>KNET <strong>KD {sKnet.toFixed(3)}</strong></span>}
                  {sDeema>0 && <span style={{ fontSize:10, color:"#C0596A" }}>Deema <strong>KD {sDeema.toFixed(3)}</strong></span>}
                  {sTabby>0 && <span style={{ fontSize:10, color:"#059669" }}>Tabby <strong>KD {sTabby.toFixed(3)}</strong></span>}
                  {sTaly>0  && <span style={{ fontSize:10, color:"#2D6FD4" }}>Taly <strong>KD {sTaly.toFixed(3)}</strong></span>}
                  {sVisa>0  && <span style={{ fontSize:10, color:"#1E2D6B" }}>VISA/MC <strong>KD {sVisa.toFixed(3)}</strong></span>}
                  {sLink>0  && <span style={{ fontSize:10, color:"#7C3AED" }}>Link <strong>KD {sLink.toFixed(3)}</strong></span>}
                  {sExtra>0 && <span style={{ fontSize:10, color:"#EA580C" }}>⚡ Extra <strong>KD {sExtra.toFixed(3)}</strong></span>}
                </div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:11, fontWeight:700, color:"#0F172A" }}>
                  Store Total: KD {(sTotal+sExtra).toFixed(3)}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── COMMISSION & EXPENSES ── */}
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:10, fontWeight:700, color:"#64748B", letterSpacing:1, textTransform:"uppercase", borderBottom:"2px solid #FF5A1F", paddingBottom:3, marginBottom:10, marginTop:16 }}>Commission &amp; Expenses</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
          <SCard label={comm.earned?"Commission ("+comm.eligible+" orders × KD 0.250)":"Commission (not yet earned)"} value={comm.earned?"KD "+comm.amount.toFixed(3):"-"} color={comm.earned?"#059669":"#D97706"} bg={comm.earned?"#DCFCE7":"#FEF3C7"} />
          <SCard label="Vehicle Expenses" value={totalExpAmt>0?"- KD "+totalExpAmt.toFixed(3):"None"} color="#DC2626" bg="#FEE2E2" />
          <SCard label="Net Total (Collected + Comm − Exp)" value={"KD "+(grandTotal+(comm.earned?comm.amount:0)-totalExpAmt).toFixed(3)} color="#FF5A1F" bg="#FFF7ED" />
        </div>

        {myExpenses.length > 0 && (
          <div style={{ background:"#fff", borderRadius:10, overflow:"hidden", border:"1px solid #E2E8F0", marginBottom:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr auto", background:"#1E293B", padding:"7px 14px" }}>
              {["Type","Amount","Note","Time"].map(function(h){ return <span key={h} style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:9.5, fontWeight:700, textTransform:"uppercase" }}>{h}</span>; })}
            </div>
            {myExpenses.map(function(e,i){
              return (
                <div key={e.id||i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr auto", padding:"7px 14px", background:i%2===0?"#fff":"#F8FAFC", borderTop:"1px solid #F1F5F9", fontSize:11 }}>
                  <span style={{ fontWeight:600, color:"#DC2626" }}>{e.type}</span>
                  <span style={{ fontWeight:700, color:"#DC2626" }}>- KD {Number(e.amount).toFixed(3)}</span>
                  <span style={{ color:"#64748B" }}>{e.note||"-"}</span>
                  <span style={{ color:"#94A3B8", fontSize:10 }}>{new Date(e.createdAt).toLocaleTimeString("en-KW",{hour:"2-digit",minute:"2-digit"})}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ marginTop:24, paddingTop:12, borderTop:"2px solid #FF5A1F", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:24, height:24, background:"linear-gradient(135deg,#FF7A45,#FF3D00)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg viewBox="0 0 200 200" width={14} height={14}>
                <polygon points="100,42 154,73 100,104 46,73" fill="white"/>
                <polygon points="46,73 100,104 100,162 46,131" fill="rgba(255,255,255,0.6)"/>
                <polygon points="154,73 100,104 100,162 154,131" fill="rgba(255,255,255,0.35)"/>
              </svg>
            </div>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:11, fontWeight:700 }}>
              <span style={{ color:"#FF5A1F" }}>DELIVER</span>FLOW
            </span>
            <span style={{ fontSize:10, color:"#94A3B8" }}>· AMTEL TELECOM FOR GENERAL TRADING CO.</span>
          </div>
          <span style={{ fontSize:10, color:"#94A3B8" }}>{myOrders.length} orders · {date}</span>
        </div>

      </div>
    </div>
  );
}

/*  Driver Report Tab  */
function Stat({ l, v, c, icon }) {
  return (
    <div style={{ background:c+"10", border:"1px solid "+c+"25", borderRadius:14, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
      <div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}>{icon} {l}</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:c, fontSize:22, fontWeight:800, marginTop:2 }}>{v}</div>
      </div>
    </div>
  );
}


const STORE_WA_NUMBERS = {
  "Trikart Online":  "96567721953",
  "Webstore Online": "96567682323",
  "ReStore Online":  "96567721947",
};

function DayClosingTab({ orders, driverId, driverName }) {
  const _todayStr = new Date().toDateString();
  const myOrders = orders.filter(function(o) {
    if (o.driverId !== driverId) return false;
    var d = o.assignedDate || o.date || "";
    var p = d.split("/");
    if (p.length === 3) {
      var dt = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
      return dt.toDateString() === _todayStr;
    }
    return false;
  });
  const stores = ["Trikart Online", "Webstore Online", "ReStore Online"].filter(function(s){
    return myOrders.some(function(o){ return o.store === s; });
  });
  const [sentStores, setSentStores] = useState({});

  function getStoreStats(store) {
    var storeOrders = myOrders.filter(function(o){ return o.store === store; });
    var delivered  = storeOrders.filter(function(o){ return o.status === "delivered" && !isExchange(o.paymentType) && !isExchange(o.originalPaymentType); });
    var exchange   = storeOrders.filter(function(o){ return o.status === "delivered" && (isExchange(o.paymentType) || isExchange(o.originalPaymentType)); });
    var cancelled  = storeOrders.filter(function(o){ return o.status === "cancelled"; });
    var postponed  = storeOrders.filter(function(o){ return o.status === "postponed"; });
    var pending    = storeOrders.filter(function(o){ return o.status === "pending"; });
    var totalAmt   = delivered.reduce(function(a,o){ return a + Number(o.total); }, 0);
    var cashAmt    = delivered.filter(function(o){ return o.paymentType==="Cash"||o.paymentType==="COD"; }).reduce(function(a,o){ return a+Number(o.total); },0);
    var onlineAmt  = totalAmt - cashAmt;
    return { storeOrders, delivered, exchange, cancelled, postponed, pending, totalAmt, cashAmt, onlineAmt };
  }

  function buildMessage(store, stats) {
    var date = new Date().toLocaleDateString("en-KW",{day:"numeric",month:"long",year:"numeric"});
    var lines = [
      "*DAY CLOSING REPORT*",
      "*" + store + "*",
      "*Driver:* " + driverName,
      "*Date:* " + date,
      "------------------------",
      "*Delivered:* " + stats.delivered.length,
      "*Exchange:* " + stats.exchange.length,
      "*Postponed:* " + stats.postponed.length,
      "*Cancelled:* " + stats.cancelled.length,
      "*Pending:* " + stats.pending.length,
      "------------------------",
      "*COLLECTION SUMMARY*",
      "*Cash (COD):* KD " + stats.cashAmt.toFixed(3),
      "*Online/Link:* KD " + stats.onlineAmt.toFixed(3),
      "*Total:* KD " + stats.totalAmt.toFixed(3),
    ];
    return lines.join("\n");
  }

  function getWAUrl(store, stats) {
    var waNum = STORE_WA_NUMBERS[store];
    if (!waNum) return null;
    var msg = buildMessage(store, stats);
    return "https://wa.me/" + waNum + "?text=" + encodeURIComponent(msg);
  }
  function sendWhatsApp(store, stats) {
    var url = getWAUrl(store, stats);
    if (!url) return;
    setSentStores(function(prev){ var n={...prev}; n[store]=true; return n; });
    window.open(url, "_blank", "noopener");
  }

  function sendAllWhatsApp() {
    // Open stores one by one with delay - user must allow popups for multiple
    stores.forEach(function(store, idx) {
      setTimeout(function() {
        var stats = getStoreStats(store);
        var waNum = STORE_WA_NUMBERS[store];
        if (!waNum) return;
        var msg = buildMessage(store, stats);
        var url = "https://wa.me/" + waNum + "?text=" + encodeURIComponent(msg);
        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSentStores(function(prev){ var n={...prev}; n[store]=true; return n; });
      }, idx * 1200);
    });
  }

  if (myOrders.length === 0) {
    return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, padding:32 }}>
        <span style={{ fontSize:40 }}>📭</span>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:16 }}>No orders to close today</div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 80px" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,rgba(16,185,129,.12),rgba(0,212,255,.08))", border:"1px solid rgba(16,185,129,.25)", borderRadius:16, padding:"16px 18px", marginBottom:16 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:16, fontWeight:800, marginBottom:4 }}>Day Closing</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}>
          Send closing reports to each store via WhatsApp
        </div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:4 }}>
          {new Date().toLocaleDateString("en-KW",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
      </div>

      {/* Overall summary */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:6, marginBottom:16 }}>
        {[
          { label:"Delivered", value:myOrders.filter(function(o){ return o.status==="delivered"; }).length, color:"#10B981" },
          { label:"Pending",   value:myOrders.filter(function(o){ return o.status==="pending"; }).length,   color:"#F59E0B" },
          { label:"Postponed", value:myOrders.filter(function(o){ return o.status==="postponed"; }).length, color:"#8B5CF6" },
          { label:"Cancelled", value:myOrders.filter(function(o){ return o.status==="cancelled"; }).length, color:"#EF4444" },
          { label:"Exchange",  value:myOrders.filter(function(o){ return isExchange(o.paymentType)||isExchange(o.originalPaymentType); }).length, color:"#9CA3AF" },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:s.color, fontSize:20, fontWeight:800 }}>{s.value}</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginTop:2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Per-store cards */}
      {stores.map(function(store) {
        var stats = getStoreStats(store);
        var waNum = STORE_WA_NUMBERS[store];
        var isSent = sentStores[store];
        var storeColor = store==="Trikart Online"?"#F59E0B":store==="Webstore Online"?"#00D4FF":"#A78BFA";
        return (
          <div key={store} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:"16px", marginBottom:12 }}>
            {/* Store header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:storeColor, fontSize:14, fontWeight:700 }}>{store}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:2 }}>WA: +{waNum}</div>
              </div>
              {isSent && (
                <span style={{ background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.3)", borderRadius:20, padding:"2px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#10B981", fontSize:11 }}>
                  ✓ Sent
                </span>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:8 }}>
              {[
                { label:"Delivered", value:stats.delivered.length, color:"#10B981" },
                { label:"Exchange",  value:stats.exchange.length,  color:"#9CA3AF" },
                { label:"Postponed", value:stats.postponed.length, color:"#8B5CF6" },
                { label:"Cancelled", value:stats.cancelled.length, color:"#EF4444" },
                { label:"Pending",   value:stats.pending.length,   color:"#F59E0B" },
                { label:"Total KD",  value:"KD "+stats.totalAmt.toFixed(3), color:"#FF5A1F", small:true },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{ background:"rgba(255,255,255,.03)", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:s.color, fontSize:s.small?11:16, fontWeight:700, lineHeight:1.2 }}>{s.value}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:9, marginTop:2 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Collection breakdown */}
            <div style={{ background:"rgba(255,255,255,.03)", borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>💵 Cash COD</span>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#F59E0B", fontSize:12, fontWeight:700 }}>KD {stats.cashAmt.toFixed(3)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>💳 Online/Link</span>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:12, fontWeight:700 }}>KD {stats.onlineAmt.toFixed(3)}</span>
              </div>
            </div>

            {/* Send button - use <a> tag for reliable mobile WA opening */}
            <a href={getWAUrl(store, stats) || "#"}
              target="_blank" rel="noopener noreferrer"
              onClick={function(){ setSentStores(function(prev){ var n={...prev}; n[store]=true; return n; }); }}
              style={{ width:"100%", background:"linear-gradient(135deg,#25D366,#128C7E)", border:"none", borderRadius:12, padding:"13px", display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", textDecoration:"none", boxSizing:"border-box" }}>
              <span style={{ fontSize:18 }}>💬</span>
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:700 }}>
                {isSent ? "Resend to " + store : "Send Report to " + store}
              </span>
            </a>
          </div>
        );
      })}

      {/* Send all button */}
      {stores.length > 1 && (
        <button onClick={sendAllWhatsApp}
          style={{ width:"100%", background:"rgba(37,211,102,.1)", border:"1px solid rgba(37,211,102,.3)", borderRadius:12, padding:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", marginTop:4 }}>
          <span style={{ fontSize:18 }}>📤</span>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#25D366", fontSize:13, fontWeight:700 }}>Send All Reports</span>
        </button>
      )}
    </div>
  );
}

function DriverReportTab({ orders, driverId, expenses, onOpenReport }) {
  const myOrders    = orders.filter(o => o.driverId === driverId);
  const delivered   = myOrders.filter(o => o.status === "delivered");
  const cancelled   = myOrders.filter(o => o.status === "cancelled");
  const postponed   = myOrders.filter(o => o.status === "postponed");
  const pending     = myOrders.filter(o => o.status === "pending" && !o.scanned);
  const exchangeOrders = myOrders.filter(o => isExchange(o.paymentType) || isExchange(o.originalPaymentType));
  const nonExchange = delivered.filter(o => !isExchange(o.paymentType) && !isExchange(o.originalPaymentType));
  const cod         = nonExchange.filter(o => (o.paymentType === "Cash" || o.paymentType === "COD") && !o.originalPaymentType).reduce((a,o) => a+Number(o.total), 0);
  const codConverted = nonExchange.filter(o => o.originalPaymentType && (o.originalPaymentType==="Cash"||o.originalPaymentType==="COD")).reduce((a,o) => a+Number(o.total), 0);
  const nonCash     = nonExchange.filter(o => o.paymentType !== "Cash" && o.paymentType !== "COD" && !o.originalPaymentType).reduce((a,o) => a+Number(o.total), 0);
  const rate        = myOrders.length > 0 ? Math.round(delivered.length/myOrders.length*100) : 0;
  const totalExpenses = (expenses||[]).reduce((a,e)=>a+Number(e.amount),0);
  const commission    = calcCommission(nonExchange.length); // exchange orders excluded
  const [showExchangeList, setShowExchangeList] = useState(false);


  function buildReportData() {
    const drvName      = DRIVERS.find(d => d.id === driverId)?.name || driverId;
    const _todayStr    = new Date().toDateString();
    const myExpenses   = (expenses || []).filter(function(e) {
      if (!e.createdAt) return true; // keep if no date (legacy)
      return new Date(e.createdAt).toDateString() === _todayStr;
    });
    const deliveredOrds = myOrders.filter(o => o.status === "delivered");
    const cancelledOrds = myOrders.filter(o => o.status === "cancelled");
    const postponedOrds = myOrders.filter(o => o.status === "postponed");
    const pendingOrds   = myOrders.filter(o => o.status === "pending");
    const exchangeOrds  = myOrders.filter(o => isExchange(o.paymentType) || isExchange(o.originalPaymentType));
    const nonExDel      = deliveredOrds.filter(o => !isExchange(o.paymentType) && !isExchange(o.originalPaymentType));
    const comm          = calcCommission(nonExDel.length);
    const totalExpAmt   = myExpenses.reduce((a,e)=>a+Number(e.amount),0);
    const STORE_ORDER   = ["Trikart Online","ReStore Online","Webstore Online"];
    const allStores     = [...new Set(myOrders.map(o=>o.store).filter(Boolean))];
    const orderedStores = [...STORE_ORDER.filter(s=>allStores.includes(s)), ...allStores.filter(s=>!STORE_ORDER.includes(s))];
    const collectionRows = [
      { label:"Cash in Hand (COD)",  amt: nonExDel.filter(o=>(o.paymentType==="Cash"||o.paymentType==="COD")&&!o.originalPaymentType).reduce((a,o)=>a+Number(o.total),0) },
      { label:"KNET",                amt: nonExDel.filter(o=>o.paymentType==="KNET").reduce((a,o)=>a+Number(o.total),0) },
      { label:"VISA / Mastercard",   amt: nonExDel.filter(o=>o.paymentType==="VISA/Mastercard").reduce((a,o)=>a+Number(o.total),0) },
      { label:"Deema",               amt: nonExDel.filter(o=>o.paymentType==="Deema").reduce((a,o)=>a+Number(o.total),0) },
      { label:"Tabby",               amt: nonExDel.filter(o=>o.paymentType==="Tabby").reduce((a,o)=>a+Number(o.total),0) },
      { label:"Taly",                amt: nonExDel.filter(o=>o.paymentType==="Taly").reduce((a,o)=>a+Number(o.total),0) },
      { label:"GoCollect (Link)",    amt: nonExDel.filter(o=>o.paymentType?.includes("GoCollect")).reduce((a,o)=>a+Number(o.total),0) },
      { label:"Trikart Link",        amt: nonExDel.filter(o=>o.paymentType?.includes("Trikart Link")).reduce((a,o)=>a+Number(o.total),0) },
      { label:"WAMD (Link)",         amt: nonExDel.filter(o=>o.paymentType?.includes("WAMD")).reduce((a,o)=>a+Number(o.total),0) },
      { label:"Split (Cash+Link)",   amt: nonExDel.filter(o=>o.paymentType?.startsWith("Split")).reduce((a,o)=>a+Number(o.total),0) },
      { label:"⚡ Extra Collected",   amt: myOrders.filter(o=>o.extraAmount>0).reduce((a,o)=>a+Number(o.extraAmount||0),0) },
    ].filter(r => r.amt > 0);
    return { drvName, myOrders, deliveredOrds, cancelledOrds, postponedOrds, pendingOrds, exchangeOrds, nonExDel, orderedStores, collectionRows, comm, myExpenses, totalExpAmt, successRate: myOrders.length>0?Math.round(deliveredOrds.length/myOrders.length*100):0 };
  }




  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 16px 80px" }}>
      {/* Summary hero */}
      <div style={{ background:"linear-gradient(135deg,rgba(0,212,255,.1),rgba(124,58,237,.1))", border:"1px solid rgba(0,212,255,.2)", borderRadius:20, padding:20, marginBottom:14, textAlign:"center" }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:13 }}>Today&apos;s Summary   {new Date().toLocaleDateString("en-KW")}</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:46, fontWeight:800, lineHeight:1 }}>{myOrders.length}</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:13, marginTop:4 }}>Total Orders Assigned</div>
        <div style={{ marginTop:10, background:"rgba(255,255,255,.08)", borderRadius:30, height:6, overflow:"hidden" }}>
          <div style={{ height:"100%", width:(rate) + "%", background:"linear-gradient(90deg,#10B981,#00D4FF)", borderRadius:30, transition:"width 1s ease" }} />
        </div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#10B981", fontSize:12, marginTop:4 }}>{rate}% success rate</div>
      </div>

      {/* Delivery stats */}
      <Stat l="Delivered" v={delivered.length} c="#10B981" icon="" />
      <Stat l="Cancelled"  v={cancelled.length}  c="#EF4444" icon="" />
      <Stat l="Postponed"  v={postponed.length}  c="#8B5CF6" icon="" />
      <Stat l="Still Pending" v={pending.length} c="#F59E0B" icon="" />

      {/* Payment collection stats */}
      <Stat l="Cash Collected (COD)"       v={fmt(cod)}         c="#F59E0B" icon="💵" />
      {codConverted > 0 && <Stat l="COD -> Link Payment" v={fmt(codConverted)} c="#A855F7" icon="🔗" />}
      <Stat l="Non-Cash (KNET/Online/etc)" v={fmt(nonCash)}     c="#00D4FF" icon="💳" />

      {/* Commission */}
      <CommissionCard deliveredCount={nonExchange.length} />

      {/* Vehicle Expenses */}
      {(expenses||[]).length > 0 && (
        <div style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}> Vehicle Expenses</div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:22, fontWeight:800, marginTop:2 }}>- {fmt(totalExpenses)}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {EXPENSE_TYPES.map(function(expT) {
              const amt = (expenses||[]).filter(e=>e.type===expT).reduce((a,e)=>a+Number(e.amount),0);
              if (!amt) return null;
              return <span key={expT} style={{ background:"rgba(239,68,68,.1)", borderRadius:20, padding:"2px 9px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#FCA5A5", fontSize:11 }}>{expT}: {fmt(amt)}</span>;
            })}
          </div>
        </div>
      )}

      {/*  Exchange Orders Section  */}
      <div style={{ background:"rgba(107,114,128,.08)", border:"1px solid rgba(107,114,128,.25)", borderRadius:16, marginBottom:14, overflow:"hidden" }}>
        <button onClick={() => setShowExchangeList(e => !e)}
          style={{ width:"100%", background:"none", border:"none", padding:"14px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}></span>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#9CA3AF", fontSize:14, fontWeight:700 }}>Exchange Orders</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>No cash collection - deliver &amp; exchange only</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#9CA3AF", fontSize:22, fontWeight:800 }}>{exchangeOrders.length}</span>
            <span style={{ color:"rgba(255,255,255,.3)", fontSize:12 }}>{showExchangeList ? "^" : "v"}</span>
          </div>
        </button>
        {showExchangeList && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"12px 14px" }}>
            {exchangeOrders.length === 0 ? (
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:13, textAlign:"center", padding:"12px 0" }}>No exchange orders today</div>
            ) : exchangeOrders.map((o, i) => (
              <div key={o.id||i} style={{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:"10px 12px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:600 }}>{o.customer}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}>#{o.invoiceNo}{o.onlineOrderNo?" · Online Order: "+o.onlineOrderNo:""} · {o.store}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:2 }}> {o.address?.slice(0,50)}{o.address?.length>50?"...":""}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11 }}> {o.phone}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#9CA3AF", fontSize:13, fontWeight:700 }}>{fmt(o.total)}</div>
                  <span style={{ background:"rgba(107,114,128,.2)", color:"#9CA3AF", borderRadius:20, padding:"2px 8px", fontSize:10, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontWeight:600 }}> Exchange</span>
                  <div style={{ marginTop:4 }}>
                    <Badge status={o.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button onClick={() => onOpenReport && onOpenReport(buildReportData())}
        style={{ width:"100%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", border:"none", borderRadius:14, padding:16, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <span style={{ fontSize:18 }}></span> Preview &amp; Share Report
      </button>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:12, textAlign:"center", marginBottom:16 }}>
        Full report opens inside the app - screenshot or share to save
      </div>
    </div>
  );
}
// ============================================================
// SECTION 16: SECURITY & AUTH
// Lines: generateSessionToken, validateSession, checkRateLimit
// Lines: performLogin, LoginScreen
// Fix login/auth issues here
// ============================================================
// ── Security helpers ────────────────────────────────────────────────────────
// Simple session token — stored alongside the role so localStorage tampering
// can be detected. Token is a hash of (userId + role + a device secret).
function generateSessionToken(id, role) {
  var secret = (function() {
    try {
      var s = localStorage.getItem("df_device_secret");
      if (!s) {
            try {
              var arr2 = new Uint8Array(24);
              crypto.getRandomValues(arr2);
              s = Array.from(arr2).map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
            } catch(e2) {
              s = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
            }
            localStorage.setItem("df_device_secret", s);
          }
      return s;
    } catch(e) { return "df_fallback_secret"; }
  })();
  var raw = id + "|" + role + "|" + secret;
  // Simple djb2 hash — not cryptographic but stops casual localStorage edits
  var h = 5381;
  for (var i = 0; i < raw.length; i++) { h = ((h << 5) + h) ^ raw.charCodeAt(i); h = h >>> 0; }
  return h.toString(36);
}
function validateSession(session) {
  if (!session || !session.id || !session.role || !session._tok) return null;
  var expected = generateSessionToken(session.id, session.role);
  if (session._tok !== expected) return null; // tampered
  return session;
}

// Rate limiter: max 5 attempts per 60 seconds per username
var _loginAttempts = {};
function checkRateLimit(u) {
  var now = Date.now();
  var key = u.toLowerCase().trim();
  if (!_loginAttempts[key]) _loginAttempts[key] = [];
  // Remove attempts older than 60 seconds
  _loginAttempts[key] = _loginAttempts[key].filter(function(t) { return now - t < 60000; });
  if (_loginAttempts[key].length >= 5) {
    var wait = Math.ceil((60000 - (now - _loginAttempts[key][0])) / 1000);
    return "Too many attempts. Try again in " + wait + "s.";
  }
  return null;
}
function recordFailedAttempt(u) {
  var key = u.toLowerCase().trim();
  if (!_loginAttempts[key]) _loginAttempts[key] = [];
  _loginAttempts[key].push(Date.now());
}
function clearAttempts(u) {
  delete _loginAttempts[u.toLowerCase().trim()];
}

function performLogin(u_raw, p_raw, setErr, onLogin) {
  if (!u_raw || !p_raw) { setErr("Enter username and password"); return; }
  var u = u_raw.toLowerCase().trim();
  var p = p_raw.trim();

  // Rate limit check
  var rateLimitMsg = checkRateLimit(u);
  if (rateLimitMsg) { setErr(rateLimitMsg); return; }

  // Load overridden passwords from localStorage
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem("df_passwords")); } catch(e) {}
  var pwds = stored || {};

  function doLogin(session) {
    clearAttempts(u);
    session._tok = generateSessionToken(session.id, session.role);
    onLogin(session);
  }
  function failLogin(msg) {
    recordFailedAttempt(u);
    // Uniform message — don't reveal whether username exists
    setErr(msg || "Incorrect username or password");
  }

  // Admin accounts — passwords NOT stored in file, only fallback if not set in DB
  var ADMIN_ACCOUNTS = [
    { id:"admin",  name:"Admin",  avatar:"AD" },
    { id:"irfan",  name:"Irfan",  avatar:"IR" },
    { id:"sahal",  name:"Sahal",  avatar:"SA" },
    { id:"ansar",  name:"Ansar",  avatar:"AN" },
    { id:"jusair", name:"Jusair", avatar:"JU" },
  ];
  for (var ai = 0; ai < ADMIN_ACCOUNTS.length; ai++) {
    var ac = ADMIN_ACCOUNTS[ai];
    if (u === ac.id || u === ac.name.toLowerCase()) {
      var acPwd = (pwds && pwds[ac.id]) || (ac.id + "123");
      if (p !== acPwd) { failLogin("Incorrect username or password"); return; }
      doLogin({ name:ac.name, id:ac.id, avatar:ac.avatar, role:"admin" });
      return;
    }
  }
  // Store admins
  for (var si = 0; si < STORE_ADMINS.length; si++) {
    var sa = STORE_ADMINS[si];
    if (sa.id === u || sa.name.toLowerCase() === u) {
      var saPwd = (pwds && pwds[sa.id]) || (sa.id + "123");
      if (p !== saPwd) { failLogin("Incorrect username or password"); return; }
      doLogin({ name:sa.name, id:sa.id, avatar:sa.avatar, role:"storeadmin", store:sa.store });
      return;
    }
  }
  // Drivers
  var found = null;
  for (var di = 0; di < DRIVERS.length; di++) {
    if (DRIVERS[di].name.toLowerCase() === u || DRIVERS[di].id === u) { found = DRIVERS[di]; break; }
  }
  if (!found) { failLogin("Incorrect username or password"); return; }
  var driverPwd = (pwds && pwds[found.id]) || (found.id + "123");
  if (p !== driverPwd) { failLogin("Incorrect username or password"); return; }
  doLogin({ name:found.name, id:found.id, avatar:found.avatar, status:found.status, vehicleType:found.vehicleType, role:"driver" });
}

function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [loading, setLoading] = useState(false);

  function doLogin() {
    setLoading(true);
    setTimeout(function() {
      performLogin(user, pass, function(e) { setErr(e); setLoading(false); }, onLogin);
    }, 300);
  }

  return (
    <div style={{ minHeight:"100dvh", height:"100dvh", background:"#090B10", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", position:"fixed", inset:0, overflow:"auto", WebkitOverflowScrolling:"touch" }}>

      {/* Background glow */}
      <div style={{ position:"absolute", top:"-20%", left:"50%", transform:"translateX(-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,90,31,.12) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-10%", right:"-10%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,61,0,.06) 0%, transparent 70%)", pointerEvents:"none" }} />

      {/* Logo block */}
      <div style={{ textAlign:"center", marginBottom:44 }}>
        {/* New logo — exact match to uploaded SVG */}
        <div style={{ display:"inline-flex", marginBottom:20 }}>
          <svg viewBox="0 0 200 200" width={80} height={80} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="og" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF5A1F"/>
                <stop offset="100%" stopColor="#FF3D00"/>
              </linearGradient>
            </defs>
            <rect width="200" height="200" rx="44" fill="url(#og)"/>
            {/* Isometric box — top face */}
            <polygon points="100,42 154,73 100,104 46,73" fill="white"/>
            {/* Left face */}
            <polygon points="46,73 100,104 100,162 46,131" fill="rgba(255,255,255,0.55)"/>
            {/* Right face */}
            <polygon points="154,73 100,104 100,162 154,131" fill="rgba(255,255,255,0.32)"/>
            {/* Tape stripe */}
            <polygon points="100,42 106,46 106,100 100,104 94,100 94,46" fill="rgba(255,255,255,0.22)"/>
          </svg>
        </div>

        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:900, fontSize:30, letterSpacing:"-0.5px", lineHeight:1, marginBottom:6 }}>
          <span style={{ color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700 }}>DELIVER</span><span style={{ color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700 }}>FLOW</span>
        </div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:11, letterSpacing:"3px", textTransform:"uppercase" }}>
          AMTEL TELECOM
        </div>
      </div>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:360, background:"#161B24", borderRadius:24, padding:"32px 28px", border:"1px solid rgba(255,255,255,.07)", boxShadow:"0 32px 64px rgba(0,0,0,.5)" }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:22, fontWeight:800, marginBottom:6 }}>Welcome back</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:13, marginBottom:28 }}>Sign in to your workspace</div>

        {/* Username */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, fontWeight:600, letterSpacing:"1px", textTransform:"uppercase", marginBottom:8 }}>Username</div>
          <input type="text" value={user}
            onChange={function(e){ setUser(e.target.value); setErr(""); }}
            onKeyDown={function(e){ if(e.key==="Enter") doLogin(); }}
            placeholder="Enter username"
            style={{ width:"100%", background:"#1F1F1F", border:"1.5px solid rgba(255,255,255,.08)", borderRadius:14, padding:"14px 16px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:15, outline:"none", boxSizing:"border-box", transition:"border-color .2s" }}
            onFocus={function(e){ e.target.style.borderColor="rgba(255,90,31,.6)"; }}
            onBlur={function(e){ e.target.style.borderColor="rgba(255,255,255,.08)"; }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:err?14:24 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, fontWeight:600, letterSpacing:"1px", textTransform:"uppercase", marginBottom:8 }}>Password</div>
          <input type="password" value={pass}
            onChange={function(e){ setPass(e.target.value); setErr(""); }}
            onKeyDown={function(e){ if(e.key==="Enter") doLogin(); }}
            placeholder="Enter password"
            style={{ width:"100%", background:"#1F1F1F", border:"1.5px solid rgba(255,255,255,.08)", borderRadius:14, padding:"14px 16px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:15, outline:"none", boxSizing:"border-box", transition:"border-color .2s" }}
            onFocus={function(e){ e.target.style.borderColor="rgba(255,90,31,.6)"; }}
            onBlur={function(e){ e.target.style.borderColor="rgba(255,255,255,.08)"; }}
          />
        </div>

        {err && (
          <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:10, padding:"10px 14px", marginBottom:18, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#EF4444", fontSize:13 }}>
            {err}
          </div>
        )}

        <button onClick={doLogin} disabled={loading}
          style={{ width:"100%", background:loading?"rgba(255,90,31,.5)":"linear-gradient(135deg,#FF7A45 0%,#FF3D00 100%)", border:"none", borderRadius:14, padding:"15px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:16, fontWeight:700, cursor:loading?"default":"pointer", letterSpacing:"0.3px", boxShadow:loading?"none":"0 8px 24px rgba(255,90,31,.35)", transition:"all .2s" }}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ textAlign:"center", marginTop:24, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.15)", fontSize:11 }}>
          DeliverFlow v3 · Built by <span style={{ color:"rgba(255,90,31,.5)" }}>Sulaiman</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTION 17B: LIVE DRIVER MAP
// Uses OpenStreetMap + Leaflet (free, no API key needed)
// ============================================================
function LiveMapTab({ onlineDrivers, activeDrivers, orders }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef({});
  const [mapReady, setMapReady] = useState(false);
  const [noLocation, setNoLocation] = useState(false);

  // Driver colors
  const DRIVER_COLORS = ["#FF5A1F","#38BDF8","#22C55E","#8B5CF6","#F59E0B","#EF4444"];

  useEffect(function() {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      var link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // Load Leaflet JS
    if (window.L) { setMapReady(true); return; }
    var script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = function() { setMapReady(true); };
    document.head.appendChild(script);
  }, []);

  useEffect(function() {
    if (!mapReady || !mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized
    var L = window.L;
    var map = L.map(mapRef.current, { zoomControl: true }).setView([29.3759, 47.9774], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, [mapReady]);

  // Update markers when driver locations change
  useEffect(function() {
    if (!mapInstanceRef.current || !window.L) return;
    var L = window.L;
    var map = mapInstanceRef.current;
    var driverIds = Object.keys(onlineDrivers || {});
    var hasAnyLocation = false;

    driverIds.forEach(function(dId, idx) {
      var info = onlineDrivers[dId];
      if (!info || !info.latitude || !info.longitude) return;
      hasAnyLocation = true;

      var color = DRIVER_COLORS[idx % DRIVER_COLORS.length];
      var isActive = activeDrivers && activeDrivers[dId];
      var dOrders = (orders||[]).filter(function(o){ return o.driverId === dId; });
      var delivered = dOrders.filter(function(o){ return o.status === "delivered"; }).length;
      var total = dOrders.length;
      var age = info.online_at ? Math.floor((Date.now() - new Date(info.online_at).getTime()) / 1000) : 999;
      var ageStr = age < 60 ? age + "s ago" : Math.floor(age/60) + "m ago";

      // Custom colored icon
      var iconHtml = '<div style="width:36px;height:36px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);font-size:11px;font-weight:700;color:#fff;font-family:-apple-system,sans-serif;">' + info.name.slice(0,2).toUpperCase() + '</div>';
      var icon = L.divIcon({ html: iconHtml, className: "", iconSize: [36,36], iconAnchor: [18,18] });

      var popup = '<div style="font-family:-apple-system,sans-serif;min-width:150px;">' +
        '<div style="font-weight:700;font-size:13px;color:#111;margin-bottom:4px;">' + info.name + '</div>' +
        '<div style="font-size:11px;color:#666;margin-bottom:2px;">' + (info.area || "Location known") + '</div>' +
        '<div style="font-size:11px;color:#888;margin-bottom:6px;">Updated ' + ageStr + '</div>' +
        '<div style="font-size:11px;background:#f5f5f5;border-radius:6px;padding:6px 8px;">' +
        delivered + ' / ' + total + ' orders delivered' +
        '</div>' +
        '<div style="font-size:10px;color:' + (isActive?"#22C55E":"#F59E0B") + ';margin-top:4px;">' +
        (isActive ? "● Active" : "○ Idle") +
        '</div></div>';

      if (markersRef.current[dId]) {
        markersRef.current[dId].setLatLng([info.latitude, info.longitude]);
        markersRef.current[dId].setIcon(icon);
        markersRef.current[dId].setPopupContent(popup);
      } else {
        var marker = L.marker([info.latitude, info.longitude], { icon }).addTo(map);
        marker.bindPopup(popup);
        markersRef.current[dId] = marker;
      }
    });

    // Remove markers for offline drivers
    Object.keys(markersRef.current).forEach(function(dId) {
      if (!onlineDrivers || !onlineDrivers[dId] || !onlineDrivers[dId].latitude) {
        mapInstanceRef.current.removeLayer(markersRef.current[dId]);
        delete markersRef.current[dId];
      }
    });

    setNoLocation(!hasAnyLocation && driverIds.length > 0);
  }, [onlineDrivers, activeDrivers, orders]);

  var onlineCount = Object.keys(onlineDrivers||{}).length;

  return (
    <div style={{ padding:"0 0 16px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"#0F1218", borderRadius:12, marginBottom:12 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>
          Live Driver Map
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background: onlineCount > 0 ? "#22C55E" : "#6B7280" }}></div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}>
            {onlineCount} driver{onlineCount !== 1 ? "s" : ""} online
          </div>
        </div>
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ width:"100%", height:420, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,.07)" }} />

      {/* No location notice */}
      {noLocation && (
        <div style={{ background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.25)", borderRadius:10, padding:"10px 14px", marginTop:10, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#FBBF24", fontSize:12 }}>
          Drivers are online but haven't shared their location yet. Location updates every 30 seconds when driver has the app open.
        </div>
      )}

      {/* Driver cards */}
      <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
        {DRIVERS.map(function(d, idx) {
          var info = onlineDrivers && onlineDrivers[d.id];
          var isActive = activeDrivers && activeDrivers[d.id];
          var dOrders = (orders||[]).filter(function(o){ return o.driverId === d.id; });
          var delivered = dOrders.filter(function(o){ return o.status === "delivered"; }).length;
          var total = dOrders.length;
          var color = DRIVER_COLORS[idx % DRIVER_COLORS.length];
          return (
            <div key={d.id} style={{ flex:"1 1 140px", background:"#161B24", borderRadius:10, padding:"10px 12px", borderLeft:"3px solid " + (info ? color : "#374151") }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:12, fontWeight:700 }}>{d.name}</div>
                <div style={{ width:8, height:8, borderRadius:"50%", background: info ? (isActive ? "#22C55E" : "#F59E0B") : "#374151" }}></div>
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginBottom:4 }}>
                {info ? (info.area || "Location shared") : "Offline"}
              </div>
              {total > 0 && (
                <div>
                  <div style={{ background:"rgba(255,255,255,.05)", borderRadius:4, height:3, marginBottom:3 }}>
                    <div style={{ background:color, width:(delivered/total*100)+"%", height:3, borderRadius:4 }}></div>
                  </div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10 }}>{delivered}/{total} delivered</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SECTION 17: ADMIN APP COMPONENTS
// Lines: AdminHistoryTab, AdminVehiclesTab, AdminCivilIdTab
// Lines: DateFilterBar, AdminApp (main admin shell)
// ============================================================
/*  Admin App  */
/*  Admin: Vehicles & Expenses Tab  */
const EXPENSE_TYPES = ["Fuel","Parking","Toll","Car Wash","Maintenance","Other"];

function AdminHistoryTab({ history }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedDriver, setExpandedDriver] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div style={{ padding:"40px 24px", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:16, fontWeight:700, marginBottom:8 }}>No History Yet</div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:13, lineHeight:1.6 }}>
          Driver history is saved automatically at the end of each day.
          Upload today's PDF to start.
        </div>
      </div>
    );
  }

  var day = selectedDay || history[0];

  return (
    <div style={{ padding:"0 16px 80px" }}>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700, marginBottom:4 }}>Driver History</div>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:16 }}>Daily performance records — last {history.length} day{history.length!==1?"s":""}</div>

      {/* Day selector */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:16, paddingBottom:4 }}>
        {history.map(function(h) {
          var isSelected = h.timestamp === day.timestamp;
          return (
            <button key={h.timestamp} onClick={function() { setSelectedDay(h); setExpandedDriver(null); }}
              style={{ background:isSelected?"linear-gradient(135deg,#FF6B35,#FF3D71)":"rgba(255,255,255,.06)", border:isSelected?"none":"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"8px 14px", cursor:"pointer", flexShrink:0 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:12, fontWeight:700 }}>{h.date}</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:isSelected?"rgba(255,255,255,.7)":"rgba(255,255,255,.35)", fontSize:10, marginTop:2 }}>{h.drivers.length} drivers</div>
            </button>
          );
        })}
      </div>

      {/* Day summary row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
        {(function() {
          var totalDel = day.drivers.reduce(function(a,d) { return a+d.delivered; }, 0);
          var totalCan = day.drivers.reduce(function(a,d) { return a+d.cancelled; }, 0);
          var totalCash = day.drivers.reduce(function(a,d) { return a+d.cashCollected; }, 0);
          var totalComm = day.drivers.reduce(function(a,d) { return a+(d.commissionEarned?d.commissionAmount:0); }, 0);
          return [
            [totalDel, "Delivered", "#10B981"],
            [totalCan, "Cancelled", "#EF4444"],
            [fmt(totalCash), "Cash", "#F59E0B"],
            [fmt(totalComm), "Commission", "#00D4FF"],
          ].map(function(item) {
            return (
              <div key={item[1]} style={{ background:item[2]+"12", border:"1px solid "+item[2]+"25", borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:item[2], fontSize:16, fontWeight:800 }}>{item[0]}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginTop:2 }}>{item[1]}</div>
              </div>
            );
          });
        })()}
      </div>

      {/* Per-driver cards */}
      {day.drivers.map(function(d) {
        var isExp = expandedDriver === d.id;
        return (
          <div key={d.id} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, marginBottom:10, overflow:"hidden" }}>
            {/* Header row */}
            <div onClick={function() { setExpandedDriver(isExp ? null : d.id); }}
              style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0 }}>{d.avatar}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>{d.name}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:2 }}>
                  {d.totalAssigned} assigned   {d.delivered} delivered   {d.successRate}% success
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:13, fontWeight:700 }}>{fmt(d.cashCollected)}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10 }}>Cash collected</div>
              </div>
              <span style={{ color:"rgba(255,255,255,.3)", fontSize:12, marginLeft:4 }}>{isExp ? "^" : "v"}</span>
            </div>

            {/* Expanded detail */}
            {isExp && (
              <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"12px 14px", background:"rgba(0,0,0,.15)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  {[
                    ["Total Assigned",   d.totalAssigned,  "#fff"],
                    ["Delivered",        d.delivered,       "#10B981"],
                    ["Cancelled",        d.cancelled,       "#EF4444"],
                    ["Postponed",        d.postponed,       "#8B5CF6"],
                    ["Pending (undelivered)", d.pending,    "#F59E0B"],
                    ["Exchange Orders",  d.exchange,        "#6B7280"],
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:"8px 10px" }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:row[2], fontSize:16, fontWeight:800 }}>{row[1]}</div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, marginTop:2 }}>{row[0]}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Financial summary */}
                <div style={{ background:"rgba(255,255,255,.04)", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:10, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Financial Summary</div>
                  {[
                    ["Cash Collected (COD)", fmt(d.cashCollected), "#F59E0B"],
                    ["Commission", d.commissionEarned ? fmt(d.commissionAmount) : "Not earned", d.commissionEarned ? "#10B981" : "#6B7280"],
                    ["Vehicle Expenses", d.vehicleExpenses > 0 ? "- " + fmt(d.vehicleExpenses) : "None", d.vehicleExpenses > 0 ? "#EF4444" : "#6B7280"],
                    ["Net Amount", fmt(d.netAmount), "#00D4FF"],
                  ].map(function(row) {
                    return (
                      <div key={row[0]} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}>{row[0]}</span>
                        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:row[2], fontSize:13, fontWeight:700 }}>{row[1]}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Expense breakdown */}
                {d.vehicleExpenses > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {Object.keys(d.expenseBreakdown).map(function(type) {
                      return (
                        <span key={type} style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:20, padding:"3px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#FCA5A5", fontSize:11 }}>
                          {type}: {fmt(d.expenseBreakdown[type])}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function DriverOrderManager({ driverId, driverName, orders, onRemoveOrder }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(new Set());
  const dOrders = (orders||[]).filter(function(o){ return o.driverId === driverId; });
  if (dOrders.length === 0) return null;

  function toggleAll() {
    if (selected.size === dOrders.length) { setSelected(new Set()); }
    else { setSelected(new Set(dOrders.map(function(o){ return o.id||o.invoiceNo; }))); }
  }

  function removeSelected() {
    if (selected.size === 0) return;
    selected.forEach(function(id){ if(onRemoveOrder) onRemoveOrder(id); });
    setSelected(new Set());
  }

  return (
    <div style={{ marginTop:10, marginBottom:4 }}>
      <button onClick={function(){ setOpen(function(p){return !p;}); setSelected(new Set()); }}
        style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.6)", fontSize:12 }}>Manage Orders ({dOrders.length})</span>
        <span style={{ color:"rgba(255,255,255,.3)", fontSize:11 }}>{open?"^":"v"}</span>
      </button>
      {open && (
        <div style={{ background:"rgba(0,0,0,.2)", borderRadius:"0 0 10px 10px", padding:"10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <button onClick={toggleAll} style={{ background:"none", border:"1px solid rgba(255,255,255,.15)", borderRadius:6, padding:"3px 10px", color:"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
              {selected.size === dOrders.length ? "Deselect All" : "Select All"}
            </button>
            {selected.size > 0 && (
              <button onClick={removeSelected}
                style={{ background:"rgba(239,68,68,.15)", border:"1px solid rgba(239,68,68,.3)", borderRadius:6, padding:"3px 10px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, fontWeight:600, cursor:"pointer" }}>
                Remove ({selected.size})
              </button>
            )}
          </div>
          <div style={{ maxHeight:200, overflowY:"auto" }}>
            {dOrders.map(function(o) {
              var oid = o.id||o.invoiceNo;
              var isChk = selected.has(oid);
              var sc = STATUS_CFG[o.status] || STATUS_CFG.pending;
              return (
                <div key={oid} onClick={function(){ setSelected(function(prev){ var n=new Set(prev); if(n.has(oid)){n.delete(oid);}else{n.add(oid);} return n; }); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 4px", borderBottom:"1px solid rgba(255,255,255,.04)", cursor:"pointer" }}>
                  <div style={{ width:16, height:16, borderRadius:3, border:"1.5px solid "+(isChk?"#EF4444":"rgba(255,255,255,.2)"), background:isChk?"#EF4444":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {isChk && <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>x</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:11, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.customer}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10 }}>#{o.invoiceNo} - {fmt(o.total)}</div>
                  </div>
                  <span style={{ background:sc.bg, color:sc.color, borderRadius:10, padding:"1px 7px", fontSize:9, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontWeight:600, flexShrink:0 }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible expense group per driver
function DriverExpGroup({ driver, expenses, total }) {
  const [open, setOpen] = useState(false);
  var ICONS = { Fuel:"⛽", Parking:"🅿️", Toll:"🛣️", "Car Wash":"🚿", Maintenance:"🔧" };
  return (
    <div style={{ marginBottom:10, borderRadius:12, border:"1px solid rgba(255,255,255,.07)", overflow:"hidden" }}>
      <button onClick={function(){ setOpen(function(p){ return !p; }); }}
        style={{ width:"100%", background:"#161B24", border:"none", padding:"11px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(239,68,68,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:11, fontWeight:700 }}>{driver.avatar||driver.name.slice(0,2).toUpperCase()}</div>
          <div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:700, textAlign:"left" }}>{driver.name}</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>{expenses.length} expense{expenses.length!==1?"s":""}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:14, fontWeight:800 }}>- {fmt(total)}</div>
          <div style={{ color:"rgba(255,255,255,.3)", fontSize:12 }}>{open?"▲":"▼"}</div>
        </div>
      </button>
      {open && (
        <div style={{ background:"#0F1218", padding:"8px 14px 10px" }}>
          {expenses.map(function(e, i) {
            return (
              <div key={e.id||i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom: i<expenses.length-1?"1px solid rgba(255,255,255,.05)":"none" }}>
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#fff", fontSize:12, fontWeight:600 }}>{ICONS[e.type]||"📋"} {e.type}</div>
                  {e.note && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>{e.note}</div>}
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.25)", fontSize:10 }}>{new Date(e.createdAt).toLocaleString("en-KW",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:13, fontWeight:800 }}>- {fmt(e.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminVehiclesTab({ orders, expenses, driverProfiles, onUpdateDriver, onAddDriver, passwords, onSetPassword, onRemoveOrderAdmin, onlineDrivers, activeDrivers }) {
  const totalExpenses = expenses.reduce((a,e) => a + Number(e.amount), 0);

  const [editDriver, setEditDriver] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newDrv, setNewDrv] = React.useState({ id:"", name:"", avatar:"", phone:"", status:"active", vehicleType:"Car", vehicleNo:"", licenseNo:"", nationality:"", joinDate:"", daftarExpiry:"" });
  const allDrivers = Object.keys(driverProfiles||{}).length > 0
    ? DRIVERS.map(d => ({ ...d, ...(driverProfiles||{})[d.id] }))
    : DRIVERS;

  // API Key state
  const [apiKeyInput, setApiKeyInput] = useState(function(){ return getApiKey(); });
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  function handleSaveApiKey() {
    saveApiKey(apiKeyInput);
    setApiKeySaved(true);
    setTimeout(function(){ setApiKeySaved(false); }, 2500);
  }
  var savedKey = getApiKey();
  var keyPreview = savedKey ? (savedKey.slice(0,10) + "..." + savedKey.slice(-4)) : "";

  return (
    <div style={{ padding:"0 16px 80px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700 }}>Drivers &amp; Expenses</div>
        <button onClick={function(){ setShowAdd(true); }} style={{ background:"linear-gradient(135deg,#FF6B35,#FF3D71)", border:"none", borderRadius:10, padding:"7px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Add Driver</button>
      </div>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:14 }}>Manage drivers, view commission &amp; expenses</div>

      {/* API Key Settings */}
      <div style={{ background:"rgba(0,212,255,.05)", border:"1px solid rgba(0,212,255,.2)", borderRadius:14, padding:"14px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <span style={{ fontSize:18 }}>🔑</span>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:13, fontWeight:700 }}>Label Scan API Key</div>
          {savedKey && <span style={{ background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.3)", borderRadius:20, padding:"2px 8px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#10B981", fontSize:10, fontWeight:600 }}>✓ Set</span>}
        </div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:10 }}>
          Required for 📷 Scan Label feature. Get your key from{" "}
          <span style={{ color:"#00D4FF" }}>console.anthropic.com</span>
          {savedKey && <span style={{ color:"rgba(255,255,255,.3)" }}>  Current: {keyPreview}</span>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKeyInput}
            onChange={function(e){ setApiKeyInput(e.target.value); setApiKeySaved(false); }}
            placeholder="sk-ant-api03-..."
            style={{ flex:1, background:"rgba(255,255,255,.07)", border:"1px solid rgba(0,212,255,.25)", borderRadius:10, padding:"9px 12px", color:"#fff", fontFamily:"monospace", fontSize:12, outline:"none", boxSizing:"border-box" }}
          />
          <button onClick={function(){ setShowApiKey(function(v){ return !v; }); }}
            style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"9px 12px", color:"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer", flexShrink:0 }}>
            {showApiKey ? "Hide" : "Show"}
          </button>
          <button onClick={handleSaveApiKey}
            style={{ background: apiKeySaved ? "rgba(16,185,129,.2)" : "rgba(0,212,255,.15)", border: apiKeySaved ? "1px solid #10B981" : "1px solid rgba(0,212,255,.4)", borderRadius:10, padding:"9px 14px", color: apiKeySaved ? "#10B981" : "#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
            {apiKeySaved ? "✓ Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Login Credentials Summary */}
      <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"12px 14px", marginBottom:16 }}>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:700, marginBottom:10 }}>Login Credentials</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
          <div style={{ background:"rgba(255,90,31,.08)", borderRadius:10, padding:"8px 10px" }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginBottom:2 }}>ADMIN</div>
            <div style={{ fontFamily:"monospace", color:"#FF5A1F", fontSize:12 }}>admin</div>
            <div style={{ fontFamily:"monospace", color:"rgba(255,255,255,.5)", fontSize:11 }}>{"●".repeat(((passwords && passwords["admin"]) || "admin123").length)}</div>
          </div>
          {allDrivers.slice(0,3).map(function(d) {
            return (
              <div key={d.id} style={{ background:"rgba(0,212,255,.06)", borderRadius:10, padding:"8px 10px" }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:10, marginBottom:2 }}>{d.name.toUpperCase()}</div>
                <div style={{ fontFamily:"monospace", color:"#00D4FF", fontSize:12 }}>{d.id}</div>
                <div style={{ fontFamily:"monospace", color:"rgba(255,255,255,.5)", fontSize:11 }}>{"●".repeat(((passwords && passwords[d.id]) || (d.id + "123")).length)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.25)", fontSize:11 }}>To change a password: tap Edit on the driver card below</div>
      </div>

      {/* Add Driver Modal */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:300, display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:"#161B24", borderRadius:"20px 20px 0 0", padding:20, maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:16, fontWeight:700, marginBottom:16 }}>Add New Driver</div>
            {[["id","Driver ID (login username)"],["name","Full Name"],["avatar","Avatar (2 letters, e.g. AS)"],["phone","Phone Number"],["nationality","Nationality"],["vehicleType","Vehicle Type (Car/Van/Bike)"],["vehicleNo","Vehicle Number"],["licenseNo","License No"],["joinDate","Join Date (YYYY-MM-DD)"],["daftarExpiry","Daftar Expiry (YYYY-MM-DD)"]].map(function(f){
              return (
                <div key={f[0]} style={{ marginBottom:10 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11, marginBottom:4 }}>{f[1]}</div>
                  <input value={newDrv[f[0]]||""} onChange={function(e){ var v=e.target.value; setNewDrv(function(p){ var n={...p}; n[f[0]]=v; return n; }); }}
                    style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"10px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, boxSizing:"border-box" }} />
                </div>
              );
            })}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={function(){ setShowAdd(false); setNewDrv({ id:"", name:"", avatar:"", phone:"", status:"active", vehicleType:"Car", vehicleNo:"", licenseNo:"", nationality:"", joinDate:"", daftarExpiry:"" }); }}
                style={{ flex:1, background:"rgba(255,255,255,.08)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Cancel</button>
              <button onClick={function(){
                if (!newDrv.id||!newDrv.name) { alert("Driver ID and Name are required"); return; }
                if (onAddDriver) onAddDriver(newDrv);
                setShowAdd(false);
                setNewDrv({ id:"", name:"", avatar:"", phone:"", status:"active", vehicleType:"Car", vehicleNo:"", licenseNo:"", nationality:"", joinDate:"", daftarExpiry:"" });
              }} style={{ flex:2, background:"linear-gradient(135deg,#00D4FF,#7C3AED)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Save Driver</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {editDriver && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:300, display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:"#161B24", borderRadius:"20px 20px 0 0", padding:20, maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:16, fontWeight:700, marginBottom:16 }}>Edit: {editDriver.name}</div>
            {/* Password change */}
            <div style={{ marginBottom:14, background:"rgba(0,212,255,.06)", border:"1px solid rgba(0,212,255,.15)", borderRadius:12, padding:"12px 14px" }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:13, fontWeight:700, marginBottom:8 }}>Change Password</div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8 }}>
                Current: <span style={{ color:"rgba(255,255,255,.6)", fontFamily:"monospace" }}>{"●".repeat(((passwords && passwords[editDriver.id]) || (editDriver.id + "123")).length)} (hidden)</span>
              </div>
              <input placeholder="New password" id={"pwd-"+editDriver.id}
                style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"9px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, boxSizing:"border-box" }} />
              <button onClick={function(){
                var el = document.getElementById("pwd-"+editDriver.id);
                if (!el || !el.value.trim()) return;
                if (el.value.trim().length < 6) { alert("Password must be at least 6 characters."); return; }
                if (onSetPassword) onSetPassword(editDriver.id, el.value.trim());
                el.value = "";
                alert("Password updated!");
              }} style={{ marginTop:8, background:"rgba(0,212,255,.15)", border:"1px solid rgba(0,212,255,.3)", borderRadius:8, padding:"7px 16px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Update Password
              </button>
            </div>

            {[["phone","Phone"],["nationality","Nationality"],["vehicleType","Vehicle Type"],["vehicleNo","Vehicle Number"],["licenseNo","License No"],["joinDate","Join Date (YYYY-MM-DD)"],["daftarExpiry","Daftar Expiry (YYYY-MM-DD)"],["status","Status (active/inactive)"]].map(function(f){
              return (
                <div key={f[0]} style={{ marginBottom:10 }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11, marginBottom:4 }}>{f[1]}</div>
                  <input value={editDriver[f[0]]||""} onChange={function(e){ var v=e.target.value; setEditDriver(function(p){ var n={...p}; n[f[0]]=v; return n; }); }}
                    style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"10px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, boxSizing:"border-box" }} />
                </div>
              );
            })}
            {/* Vehicle Assignment - Dropdown */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12, marginBottom:6 }}>Assign Company Vehicle</div>
              {(function(){
                var curV = null;
                try { curV = JSON.parse(localStorage.getItem("df_vehicle_" + editDriver.id)); } catch(e){}
                var curPlate = curV ? curV.plate : "";
                return (
                  <div style={{ display:"flex", gap:8 }}>
                    <select
                      value={curPlate}
                      onChange={function(e){
                        var plate = e.target.value;
                        if (!plate) {
                          localStorage.removeItem("df_vehicle_" + editDriver.id);
                        } else {
                          var v = AMTEL_VEHICLES.find(function(x){ return x.plate === plate; });
                          if (v) localStorage.setItem("df_vehicle_" + editDriver.id, JSON.stringify(v));
                        }
                        setEditDriver(function(p){ return Object.assign({},p,{_vUpdated:Date.now()}); });
                      }}
                      style={{ flex:1, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"10px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none", cursor:"pointer" }}>
                      <option value="" style={{ background:"#161B24", color:"#fff" }}>— No vehicle assigned —</option>
                      {AMTEL_VEHICLES.map(function(v) {
                        return <option key={v.plate} value={v.plate} style={{ background:"#161B24", color:"#fff" }}>{v.brand} {v.model} · {v.color} · Plate {v.plate}</option>;
                      })}
                    </select>
                  </div>
                );
              })()}
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={function(){ setEditDriver(null); }} style={{ flex:1, background:"rgba(255,255,255,.08)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Cancel</button>
              <button onClick={function(){
                if (onUpdateDriver) onUpdateDriver(editDriver.id, editDriver);
                setEditDriver(null);
              }} style={{ flex:2, background:"linear-gradient(135deg,#00D4FF,#7C3AED)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Total expense hero */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <div style={{ background:"rgba(16,185,129,.1)", border:"1px solid rgba(16,185,129,.25)", borderRadius:14, padding:14, textAlign:"center" }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11 }}> Total Commission</div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#10B981", fontSize:20, fontWeight:800, marginTop:4 }}>
            {fmt(DRIVERS.reduce(function(a,d) {
              const del = orders.filter(o=>o.driverId===d.id&&o.status==="delivered"&&!isExchange(o.paymentType)&&!isExchange(o.originalPaymentType)).length;
              return a + calcCommission(del).amount;
            }, 0))}
          </div>
        </div>
        <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:14, padding:14, textAlign:"center" }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:11 }}> Total Expenses</div>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:20, fontWeight:800, marginTop:4 }}>{fmt(totalExpenses)}</div>
        </div>
      </div>

      {/* Per-driver cards */}
      {allDrivers.map(function(d) {
        const dOrders      = orders.filter(o => o.driverId === d.id);
        const done         = dOrders.filter(o => o.status === "delivered").length;
        const doneNoEx     = dOrders.filter(o => o.status === "delivered" && !isExchange(o.paymentType) && !isExchange(o.originalPaymentType)).length;
        const scanned      = dOrders.filter(o => o.scanned).length;
        const cash         = dOrders.filter(o=>o.status==="delivered"&&(o.paymentType==="Cash"||o.paymentType==="COD")&&!o.originalPaymentType).reduce((a,o)=>a+Number(o.total),0);
        const dExp         = expenses.filter(e => e.driverId === d.id);
        const dExpAmt      = dExp.reduce((a,e)=>a+Number(e.amount),0);
        const comm         = calcCommission(doneNoEx);
        const vehicleIcon  = d.vehicleType === "Van" ? "🚐" : d.vehicleType === "Bike" ? "🏍" : "🚗";
        const daftarDate   = d.daftarExpiry ? new Date(d.daftarExpiry) : null;
        const daysToExpiry = daftarDate ? Math.ceil((daftarDate - new Date()) / 86400000) : null;
        const daftarWarn   = daysToExpiry !== null && daysToExpiry <= 60;
        const daftarExp    = daysToExpiry !== null && daysToExpiry <= 0;

        return (
          <div key={d.id} style={{ background:"rgba(255,255,255,.04)", border:"1px solid " + (daftarExp?"rgba(239,68,68,.4)":daftarWarn?"rgba(245,158,11,.3)":"rgba(255,255,255,.08)"), borderRadius:16, padding:16, marginBottom:14 }}>

            {/* Daftar alert */}
            {(daftarExp || daftarWarn) && (
              <div style={{ background:daftarExp?"rgba(239,68,68,.12)":"rgba(245,158,11,.1)", borderRadius:10, padding:"8px 12px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:16 }}>{daftarExp?"🚨":""}</span>
                <div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:daftarExp?"#EF4444":"#F59E0B", fontSize:12, fontWeight:700 }}>{daftarExp?"Daftar EXPIRED":"Daftar expires in " + (daysToExpiry) + " days"}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>Due: {daftarDate?.toLocaleDateString("en-KW",{day:"numeric",month:"short",year:"numeric"})}</div>
                </div>
              </div>
            )}

            {/* Driver header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <div style={{ width:46, height:46, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B35,#FF3D71)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:16, fontWeight:800, color:"#fff" }}>{d.avatar}</div>
                <div style={{ position:"absolute", bottom:1, right:1, width:12, height:12, borderRadius:"50%",
                background:onlineDrivers&&onlineDrivers[d.id]?"#10B981":"#374151",
                border:"2px solid #070C1A",
                animation:(onlineDrivers&&onlineDrivers[d.id]&&activeDrivers&&activeDrivers[d.id])?"pulse 1.2s ease-in-out infinite":"none" }}
              title={onlineDrivers&&onlineDrivers[d.id]?(activeDrivers&&activeDrivers[d.id]?"Active now":"Online - idle"):"Offline"} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700 }}>{d.name}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>{d.phone}   {d.nationality}</div>
              </div>
              <span style={{ background:d.status==="active"?"rgba(16,185,129,.15)":"rgba(107,114,128,.15)", color:d.status==="active"?"#10B981":"#9CA3AF", borderRadius:20, padding:"3px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, fontWeight:600 }}>
                {d.status==="active"?"Active":"Inactive"}
              </span>
              <button onClick={function(){ setEditDriver({...d}); }}
                style={{ background:"rgba(0,212,255,.15)", border:"1px solid rgba(0,212,255,.35)", borderRadius:8, padding:"4px 12px", color:"#00D4FF", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Edit</button>
            </div>

            {/* Vehicle + Daftar row */}
            <div style={{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:"10px 12px", marginBottom:10, display:"flex", flexWrap:"wrap", gap:14 }}>
              <div><div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10 }}>VEHICLE</div><div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:12, fontWeight:600 }}>{vehicleIcon} {d.vehicleType}   {d.vehicleNo}</div></div>
              <div><div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10 }}>LICENSE NO.</div><div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.7)", fontSize:12 }}>{d.licenseNo}</div></div>
              <div><div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10 }}>DAFTAR RENEWAL</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:daftarExp?"#EF4444":daftarWarn?"#F59E0B":"#10B981", fontSize:12, fontWeight:600 }}>
                  {daftarDate ? daftarDate.toLocaleDateString("en-KW",{day:"numeric",month:"short",year:"numeric"}) : "-"}
                  {daysToExpiry !== null && <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, fontWeight:400 }}> ({daftarExp?"Expired":(daysToExpiry) + "d left"})</span>}
                </div>
              </div>
              <div><div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10 }}>JOINED</div><div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.6)", fontSize:12 }}>{d.joinDate ? new Date(d.joinDate).toLocaleDateString("en-KW",{month:"short",year:"numeric"}) : "-"}</div></div>
            </div>

            {/* Stats grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:10 }}>
              {[[dOrders.length,"Assigned","#fff"],[scanned,"Collected","#00D4FF"],[done,"Delivered","#10B981"],[fmt(cash),"Cash COD","#F59E0B"]].map(function(item) { const v=item[0],l=item[1],c=item[2]; return (
                <div key={l} style={{ textAlign:"center", background:"rgba(255,255,255,.04)", borderRadius:10, padding:"8px 4px" }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:c, fontSize:l==="Cash COD"?10:15, fontWeight:800 }}>{v}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10 }}>{l}</div>
                </div>
              )})}
            </div>

            {/* Commission bar */}
            <div style={{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:"10px 12px", marginBottom:dExp.length?10:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.5)", fontSize:12 }}> Commission {comm.earned?"Earned":"Progress"} <span style={{ color:"rgba(255,255,255,.25)", fontSize:10 }}>(excl. exchange)</span></span>
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:comm.earned?"#10B981":"#F59E0B", fontSize:13, fontWeight:700 }}>{comm.earned ? fmt(comm.amount) : (doneNoEx) + "/" + (COMMISSION_THRESHOLD)}</span>
              </div>
              <div style={{ background:"rgba(255,255,255,.08)", borderRadius:30, height:5, overflow:"hidden" }}>
                <div style={{ height:"100%", width:(Math.min(100,Math.round(doneNoEx/(COMMISSION_THRESHOLD+1)*100))) + "%", background:comm.earned?"linear-gradient(90deg,#10B981,#00D4FF)":"linear-gradient(90deg,#F59E0B,#FF6B35)", borderRadius:30 }} />
              </div>
              {!comm.earned && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10, marginTop:3 }}>Need {Math.max(0,COMMISSION_THRESHOLD+1-doneNoEx)} more   KD {COMMISSION_PER_ORDER.toFixed(3)}/order from 21st onwards</div>}
            </div>

            {/* Expenses */}
            {dExp.length > 0 && (
              <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}> Vehicle Expenses So Far</span>
                  <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#EF4444", fontSize:13, fontWeight:700 }}>- {fmt(dExpAmt)}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {EXPENSE_TYPES.map(function(expT) { const amt = dExp.filter(e=>e.type===expT).reduce((a,e)=>a+Number(e.amount),0); if(!amt)return null; return <span key={expT} style={{ background:"rgba(239,68,68,.1)", borderRadius:20, padding:"2px 9px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#FCA5A5", fontSize:11 }}>{expT}: {fmt(amt)}</span>; })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* All expenses — grouped by driver, collapsible */}
      {expenses.length > 0 ? (
        <div style={{ marginTop:8 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700, marginBottom:10 }}>
            All Expense Records
          </div>
          {DRIVERS.map(function(d) {
            var dExp = expenses.filter(function(e){ return e.driverId === d.id; }).slice().reverse();
            if (dExp.length === 0) return null;
            var dTotal = dExp.reduce(function(a,e){ return a+Number(e.amount); }, 0);
            return (
              <DriverExpGroup key={d.id} driver={d} expenses={dExp} total={dTotal} />
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:30 }}>No expenses logged yet</div>
      )}
    </div>
  );
}


function DateFilterBar({ orders, selectedDate, onSetSelectedDate }) {
  var dateCounts = {};
  orders.forEach(function(o) {
    var d = o.assignedDate || o.date || "";
    if (d) dateCounts[d] = (dateCounts[d] || 0) + 1;
  });
  var dates = Object.keys(dateCounts).sort(function(a, b) {
    var pa = a.split("/"), pb = b.split("/");
    return new Date(parseInt(pb[2]),parseInt(pb[1])-1,parseInt(pb[0])) - new Date(parseInt(pa[2]),parseInt(pa[1])-1,parseInt(pa[0]));
  });

  function parseDate(d) {
    var p = d.split("/");
    if (p.length !== 3) return null;
    return new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]));
  }
  function dateLabel(d) {
    var dt = parseDate(d); if (!dt) return d;
    var today = new Date(); today.setHours(0,0,0,0);
    var yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    if (dt.toDateString() === today.toDateString()) return "Today";
    if (dt.toDateString() === yesterday.toDateString()) return "Yesterday";
    // Format: "26 Mar, Thu" — clear and unambiguous
    var day = dt.getDate();
    var mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dt.getMonth()];
    var wday = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()];
    return day + " " + wday + " " + mon;  // "27 Sat Mar"
  }
  function isSelected(d) {
    var dt = parseDate(d); if (!dt) return false;
    return dt.toDateString() === selectedDate;
  }
  var allSel = !selectedDate || !dates.some(isSelected);

  return (
    <div style={{ display:"flex", gap:6, flexWrap:"nowrap", overflowX:"auto", padding:"8px 14px", background:"rgba(255,255,255,.02)", borderBottom:"1px solid rgba(255,255,255,.06)", WebkitOverflowScrolling:"touch" }}>
      <button onClick={function(){ onSetSelectedDate(null); }}
        style={{ flexShrink:0, background:allSel?"rgba(255,90,31,.2)":"rgba(255,255,255,.06)", border:allSel?"1.5px solid #FF6B35":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"5px 12px", cursor:"pointer" }}>
        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:allSel?"#FF5A1F":"rgba(255,255,255,.5)", fontSize:12, fontWeight:allSel?700:400 }}>All</span>
      </button>
      {dates.map(function(d) {
        var sel = isSelected(d);
        return (
          <button key={d} onClick={function(){ var dt=parseDate(d); if(dt) onSetSelectedDate(dt.toDateString()); }}
            style={{ flexShrink:0, background:sel?"rgba(0,212,255,.2)":"rgba(255,255,255,.06)", border:sel?"1.5px solid #00D4FF":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"5px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:sel?"#00D4FF":"rgba(255,255,255,.6)", fontSize:12, fontWeight:sel?700:400 }}>{dateLabel(d)}</span>
            <span style={{ background:sel?"rgba(0,212,255,.3)":"rgba(255,255,255,.1)", borderRadius:20, padding:"1px 6px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:sel?"#00D4FF":"rgba(255,255,255,.4)", fontSize:10 }}>{dateCounts[d]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Admin: Civil ID Records Tab ───────────────────────────────────────────────
function AdminCivilIdTab() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [copied,  setCopied]    = useState("");

  useEffect(function() {
    setLoading(true);
    dbLoadCivilIds().then(function(rows) {
      setRecords(rows);
      setLoading(false);
    });
  }, []);

  function copyText(text, key) {
    try { navigator.clipboard.writeText(text); } catch(e) {}
    setCopied(key);
    setTimeout(function(){ setCopied(""); }, 1500);
  }

  var filtered = records.filter(function(r) {
    var q = search.toLowerCase();
    if (!q) return true;
    return (r.invoice_no||"").toLowerCase().includes(q) ||
           (r.full_name||"").toLowerCase().includes(q) ||
           (r.civil_id_number||"").includes(q) ||
           (r.driver_name||"").toLowerCase().includes(q) ||
           (r.online_order_no||"").includes(q);
  });

  return (
    <div style={{ padding:"0 16px 80px" }}>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700, marginBottom:4 }}>🪪 Civil ID Records</div>
      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:14 }}>
        Customer Civil IDs collected at delivery — {records.length} total
      </div>

      {/* Search */}
      <input
        type="text" value={search}
        onChange={function(e){ setSearch(e.target.value); }}
        placeholder="🔍 Search by name, Civil ID, invoice..."
        style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"11px 14px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none", marginBottom:14 }}
      />

      {loading ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:40 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:40 }}>
          {search ? "No records match your search" : "No Civil ID records yet"}
        </div>
      ) : filtered.map(function(r) {
        var cardKey = r.invoice_no;
        return (
          <div key={cardKey} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(0,212,255,.15)", borderRadius:14, padding:14, marginBottom:10 }}>
            {/* Header row */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:14, fontWeight:700 }}>{r.full_name}</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:2 }}>
                  Driver: {r.driver_name}   ·   {r.delivered_date}
                </div>
              </div>
              <div style={{ background:"rgba(0,212,255,.12)", border:"1px solid rgba(0,212,255,.25)", borderRadius:20, padding:"3px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:11, fontWeight:600, flexShrink:0, marginLeft:8 }}>
                🪪 Verified
              </div>
            </div>

            {/* Civil ID number — tappable to copy */}
            <div
              onClick={function(){ copyText(r.civil_id_number, cardKey + "_cid"); }}
              style={{ background:"rgba(0,0,0,.25)", borderRadius:10, padding:"10px 14px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:10, marginBottom:2 }}>CIVIL ID NUMBER</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:16, fontWeight:700, letterSpacing:2 }}>{r.civil_id_number}</div>
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color: copied===cardKey+"_cid" ? "#10B981" : "rgba(255,255,255,.3)", fontSize:11 }}>
                {copied===cardKey+"_cid" ? "✓ Copied" : "Tap to copy"}
              </div>
            </div>

            {/* Order info */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <div style={{ background:"rgba(255,90,31,.08)", borderRadius:8, padding:"5px 10px" }}>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:9 }}>INVOICE</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:12, fontWeight:600 }}>#{r.invoice_no}</div>
              </div>
              {r.online_order_no && (
                <div style={{ background:"rgba(0,212,255,.08)", borderRadius:8, padding:"5px 10px" }}>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:9 }}>ONLINE ORDER</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"#00D4FF", fontSize:12, fontWeight:600 }}>#{r.online_order_no}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminApp({ user, orders, transfers, adminNotifs, onMarkNotifRead, onClearNotifs, expenses, onAddExpense, onOrdersAdd, onStatusUpdate, onApproveTransfer, onRejectTransfer, driverProfiles, onUpdateDriver, onAddDriver, onClearData, onClearCollected, onRemoveOrderAdmin, onEditOrder, saveStatus, dbConnected, syncing, onlineDrivers, activeDrivers, clearConfirm, onConfirmClear, onCancelClear, history, passwords, onSetPassword, selectedDate, onSetSelectedDate, onLogout, onOrdersRefresh }) {
  const [tab, setTab] = useState("upload");
  const [toast, setToast] = useState(null);
  const [filterDate, setFilterDate] = useState("all");
  const [alertStoreFilter, setAlertStoreFilter] = useState("all");
  // Filter orders by selected date
  var filteredOrders = orders.filter(function(o) {
    var od = o.assignedDate || o.date || "";
    var parts = od.split("/");
    if (parts.length === 3) {
      var oDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
      if (selectedDate === "all7") {
        // Last 7 days
        return oDate.getTime() >= Date.now() - 7*24*60*60*1000;
      }
      return oDate.toDateString() === (selectedDate || new Date().toDateString());    }
    return false;
  });

  function showToast(msg) { setToast({ msg, ttype:"success" }); setTimeout(function() { setToast(null); }, 3000); }

  function handleOrdersAssign(parsedOrders, driverId) {
    var assignedDate = (function(){
      var d = new Date();
      return d.getDate() + "/" + (d.getMonth()+1) + "/" + d.getFullYear();
    })();
    onOrdersAdd(parsedOrders.map(function(o){ return { ...o, driverId, assignedDate }; }));
    // Auto-switch date filter to today so newly assigned orders are visible
    onSetSelectedDate(new Date().toDateString());
  }

  const pendingTransfers = transfers.filter(t => t.status === "pending");
  const unreadNotifs     = adminNotifs.filter(n => !n.read).length;
  const unreadHelp       = adminNotifs.filter(n => !n.read && n.notifType === "help").length;

  const TABS = [
    { id:"upload",    icon:"📤", label:"Upload" },
    { id:"orders",    icon:"📦", label:"Orders" },
    { id:"notifs",    icon:"🔔", label:unreadHelp>0?"Alerts (SOS!)":"Alerts", badge: unreadNotifs },
    { id:"civilids",  icon:"🪪", label:"Civil IDs" },
    { id:"vehicles",  icon:"🚗", label:"Vehicles" },
    { id:"map",       icon:"📍", label:"Live Map" },
    { id:"history",   icon:"📅", label:"History" },
    { id:"transfers", icon:"🔄", label:"Transfers", badge: pendingTransfers.length },
  ];

  return (
    <div style={{ maxWidth:430, margin:"0 auto", background:"#090B10", height:"100dvh", display:"flex", flexDirection:"column", position:"relative", width:"100%" }}>

      {/* Clear Day Confirm Modal */}
      {clearConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.92)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:"#161B24", borderRadius:24, padding:28, maxWidth:320, width:"100%", border:"1px solid rgba(239,68,68,.2)" }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:18, fontWeight:800, marginBottom:8 }}>Clear Day?</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.45)", fontSize:14, marginBottom:24, lineHeight:1.6 }}>
              This will delete ALL orders, expenses and transfers. Driver profiles will be kept.
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={onCancelClear} style={{ flex:1, background:"rgba(255,255,255,.08)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Cancel</button>
              <button onClick={onConfirmClear} style={{ flex:1, background:"linear-gradient(135deg,#EF4444,#DC2626)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>Yes, Clear</button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast msg={toast.msg} toastKind={toast.ttype} />}

      {/* ── Admin Header ── */}
      <div style={{ padding:"12px 18px 10px", background:"#090B10", borderBottom:"1px solid rgba(255,255,255,.05)", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <svg viewBox="0 0 200 200" width={30} height={30} xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="ahog" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF5A1F"/><stop offset="100%" stopColor="#FF3D00"/></linearGradient></defs>
              <rect width="200" height="200" rx="44" fill="url(#ahog)"/>
              <polygon points="100,42 154,73 100,104 46,73" fill="white"/>
              <polygon points="46,73 100,104 100,162 46,131" fill="rgba(255,255,255,0.55)"/>
              <polygon points="154,73 100,104 100,162 154,131" fill="rgba(255,255,255,0.32)"/>
              <polygon points="100,42 106,46 106,100 100,104 94,100 94,46" fill="rgba(255,255,255,0.22)"/>
            </svg>
            <div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:800, fontSize:15, letterSpacing:"-0.3px", lineHeight:1.1 }}>
                <span style={{ color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif" }}>DELIVER</span><span style={{ color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif" }}>FLOW</span>
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10, letterSpacing:"1.2px" }}>
                ADMIN · {new Date().toLocaleDateString("en-KW",{day:"numeric",month:"short",year:"numeric"})}
                {syncing && <span style={{ color:"#F59E0B" }}> · Syncing…</span>}
                {!syncing && dbConnected && <span style={{ color:"#10B981" }}> · Live</span>}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={function(){ if(window.confirm("Clear all COLLECTED orders from driver dashboards?")) onClearCollected(); }}
              style={{ background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.15)", borderRadius:8, padding:"5px 9px", color:"#F59E0B", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, fontWeight:600, cursor:"pointer" }}>
              Clear
            </button>
            <button onClick={onLogout}
              style={{ background:"rgba(255,90,31,.1)", border:"1px solid rgba(255,90,31,.2)", borderRadius:8, padding:"5px 11px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, fontWeight:600, cursor:"pointer" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Driver presence strip ── */}
      <div style={{ display:"flex", gap:6, padding:"7px 16px", background:"#0F1218", borderBottom:"1px solid rgba(255,255,255,.04)", overflowX:"auto", flexShrink:0, alignItems:"center" }}>
        {DRIVERS.filter(function(d){ return d.status !== "inactive"; }).map(function(d) {
          var isOnline = onlineDrivers && onlineDrivers[d.id];
          var isActive = activeDrivers && activeDrivers[d.id];
          return (
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0, background:isOnline?"rgba(16,185,129,.07)":"rgba(255,255,255,.03)", borderRadius:20, padding:"4px 10px 4px 7px", border:"1px solid "+(isOnline?"rgba(16,185,129,.18)":"rgba(255,255,255,.05)") }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:isOnline?"#10B981":"#333",
                boxShadow:isOnline?"0 0 5px #10B981":"none",
                animation:(isOnline&&isActive)?"pulse 1.2s ease-in-out infinite":"none" }} />
              <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:isOnline?"#10B981":"rgba(255,255,255,.2)", fontSize:10, fontWeight:600 }}>{d.name}</span>
            </div>
          );
        })}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display:"flex", background:"#0F1218", borderBottom:"1px solid rgba(255,255,255,.05)", flexShrink:0, overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, minWidth:0, background:"none", border:"none", borderBottom: tab===t.id?"2.5px solid #FF6B35":"2.5px solid transparent",
              padding:"9px 4px 7px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, position:"relative" }}>
            <div style={{ position:"relative" }}>
              <span style={{ fontSize:14, lineHeight:1, opacity:tab===t.id?1:0.4 }}>{t.icon}</span>
              {t.badge > 0 && (
                <div style={{ position:"absolute", top:-4, right:-7, background:"#FF5A1F", borderRadius:10, minWidth:14, height:14, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:8, fontWeight:700, color:"#fff", padding:"0 3px" }}>{t.badge}</div>
              )}
            </div>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:9, fontWeight:tab===t.id?700:400, color:tab===t.id?"#FF5A1F":"rgba(255,255,255,.28)", whiteSpace:"nowrap" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Simple date filter — only for Orders and History tabs */}
      {(tab === "orders" || tab === "history") && (
        <div style={{ padding:"10px 0 10px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>Date</div>
          <input type="date"
            value={selectedDate && selectedDate !== "all7" ? (function(){
              var d = new Date(selectedDate);
              return isNaN(d) ? "" : d.toISOString().slice(0,10);
            })() : new Date().toISOString().slice(0,10)}
            onChange={function(e){
              if (!e.target.value) return;
              onSetSelectedDate(new Date(e.target.value + "T12:00:00").toDateString());
            }}
            style={{ flex:1, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"7px 12px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:13, outline:"none", colorScheme:"dark" }}
          />
          <button onClick={function(){ onSetSelectedDate(new Date().toDateString()); }}
            style={{ background:"rgba(255,90,31,.12)", border:"1px solid rgba(255,90,31,.25)", borderRadius:10, padding:"7px 12px", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            Today
          </button>
        </div>
      )}

      <div style={{ flex:1, overflowY:"auto", paddingTop:16, display:"flex", flexDirection:"column", WebkitOverflowScrolling:"touch" }}>
        {tab==="upload" && <AdminUploadTab allOrders={orders} onOrdersParsed={handleOrdersAssign} onAssignDriver={() => {}} onStatusUpdate={onStatusUpdate} />}
        {tab==="orders" && <AdminOrdersTab orders={filteredOrders} onStatusUpdate={onStatusUpdate} onRemoveOrder={onRemoveOrderAdmin} onEditOrder={onEditOrder} />}

        {/*  Notifications Tab  */}
        {tab==="notifs" && (
          <div style={{ padding:"0 16px 80px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700 }}> Order Status Alerts</div>
                <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>Real-time updates from drivers</div>
              </div>
              {adminNotifs.length > 0 && (
                <button onClick={onClearNotifs} style={{ background:"none", border:"none", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>
                  Mark all read
                </button>
              )}
            </div>
            {/* Store filter for alerts */}
            {adminNotifs.length > 0 && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {["all","Trikart Online","Webstore Online","ReStore Online","GadgetPro Online"].map(function(s){
                  var sel = alertStoreFilter === s;
                  return <button key={s} onClick={function(){ setAlertStoreFilter(s); }}
                    style={{ background:sel?"rgba(0,212,255,.15)":"rgba(255,255,255,.06)", border:sel?"1.5px solid #00D4FF":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"4px 12px", color:sel?"#00D4FF":"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>
                    {s==="all"?"All Stores":s.replace(" Online","")}</button>;
                })}
              </div>
            )}
            {/* Date filter for alerts */}
            {adminNotifs.length > 0 && (function(){
              var dates = [...new Set(adminNotifs.map(function(n){ return n.time ? new Date(n.time).toDateString() : null; }).filter(Boolean))];
              var filtered = adminNotifs
                .filter(function(n){ return filterDate === "all" || (n.time && new Date(n.time).toDateString() === filterDate); })
                .filter(function(n){ return alertStoreFilter === "all" || n.store === alertStoreFilter; });
              var today = new Date().toDateString();
              var yesterday = new Date(Date.now()-86400000).toDateString();
              function dateLabel(d) {
                if (d === today) return "Today";
                if (d === yesterday) return "Yesterday";
                return new Date(d).toLocaleDateString("en-KW",{weekday:"short",day:"numeric",month:"short"});
              }
              return (
                <div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                    <button onClick={function(){ setFilterDate("all"); }}
                      style={{ background:filterDate==="all"?"rgba(255,90,31,.2)":"rgba(255,255,255,.06)", border:filterDate==="all"?"1px solid #FF6B35":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"4px 12px", color:filterDate==="all"?"#FF5A1F":"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>All</button>
                    {dates.map(function(d){
                      return <button key={d} onClick={function(){ setFilterDate(d); }}
                        style={{ background:filterDate===d?"rgba(255,90,31,.2)":"rgba(255,255,255,.06)", border:filterDate===d?"1px solid #FF6B35":"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"4px 12px", color:filterDate===d?"#FF5A1F":"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>{dateLabel(d)}</button>;
                    })}
                  </div>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:40 }}>No notifications for this day</div>
                  ) : filtered.map(function(n) {
              const sc = STATUS_CFG[n.notifType] || STATUS_CFG.pending;
              return (
                <div key={n.id} onClick={() => onMarkNotifRead(n.id)}
                  style={{ background:n.notifType==="help"?(n.read?"rgba(239,68,68,.05)":"rgba(239,68,68,.1)"):(n.read?"rgba(255,255,255,.03)":"rgba(255,255,255,.07)"), border:"1px solid " + (n.notifType==="help"?"rgba(239,68,68,"+(n.read?".2)":".5)"):(n.read?"rgba(255,255,255,.06)":sc.color+"44")), borderRadius:14, padding:14, marginBottom:10, cursor:"pointer" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    {/* 3D letter status icon with outer glow */}
                    {(function() {
                      if (n.notifType === "help") {
                        return (
                          <div style={{ width:40, height:40, borderRadius:12, background:"rgba(239,68,68,.15)", border:"1.5px solid rgba(239,68,68,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:800, color:"#EF4444", boxShadow:"0 0 12px rgba(239,68,68,.5), 0 0 24px rgba(239,68,68,.2)" }}>SOS</div>
                        );
                      }
                      const statusColors = {
                        delivered: { face:"#10B981", side:"#059669", base:"#047857", glow:"34,197,94" },
                        postponed: { face:"#8B5CF6", side:"#7C3AED", base:"#6D28D9", glow:"139,92,246" },
                        cancelled: { face:"#EF4444", side:"#DC2626", base:"#B91C1C", glow:"239,68,68" },
                      };
                      const sc2 = statusColors[n.notifType] || { face:"#6B7280", side:"#4B5563", base:"#374151", glow:"107,114,128" };
                      const letter = (n.notifType||"?").charAt(0).toUpperCase();
                      return (
                        <div style={{ position:"relative", width:40, height:40, flexShrink:0 }}>
                          {/* outer glow */}
                          <div style={{ position:"absolute", inset:-6, borderRadius:18, background:"rgba("+sc2.glow+",.3)", filter:"blur(8px)" }} />
                          {/* face */}
                          <div style={{ position:"relative", width:40, height:40, borderRadius:12, background:sc2.face, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 1px rgba(255,255,255,.15) inset" }}>
                            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:22, fontWeight:800, color:"#fff", lineHeight:1 }}>{letter}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:n.notifType==="help"?"#EF4444":(n.read?"rgba(255,255,255,.5)":sc.color), fontSize:13, fontWeight:700 }}>
                          {n.notifType==="help" ? "SOS - " + (n.driver||"Driver") + " needs help" : ""}
                          {n.notifType!=="help" ? n.notifType.charAt(0).toUpperCase()+n.notifType.slice(1)+" - #"+n.orderId : ""}
                        </div>
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:11 }}>
                          {smartTime(n.time)}
                        </div>
                      </div>
                      <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.7)", fontSize:13 }}>{n.notifType==="help" ? n.note : n.customer}</div>
                      {n.notifType==="help" ? (
                        <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginTop:2 }}>
                          #{n.orderId} {n.store ? "- " + n.store : ""}   Driver: <span style={{ color:"#FF5A1F", fontWeight:600 }}>{n.driver}</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginTop:2 }}>
                            {n.store}   <span style={{ color:PAYMENT_COLORS[n.payment]||"#fff" }}>{n.payment}</span>   <span style={{ color:"#FF5A1F", fontWeight:600 }}>{fmt(n.amount)}</span>
                          </div>
                          {n.onlineOrderNo && (
                            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(0,212,255,.7)", fontSize:11, marginTop:2 }}>
                              Online Order No: <span style={{ fontWeight:700, color:"#00D4FF" }}>{n.onlineOrderNo}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {n.notifType!=="help" && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}> Driver: {n.driver}</div>}
                      {n.note && n.notifType!=="help" && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:3, fontStyle:"italic" }}> {n.note}</div>}
                    </div>
                    {!n.read && <div style={{ width:8, height:8, borderRadius:"50%", background:sc.color, flexShrink:0, marginTop:4, boxShadow:"0 0 6px " + (sc.color) }} />}
                  </div>
                </div>
              );
            })}
                </div>
              );
            })()}
          </div>
        )}

        {/*  Vehicles / Expenses Tab  */}
        {tab==="vehicles" && <AdminVehiclesTab orders={orders} expenses={expenses} driverProfiles={driverProfiles} onUpdateDriver={onUpdateDriver} onAddDriver={onAddDriver} passwords={passwords} onSetPassword={onSetPassword} onRemoveOrderAdmin={onRemoveOrderAdmin} onlineDrivers={onlineDrivers} activeDrivers={activeDrivers} />}
        {tab==="civilids" && <AdminCivilIdTab />}
        {tab==="map"      && <LiveMapTab onlineDrivers={onlineDrivers} activeDrivers={activeDrivers} orders={orders} />}
        {tab==="history"  && <AdminHistoryTab history={history} />}

        {tab==="transfers" && (
          <div style={{ padding:"0 16px 80px" }}>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:15, fontWeight:700, marginBottom:4 }}> Transfer Requests</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:16 }}>Review and approve driver transfer requests</div>

            {transfers.length === 0 ? (
              <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:40 }}>No transfer requests yet</div>
            ) : transfers.slice().reverse().map(function(tr) {
              const fromDriver = DRIVERS.find(d => d.id === tr.fromDriverId);
              const toDriver   = DRIVERS.find(d => d.id === tr.toDriverId);
              const isPending  = tr.status === "pending";
              return (
                <div key={tr.id} style={{ background:isPending?"rgba(255,255,255,.05)":"rgba(255,255,255,.02)", border:"1px solid " + (isPending?"rgba(255,90,31,.3)":tr.status==="approved"?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)"), borderRadius:16, padding:16, marginBottom:12 }}>
                  {/* Status banner */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11 }}>{new Date(tr.createdAt).toLocaleTimeString("en-KW", { hour:"2-digit", minute:"2-digit" })}</div>
                    <span style={{ background:isPending?"rgba(245,158,11,.15)":tr.status==="approved"?"rgba(16,185,129,.15)":"rgba(239,68,68,.15)", color:isPending?"#F59E0B":tr.status==="approved"?"#10B981":"#EF4444", borderRadius:20, padding:"3px 10px", fontSize:11, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontWeight:600 }}>
                      {isPending ? " Pending" : tr.status === "approved" ? " Approved" : "x Rejected"}
                    </span>
                  </div>

                  {/* Order info */}
                  <div style={{ background:"rgba(0,0,0,.2)", borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:13, fontWeight:700 }}>{tr.order.customer}</div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:2 }}>#{tr.order.invoiceNo}   {tr.order.store}   {fmt(tr.order.total)}</div>
                  </div>

                  {/* Transfer direction */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:tr.reason?8:12 }}>
                    <div style={{ background:"rgba(255,90,31,.15)", borderRadius:8, padding:"5px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#FF5A1F", fontSize:12, fontWeight:700 }}>{fromDriver?.name || tr.fromDriverId}</div>
                    <span style={{ color:"rgba(255,255,255,.4)", fontSize:14 }}>-></span>
                    <div style={{ background:"rgba(0,212,255,.15)", borderRadius:8, padding:"5px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#00D4FF", fontSize:12, fontWeight:700 }}>{toDriver?.name || tr.toDriverId}</div>
                  </div>

                  {tr.reason && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:12, fontStyle:"italic" }}> "{tr.reason}"</div>}

                  {isPending && (
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => { onRejectTransfer(tr.id); showToast("Transfer rejected"); }}
                        style={{ flex:1, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"10px", color:"#EF4444", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                        x Reject
                      </button>
                      <button onClick={() => { onApproveTransfer(tr.id); showToast(" Order transferred to " + (toDriver?.name) + "!", "success"); }}
                        style={{ flex:2, background:"linear-gradient(135deg,#10B981,#00D4FF)", border:"none", borderRadius:10, padding:"10px", color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                         Approve Transfer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SECTION 18: DRIVER APP SHELL
// Lines: DriverApp — receives orders, expenses, callbacks
// Fix driver dashboard issues here — allMyOrders filter at ~line 5757
// ============================================================
/*  Driver App  */
function DriverApp({ user, orders, expenses, onAddExpense, onUpdateExpense, onDeleteExpense, onScan, onStatusUpdate, onLogout, onRequestTransfer, onRemoveOrder, onRequestHelp, orderTags, onSetTag, onAddOrder, selectedDate, onSetSelectedDate, onEditOrder, onRefresh }) {
  // Wrapper: driver manual orders go through addOrders but also mark as scanned
  const [tab, setTab]               = useState("warehouse");
  // Shim so updateOrderDetails is always in scope
  function updateOrderDetails(idOrInvoice, fields) {
    if (onEditOrder) return onEditOrder(idOrInvoice, fields);
  }
  const [toast, setToast]           = useState(null);
  const [transferOrder, setTransferOrder] = useState(null);
  const [reportData, setReportData] = useState(null);

  function showToast(msg) { setToast({ msg, ttype:"success" }); setTimeout(function() { setToast(null); }, 3000); }

  var allMyOrders = orders.filter(function(o){ return o.driverId === user.id; });
  const todayStr = selectedDate || new Date().toDateString();

  function normToDateStr(d) {
    if (!d) return "";
    if (/^[A-Z][a-z]{2} [A-Z][a-z]{2}/.test(d)) return d;
    var p = d.split("/");
    if (p.length === 3) { var dt = new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0])); if (!isNaN(dt.getTime())) return dt.toDateString(); }
    var iso = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) { var dt2 = new Date(parseInt(iso[1]), parseInt(iso[2])-1, parseInt(iso[3])); if (!isNaN(dt2.getTime())) return dt2.toDateString(); }
    var dt3 = new Date(d); if (!isNaN(dt3.getTime())) return dt3.toDateString();
    return "";
  }

  // First try to get today's orders
  var todayOrders = allMyOrders.filter(function(o) {
    var d = o.assignedDate || o.date || "";
    if (!d) return true; // no date = show
    var norm = normToDateStr(d);
    return !norm || norm === todayStr;
  });

  // If no today orders found, show ALL pending orders (catches date format issues)
  const myOrders = todayOrders.length > 0 ? todayOrders : allMyOrders.filter(function(o) {
    return o.status === "pending" || o.scanned;
  });
  const collected  = myOrders.filter(o => o.scanned && o.status === "pending").length;
  const pending    = myOrders.filter(o => !o.scanned && o.status === "pending").length;
  const _todayStr  = new Date().toDateString();
  const myExpenses = (expenses||[]).filter(function(e) {
    if (e.driverId !== user.id) return false;
    if (!e.createdAt) return false;
    return new Date(e.createdAt).toDateString() === _todayStr;
  });

  function handleTransferRequest(order, from, to, reason) {
    onRequestTransfer(order, from, to, reason);
    setTransferOrder(null);
    showToast("🔄 Transfer request sent!", "warn");
  }

  const TABS = [
    { id:"warehouse", icon:"🏭", label:"Warehouse" },
    { id:"delivery",  icon:"🚚", label:"Delivery", badge: collected },
    { id:"report",    icon:"📊", label:"Report" },
    { id:"expenses",  icon:"💰", label:"Expenses" },
    { id:"dayclose",  icon:"🔒", label:"Day Close" },
    { id:"profile",   icon:"👤", label:"Profile" },
  ];

  return (
    <div style={{ maxWidth:430, margin:"0 auto", background:"#090B10", height:"100dvh", display:"flex", flexDirection:"column", position:"relative", width:"100%" }}>
      {toast && <Toast msg={toast.msg} toastKind={toast.ttype} />}

      {tab==="preview" && reportData && <ReportPreview data={reportData} onClose={() => setTab("report")} />}

      {transferOrder && (
        <TransferModal order={transferOrder} fromDriverId={user.id} onRequestTransfer={handleTransferRequest} onClose={() => setTransferOrder(null)} />
      )}

      {/* ── Driver Header ── */}
      <div style={{ padding:"12px 18px 10px", background:"#090B10", borderBottom:"1px solid rgba(255,255,255,.05)", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <svg viewBox="0 0 200 200" width={30} height={30} xmlns="http://www.w3.org/2000/svg">
              <defs><linearGradient id="dhog" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF5A1F"/><stop offset="100%" stopColor="#FF3D00"/></linearGradient></defs>
              <rect width="200" height="200" rx="44" fill="url(#dhog)"/>
              <polygon points="100,42 154,73 100,104 46,73" fill="white"/>
              <polygon points="46,73 100,104 100,162 46,131" fill="rgba(255,255,255,0.55)"/>
              <polygon points="154,73 100,104 100,162 154,131" fill="rgba(255,255,255,0.32)"/>
              <polygon points="100,42 106,46 106,100 100,104 94,100 94,46" fill="rgba(255,255,255,0.22)"/>
            </svg>
            <div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:800, fontSize:15, letterSpacing:"-0.3px", lineHeight:1.1 }}>
                <span style={{ color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif" }}>DELIVER</span><span style={{ color:"#fff", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif" }}>FLOW</span>
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:10, letterSpacing:"0.5px" }}>
                Hi, <span style={{ color:"rgba(255,255,255,.6)", fontWeight:600 }}>{user.name}</span>
                {myOrders.length > 0 && <span style={{ color:"rgba(255,90,31,.7)", marginLeft:6 }}>· {myOrders.length} orders today</span>}
              </div>
              <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.25)", fontSize:10, marginTop:1 }}>
                {new Date().toLocaleDateString("en-KW", { weekday:"short", day:"numeric", month:"long", year:"numeric" })}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {pending > 0 && (
              <span style={{ background:"rgba(245,158,11,.12)", border:"1px solid rgba(245,158,11,.2)", color:"#F59E0B", borderRadius:20, padding:"4px 10px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, fontWeight:700 }}>
                {pending} to collect
              </span>
            )}
            <button onClick={onLogout}
              style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, padding:"5px 11px", color:"rgba(255,255,255,.4)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:10, fontWeight:600, cursor:"pointer" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* No orders banner */}
      {myOrders.length === 0 && (
        <div style={{ background:"rgba(255,90,31,.06)", borderBottom:"1px solid rgba(255,90,31,.12)", padding:"10px 18px", display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:16 }}>⏳</span>
          <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,90,31,.8)", fontSize:12 }}>Waiting for admin to assign orders…</span>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:"auto", paddingTop:12, display:"flex", flexDirection:"column", WebkitOverflowScrolling:"touch" }}>
        {tab==="warehouse" && <DriverWarehouseTab orders={orders} driverId={user.id}
          onScan={(id) => { onScan(id); showToast("📦 Order collected!", "success"); }}
          onRequestTransfer={handleTransferRequest}
          onOpenTransfer={setTransferOrder}
          onRemoveOrder={function(idOrInvoice) { onRemoveOrder && onRemoveOrder(idOrInvoice); }}
          onRefresh={onRefresh}
        />}
        {/* Date filter for driver */}
        {allMyOrders.length > 0 && (
          <DateFilterBar orders={allMyOrders} selectedDate={selectedDate} onSetSelectedDate={onSetSelectedDate} />
        )}
        {tab==="delivery" && <DriverDeliveryTab orders={orders} driverId={user.id} driverName={user.name}
          onStatusUpdate={(id,status,note,newPay,newTotal,extraAmount) => { onStatusUpdate(id,status,note,newPay,newTotal,extraAmount); showToast((STATUS_CFG[status].icon) + " " + (status),status==="delivered"?"success":"warn"); }}
          onOpenTransfer={setTransferOrder}
          onRequestHelp={function(order,key,label){ onRequestHelp && onRequestHelp(order,key,label,user); }}
          orderTags={orderTags} onSetTag={onSetTag}
          onAddOrder={onAddOrder}
          onEditOrder={onEditOrder}
          selectedDate={selectedDate}
        />}
        {tab==="report"    && <DriverReportTab   orders={myOrders} driverId={user.id} expenses={myExpenses} onOpenReport={(data) => { setReportData(data); setTab("preview"); }} />}
        {tab==="preview"   && reportData && <ReportPreview data={reportData} onClose={() => setTab("report")} />}
        {tab==="dayclose"  && <DayClosingTab orders={allMyOrders} driverId={user.id} driverName={user.name} />}
        {tab==="expenses"  && <DriverExpensesTab  driverId={user.id} driverName={user.name} expenses={myExpenses} orders={myOrders} onAddExpense={onAddExpense} onUpdateExpense={onUpdateExpense} onDeleteExpense={onDeleteExpense} />}
        {tab==="profile"   && <DriverProfileTab   user={user} orders={myOrders} expenses={myExpenses} />}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{ display:"flex", background:"#0F1218", borderTop:"1px solid rgba(255,255,255,.05)", flexShrink:0, paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, background:"none", border:"none", borderTop: tab===t.id?"2.5px solid #FF6B35":"2.5px solid transparent",
              padding:"10px 0 7px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, position:"relative" }}>
            <span style={{ fontSize:17, lineHeight:1, opacity:tab===t.id?1:0.38 }}>{t.icon}</span>
            <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:9, fontWeight:tab===t.id?700:400, color:tab===t.id?"#FF5A1F":"rgba(255,255,255,.28)" }}>{t.label}</span>
            {t.badge > 0 && (
              <div style={{ position:"absolute", top:6, right:"50%", transform:"translateX(120%)", background:"#FF5A1F", borderRadius:10, minWidth:14, height:14, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:8, fontWeight:700, color:"#fff", padding:"0 3px" }}>{t.badge}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SECTION 19: ROOT APP & SUPABASE
// Lines: SUPABASE_URL/KEY, loadSupabaseSDK, getSupabase
// Lines: LS_KEYS, lsGet, lsSet
// Lines: dbLoadOrders, dbUpdateOrder, dbUpsertOrders
// Lines: dbLoadExpenses, dbLoadTransfers, dbUpsertTransfer
// Lines: StoreAdminApp, App (root component)
// Lines: addOrders, markScanned, updateStatus, approveTransfer
// Fix Supabase sync/save issues here
// ============================================================
/*  ROOT  */
// ─── Supabase config - REPLACE with your project values ─────────────────────
const SUPABASE_URL  = "https://ekcldonzncaguwgfooky.supabase.co";
// NOTE: This anon key is safe to expose client-side (by Supabase design)
// but RLS policies MUST be enabled on all tables — see SECURITY.md
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrY2xkb256bmNhZ3V3Z2Zvb2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTI4NTcsImV4cCI6MjA4OTgyODg1N30.Us2eCY-jgo5JIE-Vrl7Z0RyCEr88q2iXMJZk4wo_OSc";

// ─── Supabase SDK loader + client ────────────────────────────────────────────
function loadSupabaseSDK(callback) {
  if (window.supabase) { callback(); return; }
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  s.onload = callback;
  s.onerror = function() { console.warn("Failed to load Supabase SDK"); };
  document.head.appendChild(s);
}

function getSupabase() {
  if (window._supabase) return window._supabase;
  if (window.supabase && window.supabase.createClient) {
    window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    return window._supabase;
  }
  return null;
}

// ─── localStorage fallback helpers ───────────────────────────────────────────
const LS_KEYS = {
  orders: "df_orders",
  transfers: "df_transfers",
  expenses: "df_expenses",
  driverProfiles: "df_driver_profiles",
  drivers: "df_drivers",
  lastClearDate: "df_last_clear_date",
  history: "df_daily_history",
  session: "df_session",
  passwords: "df_passwords",
  notifs: "df_admin_notifs",
  seenStatuses: "df_seen_statuses",
};
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch(e) { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

// ─── Supabase DB helpers ──────────────────────────────────────────────────────
async function dbLoadOrders() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: true });
  if (error) { console.warn("Supabase load orders:", error.message); return null; }
  return data.map(function(r) {
    var cust = r.customer || "";
    var oo   = r.online_order_no || "";
    // Legacy fix: purely numeric customer = was OO number misidentified as customer
    if (/^\d{4,12}$/.test(cust) && !oo) { oo = cust; cust = "Unknown"; }
    return {
    id: r.id, invoiceNo: r.invoice_no, onlineOrderNo: oo,
    date: r.date, assignedDate: (function(){
      if (r.assigned_date) return r.assigned_date;
      // Fall back to updated_at date (when admin assigned = last update time)
      if (r.updated_at) {
        var d = new Date(r.updated_at);
        return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();
      }
      return r.date || "";
    })(), store: r.store, customer: cust,
    address: r.address, phone: r.phone, total: Number(r.total),
    paymentType: r.payment_type, originalPaymentType: r.original_payment_type||"",
    status: r.status, driverId: r.driver_id, scanned: r.scanned||false,
    note: r.note||"", deliveredAt: r.delivered_at, updatedAt: r.updated_at,
  }; });
}

async function dbUpsertOrders(orders) {
  const sb = getSupabase();
  if (!sb) return;
  const rows = orders.map(function(o) { return {
    id: o.id, invoice_no: o.invoiceNo, online_order_no: o.onlineOrderNo||"",
    date: o.date, store: o.store, customer: o.customer,
    address: o.address||"", phone: o.phone||"", total: o.total,
    payment_type: o.paymentType, original_payment_type: o.originalPaymentType||"",
    status: o.status, driver_id: o.driverId, scanned: o.scanned||false,
    note: o.note||"", updated_at: new Date().toISOString(),
  }; });
  const { error } = await sb.from("orders").upsert(rows, { onConflict: "id" });
  if (error) console.warn("Supabase upsert orders:", error.message);
}

async function dbUpdateOrder(id, fields, invoiceNo) {
  const sb = getSupabase();
  if (!sb) return;
  const row = {};
  var DB_VALID_STATUSES = ["delivered","cancelled","postponed","pending"];
  if (fields.status !== undefined && DB_VALID_STATUSES.includes(fields.status)) row.status = fields.status;
  if (fields.driverId !== undefined)    row.driver_id = fields.driverId;
  if (fields.scanned !== undefined)     row.scanned = fields.scanned;
  if (fields.note !== undefined)        row.note = String(fields.note||"").slice(0, 500);
  if (fields.paymentType !== undefined) row.payment_type = fields.paymentType;
  if (fields.originalPaymentType !== undefined) row.original_payment_type = fields.originalPaymentType;
  if (fields.total !== undefined && typeof fields.total === "number" && fields.total >= 0 && fields.total <= 99999) row.total = fields.total;
  if (fields.assignedDate !== undefined) row.assigned_date = fields.assignedDate;
  if (fields.extraAmount !== undefined)  row.extra_amount = fields.extraAmount;
  row.updated_at = new Date().toISOString();

  // Try update by id first
  const { data, error } = await sb.from("orders").update(row).eq("id", id).select("id");
  if (error) { console.warn("Supabase update order by id:", error.message); }

  // If no rows matched (id not in DB), fallback to invoice_no
  if (!error && (!data || data.length === 0) && invoiceNo) {
    const { error: e2 } = await sb.from("orders").update(row).eq("invoice_no", invoiceNo);
    if (e2) console.warn("Supabase update order by invoice_no:", e2.message);
  }
}

async function dbLoadExpenses() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("expenses").select("*").order("created_at", { ascending: false });
  if (error) { console.warn("Supabase load expenses:", error.message); return null; }
  return data.map(function(r) { return {
    id: r.id, driverId: r.driver_id, driverName: r.driver_name||"",
    type: r.type, amount: Number(r.amount), note: r.note||"",
    createdAt: r.created_at,
  }; });
}

async function dbUpdateExpense(id, fields) {
  var sb = getSupabase();
  if (!sb) return;
  var row = {};
  if (fields.type !== undefined)   row.type   = fields.type;
  if (fields.amount !== undefined) row.amount = fields.amount;
  if (fields.note !== undefined)   row.note   = fields.note;
  var result = await sb.from("expenses").update(row).eq("id", id);
  if (result.error) console.warn("Expense update err:", result.error.message);
}

async function dbDeleteExpense(id) {
  var sb = getSupabase();
  if (!sb) return;
  await sb.from("expenses").delete().eq("id", id);
}

async function dbInsertExpense(exp) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("expenses").insert({
    id: exp.id, driver_id: exp.driverId, driver_name: exp.driverName||"",
    type: exp.type, amount: exp.amount, note: exp.note||"",
    created_at: exp.createdAt||new Date().toISOString(),
  });
  if (error) console.warn("Supabase insert expense:", error.message);
}

async function dbLoadTransfers() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("transfers").select("*").order("created_at", { ascending: false });
  if (error) { console.warn("Supabase load transfers:", error.message); return null; }
  return data.map(function(r) { return {
    id: r.id, order: r.order_data ? JSON.parse(r.order_data) : {},
    fromDriverId: r.from_driver_id, toDriverId: r.to_driver_id,
    reason: r.reason||"", status: r.status,
  }; });
}

async function dbUpsertTransfer(tr) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("transfers").upsert({
    id: tr.id, order_data: JSON.stringify(tr.order||{}),
    from_driver_id: tr.fromDriverId, to_driver_id: tr.toDriverId,
    reason: tr.reason||"", status: tr.status,
  }, { onConflict: "id" });
  if (error) console.warn("Supabase upsert transfer:", error.message);
}

async function dbLoadDriverProfiles() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("driver_profiles").select("*");
  if (error) { console.warn("Supabase load drivers:", error.message); return null; }
  const profiles = {};
  data.forEach(function(r) {
    profiles[r.id] = {
      id: r.id, name: r.name, avatar: r.avatar||"", phone: r.phone||"",
      status: r.status||"active", vehicleType: r.vehicle_type||"Car",
      vehicleNo: r.vehicle_no||"", licenseNo: r.license_no||"",
      nationality: r.nationality||"", joinDate: r.join_date||"",
      daftarExpiry: r.daftar_expiry||"",
    };
  });
  return profiles;
}

async function dbUpsertDriverProfile(id, fields) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("driver_profiles").upsert({
    id, name: fields.name||id, avatar: fields.avatar||"",
    phone: fields.phone||"", status: fields.status||"active",
    vehicle_type: fields.vehicleType||"Car", vehicle_no: fields.vehicleNo||"",
    license_no: fields.licenseNo||"", nationality: fields.nationality||"",
    join_date: fields.joinDate||"", daftar_expiry: fields.daftarExpiry||"",
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) console.warn("Supabase upsert driver:", error.message);
}

const DEFAULT_PROFILES = {
  asif:      { vehicleType:"Car",  vehicleNo:"", licenseNo:"", nationality:"Indian",    phone:"+96555001001", status:"active", joinDate:"2023-01-15", daftarExpiry:"2026-08-01", avatar:"AS" },
  jasir:     { vehicleType:"Van",  vehicleNo:"", licenseNo:"", nationality:"Pakistani", phone:"+96555001002", status:"active", joinDate:"2022-06-10", daftarExpiry:"2026-11-15", avatar:"JA" },
  prathyush: { vehicleType:"Bike", vehicleNo:"", licenseNo:"", nationality:"Indian",    phone:"+96555001003", status:"active", joinDate:"2024-03-01", daftarExpiry:"2025-12-31", avatar:"PR" },
  iqbal:     { vehicleType:"Car",  vehicleNo:"", licenseNo:"", nationality:"Pakistani", phone:"+96555001004", status:"active", joinDate:"2021-09-20", daftarExpiry:"2027-03-10", avatar:"IQ" },
};


function StoreAdminApp({ user, orders, adminNotifs, onMarkNotifRead, onClearNotifs, onlineDrivers, activeDrivers, onLogout }) {
  const myStore = user.store;
  const myNotifs = adminNotifs.filter(function(n) { return n.store === myStore; });
  const unread = myNotifs.filter(function(n){ return !n.read; }).length;

  return (
    <div style={{ height:"100dvh", background:"#090B10", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", width:"100%", position:"relative" }}>
      {/* Header */}
      <div style={{ padding:"16px 20px 12px", background:"#090B10", borderBottom:"1px solid rgba(255,255,255,.06)", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:18, fontWeight:800 }}>DeliverFlow</div>
            <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>{myStore} · Store Admin</div>
          </div>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:8, padding:"5px 10px", color:"rgba(255,255,255,.5)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:11, cursor:"pointer" }}>Sign Out</button>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:10, overflowX:"auto" }}>
          {DRIVERS.filter(function(d){ return d.status !== "inactive"; }).map(function(d) {
            var isOnline = onlineDrivers && onlineDrivers[d.id];
            var isActive = activeDrivers && activeDrivers[d.id];
            return (
              <div key={d.id} style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:isOnline?"#10B981":"#374151",
                  boxShadow:isOnline?"0 0 6px #10B981":"none",
                  animation:(isOnline&&isActive)?"pulse 1.2s ease-in-out infinite":"none" }} />
                <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:isOnline?"#10B981":"rgba(255,255,255,.3)", fontSize:11 }}>{d.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 40px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:"#fff", fontSize:16, fontWeight:700 }}>
            {myStore} Updates
            {unread > 0 && <span style={{ background:"#EF4444", color:"#fff", borderRadius:20, padding:"2px 8px", fontSize:11, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", marginLeft:8 }}>{unread}</span>}
          </div>
          {myNotifs.length > 0 && (
            <button onClick={onClearNotifs} style={{ background:"none", border:"none", color:"#FF5A1F", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", fontSize:12, cursor:"pointer" }}>Mark all read</button>
          )}
        </div>

        {myNotifs.length === 0 ? (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,.3)", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", padding:40 }}>No updates yet for {myStore}</div>
        ) : myNotifs.map(function(n) {
          var sc = STATUS_CFG[n.notifType] || STATUS_CFG.pending;
          var isHelp = n.notifType === "help";
          return (
            <div key={n.id} onClick={function(){ onMarkNotifRead(n.id); }}
              style={{ background:isHelp?(n.read?"rgba(239,68,68,.05)":"rgba(239,68,68,.1)"):(n.read?"rgba(255,255,255,.03)":"rgba(255,255,255,.07)"),
                border:"1px solid "+(isHelp?"rgba(239,68,68,"+(n.read?".2)":".5)"):(n.read?"rgba(255,255,255,.06)":sc.color+"44")),
                borderRadius:14, padding:14, marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                {(function() {
                  if (isHelp) {
                    return <div style={{ width:40, height:40, borderRadius:12, background:"rgba(239,68,68,.15)", border:"1.5px solid rgba(239,68,68,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontWeight:800, color:"#EF4444", boxShadow:"0 0 12px rgba(239,68,68,.5), 0 0 24px rgba(239,68,68,.2)" }}>SOS</div>;
                  }
                  const statusColors = {
                    delivered: { face:"#10B981", side:"#059669", base:"#047857", glow:"34,197,94" },
                    postponed: { face:"#8B5CF6", side:"#7C3AED", base:"#6D28D9", glow:"139,92,246" },
                    cancelled: { face:"#EF4444", side:"#DC2626", base:"#B91C1C", glow:"239,68,68" },
                  };
                  const sc2 = statusColors[n.notifType] || { face:"#6B7280", side:"#4B5563", base:"#374151", glow:"107,114,128" };
                  const letter = (n.notifType||"?").charAt(0).toUpperCase();
                  return (
                    <div style={{ position:"relative", width:40, height:40, flexShrink:0 }}>
                      <div style={{ position:"absolute", inset:-6, borderRadius:18, background:"rgba("+sc2.glow+",.3)", filter:"blur(8px)" }} />
                      <div style={{ position:"relative", width:40, height:40, borderRadius:12, background:sc2.face, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 1px rgba(255,255,255,.15) inset" }}>
                        <span style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", fontSize:22, fontWeight:800, color:"#fff", lineHeight:1 }}>{letter}</span>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif", color:isHelp?"#EF4444":(n.read?"rgba(255,255,255,.5)":sc.color), fontSize:13, fontWeight:700 }}>
                      {isHelp ? "SOS - "+n.driver+" needs help" : n.notifType.charAt(0).toUpperCase()+n.notifType.slice(1)+" - #"+n.orderId}
                    </div>
                    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.3)", fontSize:11 }}>
                      {smartTime(n.time)}
                    </div>
                  </div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.7)", fontSize:13 }}>{isHelp ? n.note : n.customer}</div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12, marginTop:2 }}>
                    {isHelp ? "Order #"+n.orderId+" · Driver: "+n.driver : n.payment+" · KD "+Number(n.amount).toFixed(3)}
                  </div>
                  <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.4)", fontSize:12 }}>Driver: {n.driver}</div>
                  {n.note && !isHelp && <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif", color:"rgba(255,255,255,.35)", fontSize:11, marginTop:3, fontStyle:"italic" }}>{n.note}</div>}
                </div>
                {!n.read && <div style={{ width:8, height:8, borderRadius:"50%", background:sc.color, flexShrink:0, marginTop:4, boxShadow:"0 0 6px "+sc.color }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.App = function App() {
  const [user, setUser] = useState(function() {
    var session = lsGet(LS_KEYS.session, null);
    // Validate session token — rejects manually edited localStorage
    return validateSession(session);
  });
  const [orders, setOrders]           = useState(function() { return lsGet(LS_KEYS.orders, []); });
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  // Smart date: keep today selected always (new day = fresh start)
  // Don't auto-switch — let users see the empty state for today and tap date filter for history
  const [transfers, setTransfers]     = useState(function() { return lsGet(LS_KEYS.transfers, []); });
  const [adminNotifs, setAdminNotifs] = useState(function(){ return lsGet(LS_KEYS.notifs, []); });
  const prevNotifCount = React.useRef(0);
  useEffect(function() {
    // Persist notifications
    lsSet(LS_KEYS.notifs, adminNotifs.slice(0, 100)); // keep last 100
    // Play sound for new unread
    var unread = adminNotifs.filter(function(n){ return !n.read; }).length;
    if (unread > prevNotifCount.current) {
      var newest = adminNotifs[0];
      if (newest && !newest.read) {
        playSound(newest.notifType === "help" ? "help" : "notify");
      }
    }
    prevNotifCount.current = unread;
  }, [adminNotifs]);
  const [expenses, setExpenses]       = useState(function() { return lsGet(LS_KEYS.expenses, []); });
  const [driverProfiles, setDriverProfiles] = useState(function() { return lsGet(LS_KEYS.driverProfiles, DEFAULT_PROFILES); });
  const [saveStatus, setSaveStatus]   = useState("");
  const [clearConfirm, setClearConfirm] = useState(false);
  const [onlineDrivers, setOnlineDrivers] = useState({});
  const [activeDrivers, setActiveDrivers] = useState({}); // drivers actively using browser
  const [history, setHistory] = useState(function() { return lsGet(LS_KEYS.history, []); });
  const [passwords, setPasswords] = useState(function() { return lsGet(LS_KEYS.passwords, {}); });
  useEffect(function() { lsSet(LS_KEYS.passwords, passwords); }, [passwords]);
  const [orderTags, setOrderTags] = useState(function() { return lsGet("df_order_tags", {}); });
  useEffect(function() { lsSet("df_order_tags", orderTags); }, [orderTags]);
  function setTag(invoiceNo, tag) { setOrderTags(function(p){ var n={...p}; if(tag) n[invoiceNo]=tag; else delete n[invoiceNo]; return n; }); }
  useEffect(function() { lsSet(LS_KEYS.history, history); }, [history]);
  const [dbConnected, setDbConnected] = useState(false);
  const [syncing, setSyncing]         = useState(false);

  // ── Auto-save to localStorage (offline cache) ─────────────────────────────
  useEffect(function() { lsSet(LS_KEYS.orders, orders); }, [orders]);
  useEffect(function() { if (user) { lsSet(LS_KEYS.session, user); } else { lsSet(LS_KEYS.session, null); } }, [user]);
  useEffect(function() { lsSet(LS_KEYS.transfers, transfers); }, [transfers]);
  useEffect(function() { lsSet(LS_KEYS.expenses, expenses); }, [expenses]);
  useEffect(function() { lsSet(LS_KEYS.driverProfiles, driverProfiles); }, [driverProfiles]);

  // ── Auto-clear at midnight ────────────────────────────────────────────────
  // Midnight auto-clear removed — data is kept permanently with day filter

  // ── Load Supabase SDK + Realtime subscriptions (once on mount) ───────────
  useEffect(function() {
    if (SUPABASE_URL.includes("YOUR_PROJECT")) {
      console.log("Supabase not configured - using localStorage only");
      return;
    }

    function setupRealtime() {
      var sb = getSupabase();
      if (!sb) { console.warn("Supabase SDK not ready"); return; }

      // Realtime: orders table
      sb.channel("orders-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, function(payload) {
          setOrders(function(prev) {
            if (payload.eventType === "DELETE") {
              return prev.filter(function(o) { return o.id !== payload.old.id; });
            }
            var r = payload.new;
            // Only process if record already exists in state (UPDATE only)
            // Never add new records from realtime INSERT — that causes duplication
            // New records are added by addOrders() directly
            var exists = prev.find(function(o) { return o.id === r.id; });
            if (!exists) {
              if (payload.eventType === "INSERT") {
                // Check if we already have this EXACT record (same id)
                // Don't block by invoiceNo — same invoice can appear on different days
                // Allow through so drivers receive new manual orders immediately
              } else {
                return prev; // UPDATE but id not found — skip
              }
            }
            var fixedCustomer = r.customer || "";
            var fixedOO = r.online_order_no || "";
            if (/^\d{4,12}$/.test(fixedCustomer) && !fixedOO) {
              fixedOO = fixedCustomer;
              fixedCustomer = "Unknown";
            }
            var updated = {
              id: r.id, invoiceNo: r.invoice_no, onlineOrderNo: fixedOO || (exists && exists.onlineOrderNo) || "",
              date: r.date, assignedDate: (function(){
                if (r.assigned_date) return r.assigned_date;
                if (r.updated_at) { var d=new Date(r.updated_at); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); }
                return r.date || "";
              })(), store: r.store, customer: fixedCustomer,
              address: r.address, phone: r.phone, total: Number(r.total),
              paymentType: r.payment_type, originalPaymentType: r.original_payment_type||"",
              status: r.status, driverId: r.driver_id, scanned: r.scanned||false,
              note: r.note||"",
            };
            // Generate admin notification for status changes from other devices
            var ALERT_STATUSES = ["delivered","cancelled","postponed"];
            if (payload.eventType === "UPDATE" && exists && exists.status !== r.status && ALERT_STATUSES.indexOf(r.status) !== -1) {
              var seenKey = r.invoice_no + ":" + r.status;
              var seen = lsGet(LS_KEYS.seenStatuses, {});
              if (!seen[seenKey]) {
                seen[seenKey] = true;
                lsSet(LS_KEYS.seenStatuses, seen);
                var drvName = (DRIVERS.find(function(d){ return d.id===r.driver_id; })||{}).name || r.driver_id;
                setAdminNotifs(function(prev2) {
                  var newNotif = {
                    id: uid(), notifType: r.status, orderId: r.invoice_no,
                    onlineOrderNo: r.online_order_no||"",
                    customer: r.customer, store: r.store, amount: Number(r.total),
                    payment: r.payment_type, driver: drvName, note: r.note||"",
                    icon: STATUS_CFG[r.status] ? STATUS_CFG[r.status].icon : "", read: false,
                    time: new Date().toISOString(),
                  };
                  var combined = [newNotif, ...prev2];
                  lsSet(LS_KEYS.notifs, combined.slice(0, 100));
                  return combined;
                });
                playSound("notify");
              }
            }
            if (exists) return prev.map(function(o) { return o.id === r.id ? Object.assign({}, o, updated) : o; });
            // For INSERT: deduplicate by id before adding
            if (prev.some(function(o) { return o.id === updated.id; })) return prev;
            return [...prev, updated];
          });
        }).subscribe();

      // Realtime: expenses table
      sb.channel("expenses-changes")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "expenses" }, function(payload) {
          var r = payload.new;
          var newExp = { id: r.id, driverId: r.driver_id, driverName: r.driver_name||"", type: r.type, amount: Number(r.amount), note: r.note||"", createdAt: r.created_at };
          setExpenses(function(prev) {
            if (prev.find(function(e) { return e.id === r.id; })) return prev;
            return [newExp, ...prev];
          });
        }).subscribe();

      // Realtime: help_requests
      sb.channel("help-requests-changes")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "help_requests" }, function(payload) {
          var r = payload.new;
          setAdminNotifs(function(prev) {
            if (prev.find(function(n) { return n.id === r.id; })) return prev;
            var n = [{
              id: r.id, notifType: "help", helpKey: r.help_key,
              orderId: r.invoice_no, customer: r.customer, store: r.store || "",
              amount: 0, payment: "", driver: r.driver_name, note: r.help_label,
              icon: "SOS", read: false, time: r.created_at || new Date().toISOString(),
            }, ...prev];
            lsSet(LS_KEYS.notifs, n.slice(0, 100));
            return n;
          });
          playSound("help");
        }).subscribe();
    }

    loadSupabaseSDK(setupRealtime);
    return function() {};
  }, []);

  // ── Fetch DB data + recover missed notifications on every login ───────────
  useEffect(function() {
    if (!user) return; // only run when logged in
    if (SUPABASE_URL.includes("YOUR_PROJECT")) return;

    function runFetch() {
      var sb = getSupabase();
      if (!sb) return;
      setSyncing(true);
      Promise.all([
        dbLoadOrders(),
        dbLoadExpenses(),
        dbLoadTransfers(),
        dbLoadDriverProfiles(),
      ]).then(function(results) {
        var dbOrders = results[0], dbExpenses = results[1], dbTransfers = results[2], dbProfiles = results[3];

        if (dbOrders && dbOrders.length > 0) {
          var localOrders = lsGet(LS_KEYS.orders, []);
          var dbById = {};
          dbOrders.forEach(function(o) { if (o.id) dbById[o.id] = o; });

          // Log for debugging driver order issues
          if (user && user.role === "driver") {
            var myDbOrders = dbOrders.filter(function(o) { return o.driverId === user.id; });
            console.log("DB LOAD — Total:", dbOrders.length, "My orders:", myDbOrders.length, "Driver:", user.id);
            if (myDbOrders.length > 0) console.log("Sample order:", JSON.stringify(myDbOrders[0]).slice(0,150));
          };

          var finalOrders;
          if (user && user.role === "driver") {
            // Drivers: DB is single source of truth — no local merge
            finalOrders = dbOrders;
          } else {
            // Admin: add local-only orders not yet in DB
            var localOOMap = {};
            localOrders.forEach(function(o) { if (o.invoiceNo && o.onlineOrderNo) localOOMap[o.invoiceNo] = o.onlineOrderNo; });
            var merged2 = dbOrders.map(function(o) {
              if (!o.onlineOrderNo && localOOMap[o.invoiceNo]) return Object.assign({}, o, { onlineOrderNo: localOOMap[o.invoiceNo] });
              return o;
            });
            var localOnly = localOrders.filter(function(o) { return o.id && !dbById[o.id]; });
            if (localOnly.length > 0) {
              merged2 = merged2.concat(localOnly);
              var sbSync = getSupabase();
              if (sbSync) {
                var syncRows = localOnly.map(function(o) { return {
                  id: o.id, invoice_no: o.invoiceNo, online_order_no: o.onlineOrderNo||"",
                  date: o.date||"", assigned_date: o.assignedDate||"", store: o.store||"",
                  customer: o.customer||"", address: o.address||"", phone: o.phone||"",
                  total: o.total||0, payment_type: o.paymentType||"Cash",
                  original_payment_type: o.originalPaymentType||"", status: o.status||"pending",
                  driver_id: o.driverId||null, scanned: o.scanned||false, note: o.note||"",
                  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                }; });
                sbSync.from("orders").upsert(syncRows, { onConflict: "id" }).then(function(){}, function(){});
              }
            }
            var seen2 = new Set();
            finalOrders = merged2.filter(function(o) { if (!o.id||seen2.has(o.id)) return false; seen2.add(o.id); return true; });
          }

          setOrders(finalOrders);
          lsSet(LS_KEYS.orders, finalOrders);

          // ── Missed-notification recovery ─────────────────────────────────
          // Only run for admin — drivers don't need notifications
          if (user && user.role === "admin") {
          var ALERT_STATUSES = ["delivered","cancelled","postponed"];
          var seenStatuses = lsGet(LS_KEYS.seenStatuses, {});
          var existingNotifs = lsGet(LS_KEYS.notifs, []);
          var missedNotifs = [];

          finalOrders.forEach(function(o) {
            if (ALERT_STATUSES.indexOf(o.status) === -1) return;
            var key = o.invoiceNo + ":" + o.status;
            if (seenStatuses[key]) return;
            var alreadySaved = existingNotifs.some(function(n) {
              return n.orderId === o.invoiceNo && n.notifType === o.status;
            });
            if (alreadySaved) { seenStatuses[key] = true; return; }
            var drvName = (DRIVERS.find(function(d){ return d.id === o.driverId; })||{}).name || o.driverId || "Driver";
            missedNotifs.push({
              id: uid(),
              notifType: o.status,
              orderId: o.invoiceNo,
              onlineOrderNo: o.onlineOrderNo || "",
              customer: o.customer,
              store: o.store,
              amount: o.total,
              payment: o.paymentType,
              driver: drvName,
              note: o.note || "",
              icon: STATUS_CFG[o.status] ? STATUS_CFG[o.status].icon : "📋",
              read: false,
              time: o.updatedAt || o.deliveredAt || new Date().toISOString(),
            });
            seenStatuses[key] = true;
          });

          lsSet(LS_KEYS.seenStatuses, seenStatuses);

          if (missedNotifs.length > 0) {
            missedNotifs.sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
            setAdminNotifs(function(prev) {
              var combined = missedNotifs.concat(prev);
              lsSet(LS_KEYS.notifs, combined.slice(0, 100));
              return combined.slice(0, 100);
            });
            playSound("notify");
          }
          } // end admin-only
          // ─────────────────────────────────────────────────────────────────
        }

        if (dbExpenses && dbExpenses.length > 0)  { setExpenses(dbExpenses);   lsSet(LS_KEYS.expenses, dbExpenses); }
        if (dbTransfers && dbTransfers.length > 0) { setTransfers(dbTransfers); lsSet(LS_KEYS.transfers, dbTransfers); }
        if (dbProfiles) {
          Object.keys(dbProfiles).forEach(function(id) {
            var p = dbProfiles[id];
            var idx = DRIVERS.findIndex(function(d) { return d.id === id; });
            if (idx >= 0) { DRIVERS[idx] = Object.assign({}, DRIVERS[idx], p); }
            else { DRIVERS.push(p); }
          });
          setDriverProfiles(dbProfiles);
          lsSet(LS_KEYS.driverProfiles, dbProfiles);
        }
        setDbConnected(true);
        setSyncing(false);
      }).catch(function(err) {
        console.warn("Supabase load failed, using cache:", err);
        setSyncing(false);
      });
    }

    loadSupabaseSDK(runFetch);

    // Auto-cleanup: delete orders older than 7 days from Supabase
    // Runs once per session, only for admin users
    if (user && user.role === "admin") {
      loadSupabaseSDK(function() {
        var sbClean = getSupabase && getSupabase();
        if (!sbClean) return;
        var cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        sbClean.from("orders").delete().lt("created_at", cutoff)
          .then(function(res) {
            if (res && res.error) console.warn("Cleanup err:", res.error.message);
          }, function(){});
      });
    }
  }, [user]);

  // ── Polling fallback (every 30s) — read-only, never writes to DB ──────────
  useEffect(function() {
    if (!user) return;
    var pollInterval = setInterval(function() {
      if (!user) return;
      dbLoadOrders().then(function(data) {
        if (!data || data.length === 0) return;
        setOrders(function(prev) {
          // Build map of DB records by their unique id
          var dbById = {};
          data.forEach(function(o) { if (o.id) dbById[o.id] = o; });

          // Keep local-only records (not yet saved to DB — no matching id)
          var localOnly = prev.filter(function(o) { return o.id && !dbById[o.id]; });

          // Merge: DB is source of truth, append local-only
          var merged = data.concat(localOnly);

          // Deduplicate by id
          var seenIds = new Set();
          merged = merged.filter(function(o) {
            if (!o.id || seenIds.has(o.id)) return false;
            seenIds.add(o.id);
            return true;
          });

          // Only update state if something actually changed
          var prevMap = {};
          prev.forEach(function(o) { if (o.id) prevMap[o.id] = o.status + "|" + o.driverId + "|" + o.scanned; });
          var changed = merged.length !== prev.length || merged.some(function(o) {
            return !prevMap[o.id] || prevMap[o.id] !== (o.status + "|" + o.driverId + "|" + o.scanned);
          });
          if (!changed) return prev;
          lsSet(LS_KEYS.orders, merged);
          return merged;
        });
      }).catch(function(){});
    }, 30000);
    return function() { clearInterval(pollInterval); };
  }, [user]);

  // ── Driver online presence tracking ───────────────────────────────────────
  // Rule: Driver is ONLINE if they have logged in and NOT explicitly signed out.
  // Minimizing / locking phone / closing browser tab does NOT set offline.
  // ONLY tapping Sign Out sets offline.
  useEffect(function() {
    if (SUPABASE_URL.includes("YOUR_PROJECT")) return;
    if (!user) {
      // User signed out — mark offline in DB
      setOnlineDrivers({});
      setActiveDrivers({});
      if (window._presenceInterval) { clearInterval(window._presenceInterval); window._presenceInterval = null; }
      var sb = getSupabase();
      if (sb && window._presenceDriverId) {
        sb.from("driver_presence").upsert({
          driver_id: window._presenceDriverId,
          driver_name: window._presenceDriverName || "",
          online: false,
          active: false,
          updated_at: new Date().toISOString()
        }, { onConflict: "driver_id" }).then(function(){}, function(){});
        window._presenceDriverId = null;
        window._presenceDriverName = null;
      }
      return;
    }

    // Cache driver ID immediately (before SDK loads) so sign-out can always find it
    if (user.role === "driver") {
      window._presenceDriverId = user.id;
      window._presenceDriverName = user.name;
    }

    loadSupabaseSDK(function() {
      var sb = getSupabase();
      if (!sb) return;

      // Driver: mark online immediately on login. No expiry — stays online until sign-out.
      if (user.role === "driver") {
        function markPresence(isActive, lat, lng, area) {
          var presenceData = {
            driver_id: user.id,
            driver_name: user.name,
            online: true,
            active: isActive,
            updated_at: new Date().toISOString()
          };
          if (lat !== undefined && lng !== undefined) {
            presenceData.latitude = lat;
            presenceData.longitude = lng;
            presenceData.area = area || "";
          }
          sb.from("driver_presence").upsert(presenceData, { onConflict: "driver_id" })
            .then(function(){}, function(){});
        }

        // Get GPS location and update presence
        function updateWithLocation(isActive) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
              var lat = pos.coords.latitude;
              var lng = pos.coords.longitude;
              // Reverse geocode using free Nominatim API
              fetch("https://nominatim.openstreetmap.org/reverse?lat=" + lat + "&lon=" + lng + "&format=json&addressdetails=1")
                .then(function(r) { return r.json(); })
                .then(function(data) {
                  var addr = data.address || {};
                  var area = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || "";
                  markPresence(isActive, lat, lng, area);
                })
                .catch(function() { markPresence(isActive, lat, lng, ""); });
            }, function() {
              // Location denied — mark presence without location
              markPresence(isActive);
            }, { timeout: 10000, maximumAge: 30000 });
          } else {
            markPresence(isActive);
          }
        }

        updateWithLocation(!document.hidden);
        document.addEventListener("visibilitychange", function() {
          updateWithLocation(!document.hidden);
        });
        // Ping every 30s with fresh location
        var iv = setInterval(function(){ updateWithLocation(!document.hidden); }, 30000);
        window._presenceInterval = iv;
      }

      // Admin + StoreAdmin: poll driver_presence table every 10s
      if (user.role === "admin" || user.role === "storeadmin") {
        function pollPresence() {
          sb.from("driver_presence").select("*").then(function(res) {
            if (!res || !res.data) return;
            var online = {};
            var active = {};
            res.data.forEach(function(row) {
              if (row.driver_id === "__upcoming__") return;
              if (row.online) {
                online[row.driver_id] = {
                  name: row.driver_name,
                  online_at: row.updated_at,
                  latitude: row.latitude || null,
                  longitude: row.longitude || null,
                  area: row.area || "",
                };
                var age = row.updated_at ? (Date.now() - new Date(row.updated_at).getTime()) : 999999;
                if (row.active && age < 45000) active[row.driver_id] = true;
              }
            });
            setOnlineDrivers(online);
            setActiveDrivers(active);
          }).catch(function(){});
        }
        pollPresence();
        var pollIv = setInterval(pollPresence, 10000);
        window._presenceInterval = pollIv;
      }
    });
  }, [user]);

  function addDriver(newDriver) {
    setDriverProfiles(function(prev) { return { ...prev, [newDriver.id]: newDriver }; });
    if (!DRIVERS.find(function(d) { return d.id === newDriver.id; })) DRIVERS.push(newDriver);
    dbUpsertDriverProfile(newDriver.id, newDriver);
  }

  function updateDriverProfile(driverId, fields) {
    setDriverProfiles(function(prev) { return { ...prev, [driverId]: { ...prev[driverId], ...fields } }; });
    var idx = DRIVERS.findIndex(function(d) { return d.id === driverId; });
    if (idx >= 0) DRIVERS[idx] = { ...DRIVERS[idx], ...fields };
    dbUpsertDriverProfile(driverId, fields);
  }

  // ── Clear all data for new day ────────────────────────────────────────────
  function saveHistorySnapshot(currentOrders, currentExpenses) {
    if (!currentOrders || currentOrders.length === 0) return;
    var dateStr = new Date().toLocaleDateString("en-KW", { day:"numeric", month:"short", year:"numeric" });
    var snap = { date: dateStr, timestamp: new Date().toISOString(), drivers: [] };

    DRIVERS.forEach(function(d) {
      var dOrds = currentOrders.filter(function(o) { return o.driverId === d.id; });
      if (dOrds.length === 0) return;
      var delivered  = dOrds.filter(function(o) { return o.status === "delivered"; });
      var cancelled  = dOrds.filter(function(o) { return o.status === "cancelled"; });
      var postponed  = dOrds.filter(function(o) { return o.status === "postponed"; });
      var pending    = dOrds.filter(function(o) { return o.status === "pending"; });
      var exchange   = dOrds.filter(function(o) { return isExchange(o.paymentType); });
      var nonExDel   = delivered.filter(function(o) { return !isExchange(o.paymentType) && !isExchange(o.originalPaymentType); });
      var cashCOD    = delivered.filter(function(o) { return (o.paymentType==="Cash"||o.paymentType==="COD") && !o.originalPaymentType; }).reduce(function(a,o) { return a+Number(o.total); }, 0);
      var dExp       = (currentExpenses||[]).filter(function(e) { return e.driverId === d.id; });
      var totalExp   = dExp.reduce(function(a,e) { return a+Number(e.amount); }, 0);
      var comm       = calcCommission(nonExDel.length);
      var expBreakdown = {};
      dExp.forEach(function(e) { expBreakdown[e.type] = (expBreakdown[e.type]||0) + Number(e.amount); });

      snap.drivers.push({
        id: d.id, name: d.name, avatar: d.avatar,
        totalAssigned: dOrds.length,
        delivered: delivered.length,
        cancelled: cancelled.length,
        postponed: postponed.length,
        pending: pending.length,
        exchange: exchange.length,
        nonExDelivered: nonExDel.length,
        cashCollected: cashCOD,
        commissionEarned: comm.earned,
        commissionAmount: comm.amount,
        vehicleExpenses: totalExp,
        expenseBreakdown: expBreakdown,
        netAmount: cashCOD + (comm.earned ? comm.amount : 0) - totalExp,
        successRate: dOrds.length > 0 ? Math.round(delivered.length / dOrds.length * 100) : 0,
      });
    });

    setHistory(function(prev) {
      var updated = [snap, ...prev].slice(0, 90); // keep 90 days
      lsSet(LS_KEYS.history, updated);
      return updated;
    });

    // Also save to Supabase daily_history table if connected
    var sb = getSupabase();
    if (sb) {
      sb.from("daily_history").insert({
        id: uid(),
        date: snap.date,
        snapshot: JSON.stringify(snap),
        created_at: snap.timestamp,
      }).then(function() {}).catch(function() {});
    }
  }

  function clearCollected() {
    // Remove only scanned/collected orders — keep pending and delivered
    setOrders(function(prev) {
      var keep = prev.filter(function(o) { return !o.scanned || o.status !== "pending"; });
      lsSet(LS_KEYS.orders, keep);
      var sb = getSupabase();
      if (sb) {
        sb.from("orders").delete()
          .eq("scanned", true).eq("status","pending")
          .then(function(){});
      }
      return keep;
    });
  }

  function clearAllData() {
    // Use a custom confirm since window.confirm is blocked in some environments
    setClearConfirm(true);
  }

  function doClearAllData() {
    // Guard: only execute if current user is admin
    var sess = lsGet(LS_KEYS.session, null);
    var validSess = validateSession(sess);
    if (!validSess || validSess.role !== "admin") {
      console.warn("Unauthorized clear attempt blocked");
      setClearConfirm(false);
      return;
    }
    setClearConfirm(false);
    saveHistorySnapshot(orders, expenses);
    // PERMANENT DATA POLICY: Only delete from Supabase explicitly
    // Orders are NEVER auto-deleted. This button marks today as cleared for the local view.
    // Data remains in Supabase permanently for history.
    var sb = getSupabase();
    if (sb) {
      // Get today's date string in d/m/yyyy format
      var d = new Date();
      var todayStr = d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear();
      // Only delete orders assigned TODAY (not historical data)
      sb.from("orders").delete().eq("assigned_date", todayStr).then(function() {});
      sb.from("expenses").delete().gte("created_at", new Date().toISOString().slice(0,10)).then(function() {});
      sb.from("transfers").delete().gte("created_at", new Date().toISOString().slice(0,10)).then(function() {});
    }
    // Reload orders from DB after a moment to reflect the delete
    setTimeout(function() {
      var sb2 = getSupabase && getSupabase();
      if (sb2) {
        sb2.from("orders").select("*").order("created_at",{ascending:true}).then(function(res) {
          if (res && res.data) setOrders(res.data.map(function(r) {
            return { id:r.id, invoiceNo:r.invoice_no, onlineOrderNo:r.online_order_no||"",
              date:r.date, assignedDate:r.assigned_date||r.date||"", store:r.store, customer:r.customer||"",
              address:r.address||"", phone:r.phone||"", total:Number(r.total),
              paymentType:r.payment_type, originalPaymentType:r.original_payment_type||"",
              status:r.status, driverId:r.driver_id, scanned:r.scanned||false, note:r.note||"" };
          }));
        });
      }
    }, 1500);
    setSaveStatus("Today's orders cleared!");
    setTimeout(function() { setSaveStatus(""); }, 2500);
  }

  function addOrders(newOrders) {
    // Normalize any date format to D/M/YYYY for consistent comparison
    function normD(d) {
      if (!d) return "";
      var m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return parseInt(m[3]) + "/" + parseInt(m[2]) + "/" + m[1];
      return d;
    }
    var todayStr = (function(){ var d=new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })();

setOrders(function(prev) {
      const fresh = [];
      // Track invoiceNos that already have a today-pending record (prev or fresh)
      const todayPendingSet = new Set();
      prev.forEach(function(o) {
        if (o.status === "pending" && !o.scanned && normD(o.assignedDate||o.date||"") === todayStr) {
          todayPendingSet.add(o.invoiceNo);
        }
      });

      // Step 1: update/merge existing records
      const merged = prev.map(function(o) {
        const match = newOrders.find(function(n) { return n.invoiceNo === o.invoiceNo && !n._forceInsert; });
        if (!match) return o;

        if (o.status === "delivered" || o.status === "cancelled") {
          var oldN = normD(o.assignedDate||o.date||"");
          var newN = normD(match.assignedDate||todayStr);
          if (oldN !== newN && !todayPendingSet.has(o.invoiceNo)) {
            var stableId = (o.invoiceNo + "_" + (newN||todayStr)).replace(/[^a-zA-Z0-9_]/g,"_");
            fresh.push({ ...match, id: stableId, status:"pending", scanned:false, assignedDate:newN||todayStr });
            todayPendingSet.add(o.invoiceNo);
          }
          return o;
        }
        if (o.scanned === true && o.status === "pending") {
          return { ...o, onlineOrderNo: match.onlineOrderNo || o.onlineOrderNo || "" };
        }
        var isReup = (o.status === "postponed");
        var newAD = isReup ? todayStr : (normD(match.assignedDate)||todayStr);

        if (isReup && !todayPendingSet.has(o.invoiceNo)) {
          // Postponed order being re-assigned next day:
          // Use a new stable ID based on today's date so it's a fresh DB record
          // This guarantees it appears on the driver's dashboard regardless of old ID
          var reupStableId = (o.invoiceNo + "_" + todayStr.replace(/[^a-zA-Z0-9]/g,"_")).replace(/[^a-zA-Z0-9_]/g,"_");
          var reupOrder = {
            ...match,
            id: reupStableId,
            status: "pending",
            scanned: false,
            assignedDate: todayStr,
            driverId: match.driverId || o.driverId,
            customer: (match.customer && match.customer !== "Unknown") ? match.customer : o.customer,
            address: match.address || o.address || "",
            phone: match.phone || o.phone || "",
            onlineOrderNo: match.onlineOrderNo || o.onlineOrderNo || "",
          };
          fresh.push(reupOrder);
          todayPendingSet.add(o.invoiceNo);
          // Keep old postponed record as history
          return o;
        }

        if (isReup) todayPendingSet.add(o.invoiceNo);
        var updated = {
          ...o,
          onlineOrderNo: match.onlineOrderNo||o.onlineOrderNo||"",
          assignedDate: newAD,
          driverId: match.driverId||o.driverId,
          customer: (match.customer&&match.customer!=="Unknown")?match.customer:o.customer,
          address: match.address||o.address||"",
          phone: match.phone||o.phone||"",
          status: isReup?"pending":o.status,
          scanned: isReup?false:o.scanned,
        };
        return updated;
      });

      // Step 2: add brand-new invoices
      newOrders.forEach(function(n) {
        var isForce = n._forceInsert;
        var existsInPrev = prev.some(function(o){ return o.invoiceNo===n.invoiceNo; });
        var alreadyFresh = todayPendingSet.has(n.invoiceNo);
        if (isForce || (!existsInPrev && !alreadyFresh)) {
          var fo = { ...n };
          delete fo._forceInsert;
          if (isForce) {
            // Manual entry: always use unique ID so multiple manual orders
            // with the same invoice number don't overwrite each other
            fo.id = fo.id || uid();
          } else {
            // PDF orders: stable ID prevents duplicate DB rows on re-upload
            fo.id = fo.id || (fo.invoiceNo + "_" + (fo.assignedDate||todayStr)).replace(/[^a-zA-Z0-9_]/g,"_");
          }
          fresh.push(fo);
          if (!isForce) todayPendingSet.add(fo.invoiceNo); // only block dupes for PDF orders
        }
      });

      // Step 3: batch upsert fresh to Supabase
      if (fresh.length > 0) {
        var rows = fresh.map(function(o){ return {
          id:o.id, invoice_no:o.invoiceNo, online_order_no:o.onlineOrderNo||"",
          date:o.date||todayStr, assigned_date:o.assignedDate||todayStr,
          store:o.store||"", customer:o.customer||"", address:o.address||"", phone:o.phone||"",
          total:o.total||0, payment_type:o.paymentType||"Cash", original_payment_type:o.originalPaymentType||"",
          status:o.status||"pending", driver_id:o.driverId||null, scanned:o.scanned||false,
          note:o.note||"", created_at:new Date().toISOString(), updated_at:new Date().toISOString(),
        }; });
        var sbx = getSupabase&&getSupabase();
        if (sbx) {
          setSaveStatus("Saving "+rows.length+" orders...");
          var chunks=[], ci2=0;
          for(;ci2<rows.length;ci2+=50) chunks.push(rows.slice(ci2,ci2+50));
          var done2=0,errs2=0;
          chunks.forEach(function(chunk){
            sbx.from("orders").upsert(chunk,{onConflict:"id"}).then(function(res){
              done2++; if(res&&res.error){errs2++;console.warn("Upsert:",res.error.message);}
              if(done2===chunks.length){
                setSaveStatus(errs2?"⚠️ Some orders failed to save":"✅ "+rows.length+" orders saved!");
                setTimeout(function(){setSaveStatus("");},3000);
              }
            },function(e){done2++;errs2++;console.warn("Upsert err:",e);
              if(done2===chunks.length){setSaveStatus("⚠️ Save failed");setTimeout(function(){setSaveStatus("");},5000);}
            });
          });
        } else {
          setSaveStatus("⚠️ No DB connection — saved locally only");
          setTimeout(function(){setSaveStatus("");},4000);
        }
      }

      // Deduplicate final array — keep the most recent record per (invoiceNo + assignedDate)
      // This prevents doubling if addOrders is called twice accidentally
      const seen = new Map(); // key: invoiceNo+"|"+assignedDate → index in deduped
      const deduped = [];
      [...merged, ...fresh].forEach(function(o) {
        var nd = (function(d) {
          if (!d) return "";
          var m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (m) return parseInt(m[3]) + "/" + parseInt(m[2]) + "/" + m[1];
          return d;
        })(o.assignedDate || o.date || "");
        var key = (o.invoiceNo || "") + "|" + nd + "|" + (o.status || "pending");
        if (!seen.has(key)) {
          seen.set(key, deduped.length);
          deduped.push(o);
        } else {
          // Keep the one with more data (prefer pending over delivered for same day)
          var existing = deduped[seen.get(key)];
          if (o.status === "pending" && existing.status !== "pending") {
            deduped[seen.get(key)] = o;
          }
        }
      });
      lsSet(LS_KEYS.orders, deduped);
      return deduped;
    });
  }

  function markScanned(idOrInvoice) {
    setOrders(function(prev) {
      var currentSession = lsGet(LS_KEYS.session, null);
      var validCurrentSession = validateSession(currentSession);
      const updated = prev.map(function(o) {
        if (o.id === idOrInvoice || o.invoiceNo === idOrInvoice) {
          // Drivers can only update their own assigned orders
          if (validCurrentSession && validCurrentSession.role === "driver" && o.driverId !== validCurrentSession.id) {
            console.warn("Driver attempted to update another driver's order — blocked.");
            return o;
          }
          const newO = { ...o, scanned:true, scannedAt: new Date().toISOString() };
          dbUpdateOrder(newO.id, { scanned:true }, newO.invoiceNo);
          return newO;
        }
        return o;
      });
      return updated;
    });
  }

  function updateStatus(idOrInvoice, status, note, newPaymentType, newTotal, extraAmount) {
    // Whitelist valid statuses — reject anything unexpected
    var VALID_STATUSES = ["delivered","cancelled","postponed","pending"];
    if (status && !VALID_STATUSES.includes(status)) {
      console.warn("Rejected invalid status:", status);
      return;
    }
    let updatedOrder = null;
    setOrders(function(prev) {
      const updated = prev.map(function(o) {
        if (o.id === idOrInvoice || o.invoiceNo === idOrInvoice) {
          updatedOrder = { ...o, status, note, updatedAt: new Date().toISOString(),
            ...(status==="delivered" ? { deliveredAt: new Date().toISOString() } : {}),
            ...(newPaymentType ? { paymentType: newPaymentType, originalPaymentType: o.paymentType } : {}),
            ...(typeof newTotal === "number" && newTotal > 0 ? { total: newTotal, originalTotal: o.total } : {}),
            ...(typeof extraAmount === "number" && extraAmount > 0 ? { extraAmount } : {}),
          };
          // Save to Supabase immediately
          dbUpdateOrder(updatedOrder.id, {
            status, note: note||"",
            ...(newPaymentType ? { paymentType: newPaymentType, originalPaymentType: o.paymentType } : {}),
            ...(typeof newTotal === "number" && newTotal > 0 ? { total: newTotal } : {}),
          }, updatedOrder.invoiceNo);
          return updatedOrder;
        }
        return o;
      });
      lsSet(LS_KEYS.orders, updated);
      return updated;
    });
    // Fire admin notification
    setTimeout(() => {
      if (!updatedOrder) return;
      const driver = DRIVERS.find(d => d.id === updatedOrder.driverId);
      const icon   = STATUS_CFG[status]?.icon || "📋";
      // Mark seen so recovery on next login doesn't duplicate it
      var seen = lsGet(LS_KEYS.seenStatuses, {});
      seen[updatedOrder.invoiceNo + ":" + status] = true;
      lsSet(LS_KEYS.seenStatuses, seen);
      setAdminNotifs(prev => {
        var newNotif = {
          id:       uid(),
          notifType: status,
          orderId:  updatedOrder.invoiceNo,
          onlineOrderNo: updatedOrder.onlineOrderNo || "",
          customer: updatedOrder.customer,
          store:    updatedOrder.store,
          amount:   updatedOrder.total,
          payment:  newPaymentType || updatedOrder.paymentType,
          driver:   driver?.name || updatedOrder.driverId,
          note:     note || "",
          icon,
          read:     false,
          time:     new Date().toISOString(),
        };
        var combined = [newNotif, ...prev];
        lsSet(LS_KEYS.notifs, combined.slice(0, 100));
        return combined;
      });
      playSound("notify");
    }, 100);
  }

  function requestHelp(order, helpKey, helpLabel, driverUser) {
    var driverName = driverUser ? driverUser.name : "Driver";
    setAdminNotifs(function(prev) {
      return [{
        id: uid(),
        notifType: "help",
        helpKey: helpKey,
        orderId: order.invoiceNo,
        customer: order.customer,
        store: order.store,
        amount: order.total,
        payment: order.paymentType,
        driver: driverName,
        note: helpLabel,
        icon: "SOS",
        read: false,
        time: new Date().toISOString(),
      }, ...prev];
    });
    playSound("help");
    // Save to Supabase as a help_request
    var sb = getSupabase();
    if (sb) {
      sb.from("help_requests").insert({
        id: uid(),
        driver_id: driverUser ? driverUser.id : "",
        driver_name: driverName,
        order_id: order.id,
        invoice_no: order.invoiceNo,
        customer: order.customer,
        store: order.store || "",
        help_key: helpKey,
        help_label: helpLabel,
        created_at: new Date().toISOString(),
      }).then(function(){}).catch(function(){});
    }
  }

  function updateOrderDetails(idOrInvoice, fields) {
    setOrders(function(prev) {
      const updated = prev.map(function(o) {
        if (o.id === idOrInvoice || o.invoiceNo === idOrInvoice) {
          const patched = { ...o, ...fields };
          const sb = getSupabase && getSupabase();
          if (sb && o.id) {
            const row = { updated_at: new Date().toISOString() };
            if (fields.onlineOrderNo !== undefined) row.online_order_no = fields.onlineOrderNo;
            if (fields.customer      !== undefined) row.customer         = fields.customer;
            if (fields.address       !== undefined) row.address          = fields.address;
            if (fields.phone         !== undefined) row.phone            = fields.phone;
            sb.from("orders").update(row).eq("id", o.id)
              .then(function(){}, function(e){ console.warn("edit order err", e); });
          }
          return patched;
        }
        return o;
      });
      lsSet(LS_KEYS.orders, updated);
      return updated;
    });
  }

  function removeOrder(idOrInvoice) {
    // Sanitize input — only allow alphanumeric, dash, underscore
    var safe = String(idOrInvoice).replace(/[^a-zA-Z0-9\-_]/g, "");
    if (!safe) return;
    setOrders(function(prev) {
      const updated = prev.filter(function(o) { return o.id !== idOrInvoice && o.invoiceNo !== idOrInvoice; });
      lsSet(LS_KEYS.orders, updated);
      var sb = getSupabase();
      if (sb) {
        sb.from("orders").delete().eq("id", safe).then(function(){});
        sb.from("orders").delete().eq("invoice_no", safe).then(function(){});
      }
      return updated;
    });
  }

  function requestTransfer(order, fromDriverId, toDriverId, reason) {
    var newTransfer = {
      id: uid(),
      order, fromDriverId, toDriverId, reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setTransfers(function(prev) {
      var updated = [...prev, newTransfer];
      lsSet(LS_KEYS.transfers, updated);
      return updated;
    });
    // Save to Supabase so admin sees it immediately on their device
    dbUpsertTransfer(newTransfer);
  }

  function approveTransfer(transferId) {
    const tr = transfers.find(t => t.id === transferId);
    if (!tr) return;
    var todayStr = (function(){ var d=new Date(); return d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear(); })();
    // Reassign order to new driver in React state
    setOrders(function(prev) {
      var updated = prev.map(function(o) {
        if (o.invoiceNo !== tr.order.invoiceNo) return o;
        var reassigned = {
          ...o,
          driverId: tr.toDriverId,
          assignedDate: todayStr,  // ensure it appears in today's dashboard for new driver
          scanned: false,           // new driver must re-scan at warehouse
          status: o.status === "postponed" ? "pending" : o.status,
        };
        // Persist to Supabase immediately
        var sb = getSupabase && getSupabase();
        if (sb && reassigned.id) {
          sb.from("orders").update({
            driver_id:     tr.toDriverId,
            assigned_date: todayStr,
            scanned:       false,
            status:        reassigned.status,
            updated_at:    new Date().toISOString(),
          }).eq("id", reassigned.id).then(function(){}, function(e){ console.warn("Transfer DB update err:", e); });
        }
        return reassigned;
      });
      lsSet(LS_KEYS.orders, updated);
      return updated;
    });
    setTransfers(function(prev) {
      var updated = prev.map(function(t) { return t.id === transferId ? { ...t, status:"approved" } : t; });
      lsSet(LS_KEYS.transfers, updated);
      // Persist approved status to Supabase
      var approvedTr = updated.find(function(t){ return t.id === transferId; });
      if (approvedTr) dbUpsertTransfer(approvedTr);
      return updated;
    });
  }

  function rejectTransfer(transferId) {
    setTransfers(function(prev) {
      var updated = prev.map(function(t) { return t.id === transferId ? { ...t, status:"rejected" } : t; });
      lsSet(LS_KEYS.transfers, updated);
      // Persist rejected status to Supabase
      var rejectedTr = updated.find(function(t){ return t.id === transferId; });
      if (rejectedTr) dbUpsertTransfer(rejectedTr);
      return updated;
    });
  }

  return (
    <>
      <style>{FONT + PULSE_CSS + "* { -webkit-tap-highlight-color:transparent; box-sizing:border-box; } ::-webkit-scrollbar { width:0; } @keyframes fadeIn { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }"}</style>
      {!user && <LoginScreen onLogin={setUser} />}
      {user?.role === "storeadmin" && <StoreAdminApp user={user} orders={orders} adminNotifs={adminNotifs}
          onMarkNotifRead={(id)=>setAdminNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n))}
          onClearNotifs={()=>setAdminNotifs(p=>p.map(n=>({...n,read:true})))}
          onlineDrivers={onlineDrivers} activeDrivers={activeDrivers}
          onLogout={function(){ lsSet(LS_KEYS.session, null); setUser(null); }} />}
      {user?.role === "admin"  && <AdminApp  user={user} orders={orders} transfers={transfers} adminNotifs={adminNotifs} onMarkNotifRead={(id)=>setAdminNotifs(p=>p.map(n=>n.id===id?{...n,read:true}:n))} onClearNotifs={()=>setAdminNotifs(p=>p.map(n=>({...n,read:true})))} expenses={expenses} onAddExpense={function(exp){ const e={...exp,id:uid(),createdAt:new Date().toISOString()}; setExpenses(function(p){const n=[...p,e]; lsSet(LS_KEYS.expenses,n); return n;}); dbInsertExpense(e); }} onOrdersAdd={addOrders} onStatusUpdate={updateStatus} onApproveTransfer={approveTransfer} onRejectTransfer={rejectTransfer} driverProfiles={driverProfiles} onUpdateDriver={updateDriverProfile} onAddDriver={addDriver} onClearData={clearAllData} onClearCollected={clearCollected} onRemoveOrderAdmin={removeOrder} onEditOrder={updateOrderDetails} orderTags={orderTags} onSetTag={setTag} saveStatus={saveStatus} dbConnected={dbConnected} syncing={syncing} onlineDrivers={onlineDrivers} activeDrivers={activeDrivers} clearConfirm={clearConfirm} onConfirmClear={doClearAllData} onCancelClear={function(){setClearConfirm(false);}} history={history} passwords={passwords} onSetPassword={function(id,pwd){setPasswords(function(prev){var n={...prev};n[id]=pwd;return n;});}} selectedDate={selectedDate} onSetSelectedDate={setSelectedDate} onLogout={function(){ lsSet(LS_KEYS.session, null); setUser(null); }}
          onOrdersRefresh={function() {
            dbLoadOrders().then(function(data) {
              if (data && data.length > 0) {
                setOrders(function(prev) {
                  var seen = new Set();
                  var deduped = data.filter(function(o){ if(!o.id||seen.has(o.id)) return false; seen.add(o.id); return true; });
                  lsSet(LS_KEYS.orders, deduped);
                  return deduped;
                });
              } else {
                setOrders([]);
                lsSet(LS_KEYS.orders, []);
              }
            }).catch(function(){});
          }}
          />}
      {user?.role === "driver" && <DriverApp user={user} orders={orders} expenses={expenses} onAddExpense={function(exp){ const e={...exp,driverId:user.id,id:uid(),createdAt:new Date().toISOString()}; setExpenses(function(p){const n=[...p,e]; lsSet(LS_KEYS.expenses,n); return n;}); dbInsertExpense(e); }}
          onUpdateExpense={function(id,fields){ setExpenses(function(p){ var n=p.map(function(e){ return e.id===id?{...e,...fields}:e; }); lsSet(LS_KEYS.expenses,n); return n; }); dbUpdateExpense(id,fields); }}
          onDeleteExpense={function(id){ setExpenses(function(p){ var n=p.filter(function(e){ return e.id!==id; }); lsSet(LS_KEYS.expenses,n); return n; }); dbDeleteExpense(id); }} onScan={markScanned} onStatusUpdate={updateStatus} onEditOrder={updateOrderDetails} onRequestTransfer={requestTransfer} onRemoveOrder={removeOrder} onRequestHelp={requestHelp} orderTags={orderTags} onSetTag={setTag} onAddOrder={addOrders} selectedDate={selectedDate} onSetSelectedDate={setSelectedDate}
          onRefresh={function(cb) {
            dbLoadOrders().then(function(data) {
              if (data && data.length > 0) {
                setOrders(function(prev) {
                  var dbById = {};
                  data.forEach(function(o) { if (o.id) dbById[o.id] = o; });
                  var localOnly = prev.filter(function(o) { return o.id && !dbById[o.id]; });
                  var merged = data.concat(localOnly);
                  var seen = new Set();
                  merged = merged.filter(function(o) { if (!o.id||seen.has(o.id)) return false; seen.add(o.id); return true; });
                  lsSet(LS_KEYS.orders, merged);
                  return merged;
                });
              }
              if (cb) cb();
            }).catch(function() { if (cb) cb(); });
          }}
          onLogout={function(){ lsSet(LS_KEYS.session, null); setUser(null); }} />}
    </>
  );
}
