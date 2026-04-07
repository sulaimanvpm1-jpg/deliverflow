/**
 * ════════════════════════════════════════════════════════════════
 * DeliverFlow v3.6 — Civil ID Collection Feature
 * ════════════════════════════════════════════════════════════════
 *
 * HOW TO INTEGRATE INTO YOUR EXISTING index.html:
 *
 * STEP 1 — Supabase SQL (run once in Supabase SQL Editor):
 * ─────────────────────────────────────────────────────────
 *   CREATE TABLE IF NOT EXISTS civil_id_records (
 *     invoice_no       TEXT PRIMARY KEY,
 *     online_order_no  TEXT DEFAULT '',
 *     civil_id_number  TEXT NOT NULL DEFAULT '',
 *     full_name        TEXT NOT NULL DEFAULT '',
 *     driver_name      TEXT NOT NULL DEFAULT '',
 *     delivered_date   TEXT NOT NULL DEFAULT '',
 *     created_at       TIMESTAMPTZ DEFAULT now()
 *   );
 *   ALTER TABLE civil_id_records ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Allow all" ON civil_id_records
 *     FOR ALL USING (true) WITH CHECK (true);
 *
 * STEP 2 — Add Geist Mono font to <head> of index.html:
 * ───────────────────────────────────────────────────────
 *   Change the existing font link to:
 *   <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;700&display=swap" rel="stylesheet">
 *
 * STEP 3 — Paste this entire file as a NEW <script> block
 *          in index.html, AFTER the existing main <script> block.
 *
 * STEP 4 — In the existing code, find StatusUpdateModal's
 *          handleConfirm() function and add these 3 lines
 *          BEFORE the onUpdate(...) call:
 *
 *   if (status === "delivered") {
 *     window.__dfPendingDeliveredOrder = order;
 *   }
 *
 * STEP 5 — In DriverApp function, find the line where `user` is
 *          used and add:
 *
 *   React.useEffect(function(){ window.__dfCurrentUser = user; }, [user]);
 *
 * STEP 6 — In AdminApp's TABS array, add this entry:
 *
 *   {id:"civilids", icon:"🪪", label:"Civil IDs"}
 *
 *          Then in AdminApp's tab content section, add:
 *
 *   tab==="civilids" && React.createElement(CivilIDRecordsTab, null)
 *
 * ════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ─── Namespace shortcuts ────────────────────────────────────────
  var R   = window.React;
  var RD  = window.ReactDOM;
  var E   = R.createElement;
  var FF  = '"Geist",system-ui,sans-serif';
  var FM  = '"Geist Mono",monospace';

  // ══════════════════════════════════════════════════════════════
  // A. DATABASE LAYER
  // ══════════════════════════════════════════════════════════════

  function getSB() {
    return window.getSupabase ? window.getSupabase() : null;
  }

  /** Save one Civil ID record to Supabase + localStorage */
  window.dfSaveCivilID = async function (record) {
    var sb = getSB();
    if (sb) {
      sb.from("civil_id_records")
        .upsert({
          invoice_no:      record.invoiceNo,
          online_order_no: record.onlineOrderNo || "",
          civil_id_number: record.civilIdNumber,
          full_name:       record.fullName,
          driver_name:     record.driverName,
          delivered_date:  record.deliveredDate,
          created_at:      new Date().toISOString()
        }, { onConflict: "invoice_no" })
        .then(function () {}, function (e) { console.warn("Civil ID upsert:", e.message); });
    }
    // Always persist locally too
    try {
      var arr = JSON.parse(localStorage.getItem("df_civil_ids") || "[]");
      arr = arr.filter(function (r) { return r.invoiceNo !== record.invoiceNo; });
      arr.push(record);
      localStorage.setItem("df_civil_ids", JSON.stringify(arr));
    } catch (e) {}
  };

  /** Load all Civil ID records */
  window.dfLoadCivilIDs = async function () {
    var sb = getSB();
    if (sb) {
      try {
        var res = await sb.from("civil_id_records")
          .select("*")
          .order("created_at", { ascending: false });
        if (!res.error && res.data) {
          return res.data.map(function (r) {
            return {
              invoiceNo:      r.invoice_no,
              onlineOrderNo:  r.online_order_no || "",
              civilIdNumber:  r.civil_id_number,
              fullName:       r.full_name,
              driverName:     r.driver_name,
              deliveredDate:  r.delivered_date,
              createdAt:      r.created_at
            };
          });
        }
      } catch (e) { console.warn("Supabase civil_id load failed:", e); }
    }
    try { return JSON.parse(localStorage.getItem("df_civil_ids") || "[]"); }
    catch (e) { return []; }
  };

  // ══════════════════════════════════════════════════════════════
  // B. CLAUDE VISION OCR
  //    Model: claude-sonnet-4-20250514
  //    Extracts: 12-digit Civil ID No  +  English Name
  // ══════════════════════════════════════════════════════════════

  window.dfExtractCivilID = async function (base64, mediaType) {
    var res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 }
            },
            {
              type: "text",
              text: [
                "This is a State of Kuwait Civil ID card.",
                "Extract ONLY these two fields.",
                "Respond with ONLY valid JSON — no markdown fences, no explanation:",
                '{"civil_id_number":"12-digit number next to \'Civil ID No\' label at top right","full_name":"English name after the word \'Name\' in middle-left, written in ALL CAPS"}',
                "If a field is not readable, use empty string \"\"."
              ].join("\n")
            }
          ]
        }]
      })
    });
    var data = await res.json();
    var raw  = (data.content || []).map(function (c) { return c.text || ""; }).join("").trim();
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  };

  // ══════════════════════════════════════════════════════════════
  // C. CivilIDCollector COMPONENT
  //    Shown to driver after delivering an order.
  //    Props: { order, driverName, onSaved, onSkip }
  // ══════════════════════════════════════════════════════════════

  function CivilIDCollector(props) {
    var order      = props.order;
    var driverName = props.driverName;
    var onSaved    = props.onSaved;
    var onSkip     = props.onSkip;

    var ss = R.useState("prompt"),   step = ss[0],     setStep = ss[1];
    var se = R.useState(null),       extr = se[0],     setExtr = se[1];
    var sn = R.useState(""),         name = sn[0],     setName = sn[1];
    var si = R.useState(""),         idno = si[0],     setIdno = si[1];
    var sm = R.useState(""),         emsg = sm[0],     setEmsg = sm[1];
    var fileRef = R.useRef();

    async function processFile(file) {
      if (!file) return;
      setStep("processing"); setEmsg("");
      try {
        var b64 = await new Promise(function (res, rej) {
          var fr = new FileReader();
          fr.onload  = function () { res(fr.result.split(",")[1]); };
          fr.onerror = rej;
          fr.readAsDataURL(file);
        });
        var got = await window.dfExtractCivilID(b64, file.type || "image/jpeg");
        setExtr(got);
        setName((got.full_name       || "").toUpperCase());
        setIdno((got.civil_id_number || "").replace(/\D/g, ""));
        setStep("confirm");
      } catch (ex) {
        setEmsg("Could not auto-read the card. Please enter details manually.");
        setName(""); setIdno("");
        setStep("confirm");
      }
    }

    async function save() {
      if (!idno.trim() && !name.trim()) {
        setEmsg("Please enter the Civil ID number or the customer name."); return;
      }
      var today = new Date().toLocaleDateString("en-KW", { day:"numeric", month:"short", year:"numeric" });
      var rec = {
        invoiceNo:      order.invoiceNo,
        onlineOrderNo:  order.onlineOrderNo || "",
        civilIdNumber:  idno.trim(),
        fullName:       name.trim(),
        driverName:     driverName,
        deliveredDate:  today,
        createdAt:      new Date().toISOString()
      };
      await window.dfSaveCivilID(rec);
      setStep("saved");
      setTimeout(function () { if (onSaved) onSaved(rec); }, 900);
    }

    var card = { background:"#141414", border:"1px solid rgba(0,212,255,.25)", borderRadius:16, padding:18, marginTop:14 };

    /* SAVED */
    if (step === "saved") return E("div", { style: Object.assign({}, card, { border:"1px solid rgba(16,185,129,.4)", textAlign:"center", padding:28 }) },
      E("div", { style:{ fontSize:40, marginBottom:10 } }, "✅"),
      E("div", { style:{ fontFamily:FF, color:"#10B981", fontSize:16, fontWeight:700 } }, "Civil ID Saved!"),
      E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.45)", fontSize:12, marginTop:6 } }, name + (idno ? " · " + idno : ""))
    );

    /* PROMPT */
    if (step === "prompt") return E("div", { style:card },
      E("div", { style:{ fontFamily:FF, color:"#00D4FF", fontSize:14, fontWeight:700, marginBottom:4 } }, "🪪 Collect Customer Civil ID"),
      E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:14, lineHeight:1.5 } },
        "Photograph the customer's Kuwait Civil ID card to verify identity."
      ),
      E("input", { ref:fileRef, type:"file", accept:"image/*", capture:"environment",
        style:{ display:"none" },
        onChange: function (ev) { processFile(ev.target.files && ev.target.files[0]); ev.target.value = ""; }
      }),
      E("div", { style:{ display:"flex", gap:8 } },
        E("button", {
          onClick: function () { setStep("capturing"); setTimeout(function () { if (fileRef.current) fileRef.current.click(); }, 80); },
          style: { flex:2, background:"linear-gradient(135deg,#0EA5E9,#0284C7)", border:"none", borderRadius:12, padding:"13px", color:"#fff", fontFamily:FF, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }
        }, "📷 Scan Civil ID"),
        E("button", {
          onClick: function () { setName(""); setIdno(""); setStep("confirm"); },
          style: { flex:1, background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, padding:"13px", color:"rgba(255,255,255,.5)", fontFamily:FF, fontSize:11, cursor:"pointer" }
        }, "Manual"),
        E("button", {
          onClick: onSkip,
          style: { flex:1, background:"none", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"13px", color:"rgba(255,255,255,.3)", fontFamily:FF, fontSize:11, cursor:"pointer" }
        }, "Skip")
      )
    );

    /* PROCESSING */
    if (step === "capturing" || step === "processing") return E("div", { style: Object.assign({}, card, { textAlign:"center", padding:28 }) },
      E("div", { style:{ width:40, height:40, border:"3px solid rgba(0,212,255,.12)", borderTopColor:"#00D4FF", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" } }),
      E("div", { style:{ fontFamily:FF, color:"#00D4FF", fontSize:14, fontWeight:600 } },
        step === "capturing" ? "Opening camera…" : "Claude Vision reading Civil ID…"
      ),
      E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.35)", fontSize:12, marginTop:6 } },
        step === "processing" ? "Extracting name and Civil ID number from photo…" : ""
      )
    );

    /* CONFIRM / MANUAL */
    return E("div", { style:card },
      E("div", { style:{ fontFamily:FF, color:"#00D4FF", fontSize:14, fontWeight:700, marginBottom:4 } },
        extr ? "🪪 Verify Extracted Details" : "🪪 Enter Civil ID Details"
      ),
      E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:12, marginBottom:14 } },
        extr ? "AI has read the card — verify before saving:" : "Enter details from the customer's Civil ID card:"
      ),
      emsg && E("div", { style:{ background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.3)", borderRadius:10, padding:"9px 12px", marginBottom:12, fontFamily:FF, color:"#F59E0B", fontSize:12 } }, emsg),

      /* Civil ID Number */
      E("div", { style:{ marginBottom:12 } },
        E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:5, letterSpacing:1 } }, "CIVIL ID NUMBER"),
        E("input", {
          type:"text", value:idno, maxLength:12, inputMode:"numeric",
          placeholder:"000000000000",
          onChange: function (ev) { setIdno(ev.target.value.replace(/\D/g,"").slice(0,12)); },
          style:{ width:"100%", boxSizing:"border-box", background:"rgba(0,212,255,.07)", border:"1.5px solid rgba(0,212,255,.4)", borderRadius:10, padding:"12px 14px", color:"#00D4FF", fontFamily:FM, fontSize:22, fontWeight:700, letterSpacing:5, outline:"none" }
        })
      ),

      /* Full Name */
      E("div", { style:{ marginBottom:16 } },
        E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:5, letterSpacing:1 } }, "FULL NAME (ENGLISH — AS ON CARD)"),
        E("input", {
          type:"text", value:name,
          placeholder:"FIRSTNAME LASTNAME",
          onChange: function (ev) { setName(ev.target.value.toUpperCase()); },
          style:{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.18)", borderRadius:10, padding:"12px 14px", color:"#fff", fontFamily:FF, fontSize:14, fontWeight:600, letterSpacing:1, outline:"none" }
        })
      ),

      E("div", { style:{ display:"flex", gap:8 } },
        E("button", {
          onClick: function () { setStep("prompt"); setExtr(null); setEmsg(""); },
          style: { flex:1, background:"rgba(255,255,255,.07)", border:"none", borderRadius:12, padding:12, color:"rgba(255,255,255,.5)", fontFamily:FF, fontSize:12, cursor:"pointer" }
        }, "← Retake"),
        E("button", {
          onClick: save,
          style: { flex:2, background:"linear-gradient(135deg,#0EA5E9,#7C3AED)", border:"none", borderRadius:12, padding:13, color:"#fff", fontFamily:FF, fontWeight:700, fontSize:14, cursor:"pointer" }
        }, "✓ Save Civil ID"),
        E("button", {
          onClick: onSkip,
          style: { flex:1, background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:12, color:"rgba(255,255,255,.3)", fontFamily:FF, fontSize:12, cursor:"pointer" }
        }, "Skip")
      )
    );
  }

  // ══════════════════════════════════════════════════════════════
  // D. CivilIDRecordsTab COMPONENT  (Admin Panel tab)
  //    Props: none
  // ══════════════════════════════════════════════════════════════

  function CivilIDRecordsTab() {
    var sr = R.useState([]),    records = sr[0], setRecords = sr[1];
    var sl = R.useState(true),  loading = sl[0], setLoading = sl[1];
    var sq = R.useState(""),    search  = sq[0], setSearch  = sq[1];

    R.useEffect(function () {
      window.dfLoadCivilIDs()
        .then(function (d) { setRecords(d || []); setLoading(false); })
        .catch(function ()  { setLoading(false); });
    }, []);

    var filtered = records.filter(function (r) {
      var q = search.toLowerCase();
      return !q
        || (r.fullName      || "").toLowerCase().includes(q)
        || (r.civilIdNumber || "").includes(q)
        || (r.invoiceNo     || "").includes(q)
        || (r.onlineOrderNo || "").includes(q)
        || (r.driverName    || "").toLowerCase().includes(q);
    });

    function exportCSV() {
      var cols = ["Invoice No","Online Order No","Civil ID Number","Full Name","Driver Name","Delivered Date","Recorded At"];
      var rows = filtered.map(function (r) {
        return [r.invoiceNo, r.onlineOrderNo||"", r.civilIdNumber, r.fullName, r.driverName, r.deliveredDate, r.createdAt||""];
      });
      var csv = [cols].concat(rows).map(function (row) {
        return row.map(function (v) { return '"' + String(v||"").replace(/"/g,'""') + '"'; }).join(",");
      }).join("\n");
      var blob = new Blob([csv], { type:"text/csv" });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement("a");
      a.href   = url;
      a.download = "civil_id_records_" + new Date().toISOString().slice(0,10) + ".csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return E("div", { style:{ padding:"0 16px 80px" } },

      /* Header */
      E("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 } },
        E("div", null,
          E("div", { style:{ fontFamily:FF, color:"#fff", fontSize:15, fontWeight:700 } }, "🪪 Civil ID Records"),
          E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:12, marginTop:2 } }, records.length + " records collected")
        ),
        records.length > 0 && E("button", {
          onClick: exportCSV,
          style:{ background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.3)", borderRadius:10, padding:"8px 14px", color:"#10B981", fontFamily:FF, fontSize:12, fontWeight:700, cursor:"pointer" }
        }, "📥 Export CSV")
      ),

      /* Search */
      E("input", {
        value: search,
        onChange: function (ev) { setSearch(ev.target.value); },
        placeholder: "🔍 Search name, Civil ID, invoice, order no, driver…",
        style:{ width:"100%", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"11px 16px", color:"#fff", fontFamily:FF, fontSize:13, marginBottom:14, boxSizing:"border-box", outline:"none" }
      }),

      /* Stats row */
      records.length > 0 && E("div", { style:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 } },
        [
          ["Total", records.length, "#00D4FF"],
          ["Today", records.filter(function(r){ return r.deliveredDate === new Date().toLocaleDateString("en-KW",{day:"numeric",month:"short",year:"numeric"}); }).length, "#10B981"],
          ["Drivers", (function(){ var s = new Set(records.map(function(r){return r.driverName;})); return s.size; })(), "#FF6B2B"]
        ].map(function (item) {
          return E("div", { key:item[0], style:{ background:item[2]+"12", border:"1px solid "+item[2]+"25", borderRadius:12, padding:"10px 8px", textAlign:"center" } },
            E("div", { style:{ fontFamily:FF, color:item[2], fontSize:18, fontWeight:800 } }, item[1]),
            E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:10, marginTop:2 } }, item[0])
          );
        })
      ),

      /* Loading */
      loading && E("div", { style:{ textAlign:"center", color:"rgba(255,255,255,.3)", padding:40, fontFamily:FF } }, "Loading…"),

      /* Empty */
      !loading && filtered.length === 0 && E("div", { style:{ textAlign:"center", padding:"40px 20px" } },
        E("div", { style:{ fontSize:40, marginBottom:12 } }, "🪪"),
        E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:14, lineHeight:1.6 } },
          records.length === 0
            ? "No Civil IDs collected yet.\nDrivers are prompted after each delivery."
            : "No records match your search."
        )
      ),

      /* Records list */
      !loading && filtered.map(function (r, i) {
        return E("div", { key:(r.invoiceNo||"")+i,
          style:{ background:"#141414", border:"1px solid rgba(0,212,255,.15)", borderRadius:14, padding:"14px 16px", marginBottom:10 }
        },
          E("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 } },
            E("div", { style:{ flex:1, minWidth:0 } },
              E("div", { style:{ fontFamily:FF, color:"#fff", fontSize:14, fontWeight:700, marginBottom:4 } }, r.fullName || "—"),
              E("div", { style:{ color:"#00D4FF", fontSize:18, fontWeight:800, letterSpacing:4, fontFamily:FM } }, r.civilIdNumber || "—")
            ),
            E("div", { style:{ textAlign:"right", flexShrink:0, marginLeft:10 } },
              E("div", { style:{ background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.2)", borderRadius:20, padding:"3px 10px", fontFamily:FF, color:"#10B981", fontSize:11, fontWeight:600 } }, "✓ Collected"),
              E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.3)", fontSize:10, marginTop:5 } }, r.deliveredDate)
            )
          ),
          E("div", { style:{ background:"rgba(255,255,255,.03)", borderRadius:8, padding:"8px 12px", display:"flex", gap:16, flexWrap:"wrap" } },
            E("span", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:12 } },
              "Invoice: ", E("span", { style:{ color:"#FF6B2B", fontWeight:700 } }, "#"+r.invoiceNo)
            ),
            r.onlineOrderNo && E("span", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:12 } },
              "OO: ", E("span", { style:{ color:"#00D4FF", fontWeight:700 } }, r.onlineOrderNo)
            ),
            E("span", { style:{ fontFamily:FF, color:"rgba(255,255,255,.4)", fontSize:12 } },
              "Driver: ", E("span", { style:{ color:"#fff", fontWeight:600 } }, r.driverName)
            )
          )
        );
      })
    );
  }

  // ══════════════════════════════════════════════════════════════
  // E. OVERLAY  — Triggered after driver confirms "Delivered"
  //    Listens for window event "df:delivered"
  // ══════════════════════════════════════════════════════════════

  function CivilIDOverlay() {
    var sp = R.useState(null),  order      = sp[0], setOrder      = sp[1];
    var sd = R.useState(""),    driverName = sd[0], setDriverName = sd[1];

    R.useEffect(function () {
      function onDelivered(ev) {
        setOrder(ev.detail.order);
        setDriverName(ev.detail.driverName || "");
      }
      window.addEventListener("df:delivered", onDelivered);
      return function () { window.removeEventListener("df:delivered", onDelivered); };
    }, []);

    if (!order) return null;

    return E("div", { style:{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:9999, display:"flex", alignItems:"flex-end" } },
      E("div", { style:{ width:"100%", background:"#141414", borderRadius:"24px 24px 0 0", padding:"24px 20px 36px", maxHeight:"88dvh", overflowY:"auto" } },
        E("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 } },
          E("div", { style:{ fontFamily:FF, color:"#10B981", fontSize:18, fontWeight:800 } }, "✅ Order Delivered!"),
          E("button", {
            onClick: function () { setOrder(null); },
            style:{ background:"rgba(255,255,255,.08)", border:"none", borderRadius:20, padding:"5px 12px", color:"rgba(255,255,255,.5)", fontFamily:FF, fontSize:12, cursor:"pointer" }
          }, "✕")
        ),
        E("div", { style:{ fontFamily:FF, color:"rgba(255,255,255,.45)", fontSize:13, marginBottom:0 } },
          "#" + order.invoiceNo + " — " + (order.customer || "")
        ),
        E(CivilIDCollector, {
          order:      order,
          driverName: driverName,
          onSaved:    function () { setTimeout(function () { setOrder(null); }, 1400); },
          onSkip:     function () { setOrder(null); }
        })
      )
    );
  }

  // Mount overlay
  var overlayRoot = document.createElement("div");
  overlayRoot.id = "df-civilid-overlay-root";
  document.body.appendChild(overlayRoot);
  RD.createRoot(overlayRoot).render(E(CivilIDOverlay));

  // ══════════════════════════════════════════════════════════════
  // F. EXPOSE COMPONENTS GLOBALLY for direct use in index.html
  // ══════════════════════════════════════════════════════════════
  window.CivilIDCollector    = CivilIDCollector;
  window.CivilIDRecordsTab   = CivilIDRecordsTab;

  // ══════════════════════════════════════════════════════════════
  // G. FIRE df:delivered — auto-patches StatusUpdateModal
  //    Intercept DOM clicks on the "Confirm Delivered" button.
  //    For clean integration, see STEP 4 in the file header.
  // ══════════════════════════════════════════════════════════════
  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
    if (!btn) return;
    var txt = (btn.textContent || "").trim();
    if (txt.startsWith("Confirm Delivered") || txt === "Confirm delivered") {
      setTimeout(function () {
        if (window.__dfPendingDeliveredOrder) {
          window.dispatchEvent(new CustomEvent("df:delivered", {
            detail: {
              order:      window.__dfPendingDeliveredOrder,
              driverName: (window.__dfCurrentUser && window.__dfCurrentUser.name) || ""
            }
          }));
          window.__dfPendingDeliveredOrder = null;
        }
      }, 350);
    }
  }, true);

  console.log("[DeliverFlow v3.6] Civil ID feature loaded ✓");

})();
