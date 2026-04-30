import { useEffect, useState, useCallback } from "react";
import { db } from "../lib/supabase.js";
import { makeCss } from "../lib/styles.js";
import { TK, applyTheme, getSavedTheme, saveTheme } from "../lib/theme.js";
import { fmtDate, fmtEur } from "../lib/helpers.js";

// ── Helpers ────────────────────────────────────────────────────────────────────
const PLAN_META = {
  free:       { color: "#64748b", bg: "#1e293b", label: "FREE" },
  pro:        { color: "#4a7fe8", bg: "#1e3a5f", label: "PRO"  },
  enterprise: { color: "#8b5cf6", bg: "#2d1b69", label: "ENT"  },
};
function PlanBadge({ plan }) {
  const p = PLAN_META[plan||"free"];
  return <span style={{ padding:"2px 9px", borderRadius:8, fontSize:"0.65rem", fontWeight:700,
    background:p.bg, color:p.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{p.label}</span>;
}
function Stat({ label, value, color, sub }) {
  const { C2, BRD2, TX, TX4, TX5 } = TK;
  return (
    <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10,
      padding:"16px 18px", display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ color: color||TX, fontWeight:800, fontSize:"1.8rem",
        fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{value}</div>
      <div style={{ color:TX4, fontSize:"0.7rem", textTransform:"uppercase",
        letterSpacing:"0.07em" }}>{label}</div>
      {sub && <div style={{ color:TX5, fontSize:"0.68rem" }}>{sub}</div>}
    </div>
    );
}

// ── Vue : Organisations ────────────────────────────────────────────────────────
function OrgsView({ orgs, members, postes, logs, onPlanChange, onDeleteOrg, search, setSearch }) {
  const { C, C2, C3, BRD, BRD2, TX, TX2, TX3, TX4, TX5, BLUE, RED, AMBER } = TK;
  const css = makeCss();
  const [selected, setSelected] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = orgs.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.plan?.toLowerCase().includes(search.toLowerCase())
  );

  const orgMembers = (orgId) => members.filter(m => m.org_id === orgId);
  const orgPostes  = (orgId) => postes.filter(p => p.org_id === orgId).length;
  const orgLogs    = (orgId) => logs.filter(l => l.org_id === orgId).slice(0,5);
  const lastActivity = (orgId) => {
    const l = logs.filter(x => x.org_id === orgId)[0];
    return l ? fmtDate(l.created_at) : "—";
  };

  return (
    <div style={{ display:"flex", gap:16 }}>
      {/* Liste */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <input style={{ ...css.inp, flex:1 }} placeholder="Rechercher une organisation…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div style={{ border:`1px solid ${BRD}`, borderRadius:8, overflow:"hidden" }}>
          <table style={css.tbl}>
            <thead><tr>
              <th style={css.th}>Organisation</th>
              <th style={css.th}>Plan</th>
              <th style={{ ...css.th, textAlign:"right" }}>Membres</th>
              <th style={{ ...css.th, textAlign:"right" }}>Postes</th>
              <th style={css.th}>Dernière activité</th>
              <th style={css.th}>Créée le</th>
              <th style={css.th}>Changer plan</th>
            </tr></thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id} style={{ background: selected?.id===o.id ? `${BLUE}10` : i%2===0?C:C3,
                  cursor:"pointer" }} onClick={() => setSelected(s => s?.id===o.id ? null : o)}>
                  <td style={{ ...css.td, fontWeight:600, color:TX }}>{o.name}</td>
                  <td style={css.td}><PlanBadge plan={o.plan}/></td>
                  <td style={{ ...css.td, textAlign:"right", fontFamily:"monospace" }}>
                    {orgMembers(o.id).length}
                  </td>
                  <td style={{ ...css.td, textAlign:"right", fontFamily:"monospace" }}>
                    {orgPostes(o.id)}
                  </td>
                  <td style={{ ...css.td, color:TX4, fontSize:"0.73rem" }}>{lastActivity(o.id)}</td>
                  <td style={{ ...css.td, color:TX4, fontSize:"0.73rem" }}>{fmtDate(o.created_at)}</td>
                  <td style={css.td} onClick={e => e.stopPropagation()}>
                    <select style={{ ...css.sel, fontSize:"0.72rem", padding:"3px 6px" }}
                      value={o.plan||"free"}
                      onChange={e => onPlanChange(o.id, e.target.value)}>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ ...css.td, textAlign:"center", color:TX4, padding:24 }}>
                  Aucune organisation trouvée
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détail org sélectionnée */}
      {selected && (
        <div style={{ width:300, flexShrink:0, display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10, padding:"16px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ color:TX, fontWeight:700, fontSize:"0.95rem" }}>{selected.name}</div>
                <div style={{ marginTop:4 }}><PlanBadge plan={selected.plan}/></div>
              </div>
              <button style={{ ...css.iBtn, color:TX4 }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, fontSize:"0.75rem" }}>
              {[
                ["ID",         selected.id?.slice(0,8)+"…"],
                ["Créée le",   fmtDate(selected.created_at)],
                ["Membres",    orgMembers(selected.id).length],
                ["Postes",     orgPostes(selected.id)],
                ["Stripe ID",  selected.stripe_customer_id || "—"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:TX4 }}>{k}</span>
                  <span style={{ color:TX2, fontFamily:"monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Membres */}
          <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ color:TX, fontWeight:600, fontSize:"0.82rem", marginBottom:10 }}>
              Membres ({orgMembers(selected.id).length})
            </div>
            {orgMembers(selected.id).map(m => (
              <div key={m.id} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${BRD}` }}>
                <span style={{ color:TX3, fontSize:"0.76rem", maxWidth:160,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {m.email || m.user_id?.slice(0,8)}
                </span>
                <span style={{ fontSize:"0.68rem", color: m.role==="admin"?BLUE:TX4,
                  fontWeight:600, textTransform:"uppercase" }}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          {/* Activité récente */}
          <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ color:TX, fontWeight:600, fontSize:"0.82rem", marginBottom:10 }}>
              Activité récente
            </div>
            {orgLogs(selected.id).length === 0 ? (
              <div style={{ color:TX4, fontSize:"0.75rem" }}>Aucune activité</div>
            ) : orgLogs(selected.id).map(l => (
              <div key={l.id} style={{ display:"flex", justifyContent:"space-between",
                padding:"4px 0", borderBottom:`1px solid ${BRD}` }}>
                <span style={{ color:TX3, fontSize:"0.73rem" }}>{l.action}</span>
                <span style={{ color:TX5, fontSize:"0.7rem" }}>{fmtDate(l.created_at)}</span>
              </div>
            ))}
          </div>

          {/* Zone danger */}
          <div style={{ background:C2, border:`1px solid ${RED}30`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ color:RED, fontWeight:600, fontSize:"0.8rem", marginBottom:8 }}>
              Zone danger
            </div>
            {confirmDel !== selected.id ? (
              <button style={{ ...css.btnS, color:RED, borderColor:`${RED}40`,
                background:`${RED}08`, fontSize:"0.75rem", padding:"6px 12px" }}
                onClick={() => setConfirmDel(selected.id)}>
                Supprimer l'organisation
              </button>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ color:TX3, fontSize:"0.73rem" }}>
                  Supprimer "{selected.name}" et toutes ses données ?
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button style={{ ...css.btnP, fontSize:"0.73rem", padding:"5px 10px",
                    background:RED, boxShadow:"none" }}
                    onClick={() => { onDeleteOrg(selected.id); setSelected(null); setConfirmDel(null); }}>
                    Confirmer
                  </button>
                  <button style={{ ...css.btnS, fontSize:"0.73rem", padding:"5px 10px" }}
                    onClick={() => setConfirmDel(null)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vue : Logs globaux ─────────────────────────────────────────────────────────
function LogsView({ logs, orgs }) {
  const { C, C3, BRD, TX, TX2, TX3, TX4, TX5, BLUE } = TK;
  const css = makeCss();
  const [filter, setFilter] = useState("");
  const orgName = (id) => orgs.find(o => o.id === id)?.name || id?.slice(0,8);
  const filtered = logs.filter(l =>
    l.action?.includes(filter) || orgName(l.org_id)?.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <div>
      <input style={{ ...css.inp, marginBottom:14 }} placeholder="Filtrer par action ou organisation…"
        value={filter} onChange={e => setFilter(e.target.value)}/>
      <div style={{ border:`1px solid ${BRD}`, borderRadius:8, overflow:"hidden" }}>
        <table style={css.tbl}>
          <thead><tr>
            <th style={css.th}>Date</th>
            <th style={css.th}>Organisation</th>
            <th style={css.th}>Action</th>
            <th style={css.th}>Utilisateur</th>
            <th style={css.th}>Détails</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0,100).map((l, i) => (
              <tr key={l.id} style={{ background: i%2===0?C:C3 }}>
                <td style={{ ...css.td, color:TX4, fontSize:"0.72rem", whiteSpace:"nowrap" }}>
                  {fmtDate(l.created_at)}
                </td>
                <td style={{ ...css.td, fontWeight:500, color:TX, fontSize:"0.78rem" }}>
                  {orgName(l.org_id)}
                </td>
                <td style={{ ...css.td }}>
                  <span style={{ fontSize:"0.73rem", fontFamily:"monospace", color:BLUE }}>
                    {l.action}
                  </span>
                </td>
                <td style={{ ...css.td, color:TX3, fontSize:"0.73rem" }}>
                  {l.user_email || l.user_id?.slice(0,8) || "—"}
                </td>
                <td style={{ ...css.td, color:TX4, fontSize:"0.7rem", maxWidth:220,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {typeof l.details === "object" ? JSON.stringify(l.details) : l.details || "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ ...css.td, textAlign:"center", color:TX4, padding:24 }}>
                Aucun log trouvé
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 100 && (
        <div style={{ color:TX4, fontSize:"0.73rem", marginTop:8, textAlign:"center" }}>
          Affichage des 100 premiers sur {filtered.length} résultats
        </div>
      )}
    </div>
  );
}


// ── Écran de configuration ─────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [url, setUrl]   = useState("https://yzmcqjtepybifjbyxfer.supabase.co");
  const [key, setKey]   = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const { C2, BRD2, TX, TX3, TX4, TX5, BLUE, RED } = TK;
  const css = makeCss();

  const test = async () => {
    if (!url || !key) { setError("Les deux champs sont requis"); return; }
    setTesting(true); setError("");
    try {
      db.saveCreds(url, key);
      const r = await db.select("organisations", "select=id&limit=1");
      if (Array.isArray(r)) {
        onSave();
      } else {
        throw new Error("Réponse inattendue");
      }
    } catch(e) {
      db.clearCreds();
      setError(e.message || "Connexion échouée — vérifiez l'URL et la clé");
    }
    setTesting(false);
  };

  const inp = { ...css.inp, fontSize: "0.83rem", fontFamily: "monospace" };

  return (
    <div style={{ minHeight: "100vh", background: TK.C, display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "Outfit,system-ui,sans-serif" }}>
      <div style={{ width: "90vw", maxWidth: 480, background: C2,
        border: `1px solid ${BRD2}`, borderRadius: 12, padding: "32px 28px",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, background: `linear-gradient(135deg,${BLUE},${BLUE}88)`,
            borderRadius: 10, marginBottom: 12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
              <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
              <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700,
            color: TK.TX, fontSize: "1rem", letterSpacing: "0.1em" }}>DEVIS·BASE ADMIN</div>
          <div style={{ color: TX4, fontSize: "0.78rem", marginTop: 6 }}>
            Configurez l'accès à votre base Supabase
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ color: TX3, fontSize: "0.72rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.07em" }}>
              URL Supabase
            </label>
            <input style={inp} value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://xxxxx.supabase.co"/>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ color: TX3, fontSize: "0.72rem", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Service Role Key
            </label>
            <input style={{ ...inp, fontSize: "0.72rem" }} value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              type="password"/>
            <div style={{ color: TX5, fontSize: "0.69rem", lineHeight: 1.5 }}>
              Supabase → Settings → API → <strong style={{color:TX4}}>service_role</strong> (secret).<br/>
              Stockée uniquement dans votre navigateur, jamais envoyée ailleurs.
            </div>
          </div>

          {error && (
            <div style={{ padding: "9px 12px", background: "#1a0608",
              border: "1px solid #3f1019", borderRadius: 6,
              color: "#fca5a5", fontSize: "0.78rem" }}>
              {error}
            </div>
          )}

          <button style={{ ...css.btnP, justifyContent: "center", padding: "10px",
            opacity: testing ? 0.6 : 1 }}
            onClick={test} disabled={testing}>
            {testing ? "Test de connexion…" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────────
export default function Dashboard() {
  const [configured, setConfigured] = useState(() => db.hasCreds());
  const [view, setView]       = useState("orgs");
  const [orgs, setOrgs]       = useState([]);
  const [members, setMembers] = useState([]);
  const [postes, setPostes]   = useState([]);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [search, setSearch]   = useState("");
  const [theme, setTheme]     = useState(getSavedTheme() || "dark");

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next); saveTheme(next); setTheme(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, m, p, l] = await Promise.all([
        db.select("organisations", "select=*&order=created_at.desc"),
        db.select("org_members",   "select=*"),
        db.select("postes",        "select=org_id"),
        db.select("activity_logs", "select=*&order=created_at.desc&limit=500"),
      ]);
      setOrgs(o||[]); setMembers(m||[]); setPostes(p||[]); setLogs(l||[]);
    } catch(e) { showToast("Erreur de chargement : " + e.message, "err"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onPlanChange = async (orgId, plan) => {
    await db.patch("organisations", orgId, { plan });
    setOrgs(o => o.map(x => x.id === orgId ? { ...x, plan } : x));
    showToast(`Plan mis à jour → ${plan.toUpperCase()}`);
  };

  const onDeleteOrg = async (orgId) => {
    await db.delete_("organisations", orgId);
    setOrgs(o => o.filter(x => x.id !== orgId));
    showToast("Organisation supprimée");
  };

  const { C, C2, C3, BRD, BRD2, TX, TX2, TX3, TX4, TX5, BLUE, AMBER, RED } = TK;
  const css = makeCss();

  // KPIs
  const proOrgs  = orgs.filter(o => o.plan === "pro").length;
  const entOrgs  = orgs.filter(o => o.plan === "enterprise").length;
  const mrr      = proOrgs * 49 + entOrgs * 149;
  const newThisMonth = orgs.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const VIEWS = [
    { key:"orgs",    label:"🏢 Organisations" },
    { key:"logs",    label:"📋 Logs activité"  },
  ];

  return (
    if (!configured) return <SetupScreen onSave={() => { setConfigured(true); load(); }} />;

    return (
    <div style={{ minHeight:"100vh", background:TK.C, fontFamily:"Outfit,system-ui,sans-serif",
      color:TK.TX }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:14, right:16, zIndex:9999,
          padding:"9px 18px", borderRadius:7, fontWeight:500, fontSize:"0.82rem",
          background: toast.type === "err" ? "#dc2626" : "#16a34a", color:"#fff",
          boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ height:54, background:C2, borderBottom:`1px solid ${BRD}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, background:`linear-gradient(135deg,${BLUE},${BLUE}99)`,
              borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
                <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
              </svg>
            </div>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700,
              fontSize:"0.88rem", letterSpacing:"0.08em" }}>DEVIS·BASE</span>
            <span style={{ padding:"2px 8px", borderRadius:6, fontSize:"0.6rem", fontWeight:700,
              background:"#7c3aed20", color:"#8b5cf6", textTransform:"uppercase",
              letterSpacing:"0.08em" }}>ADMIN</span>
          </div>
          <nav style={{ display:"flex", gap:2 }}>
            {VIEWS.map(v => (
              <button key={v.key} onClick={() => setView(v.key)}
                style={{ padding:"5px 12px", borderRadius:5, border:"none", cursor:"pointer",
                  fontSize:"0.78rem", fontWeight:500, fontFamily:"inherit", transition:"all .15s",
                  background: view===v.key ? `${BLUE}20` : "transparent",
                  color: view===v.key ? BLUE : TX3 }}>
                {v.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={load}
            style={{ ...css.btnS, padding:"4px 10px", fontSize:"0.73rem" }}>
            ↻ Actualiser
          </button>
          <button onClick={() => { db.clearCreds(); setConfigured(false); setOrgs([]); }}
            style={{ ...css.btnS, padding:"4px 10px", fontSize:"0.73rem", color:TK.TX4 }}>
            ⎋ Déconnecter
          </button>
          <button onClick={toggleTheme}
            style={{ ...css.btnS, padding:"4px 10px", fontSize:"0.73rem" }}>
            {theme === "dark" ? "☀ Clair" : "☾ Sombre"}
          </button>
        </div>
      </header>

      {/* Stats globales */}
      <div style={{ padding:"20px 24px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:20 }}>
          <Stat label="Organisations" value={orgs.length}  color={BLUE}/>
          <Stat label="MRR"           value={`${mrr}€`}    color="#16a34a" sub={`ARR estimé : ${mrr*12}€`}/>
          <Stat label="Plan Pro"       value={proOrgs}      color={BLUE}/>
          <Stat label="Enterprise"     value={entOrgs}      color="#7c3aed"/>
          <Stat label="Utilisateurs"   value={members.length} color={TX2}/>
          <Stat label="Nouveaux / mois" value={newThisMonth} color={AMBER}/>
        </div>
      </div>

      {/* Contenu */}
      <main style={{ padding:"0 24px 40px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:TX4 }}>Chargement des données…</div>
        ) : view === "orgs" ? (
          <OrgsView orgs={orgs} members={members} postes={postes} logs={logs}
            onPlanChange={onPlanChange} onDeleteOrg={onDeleteOrg}
            search={search} setSearch={setSearch}/>
        ) : (
          <LogsView logs={logs} orgs={orgs}/>
        )}
      </main>
    </div>
  );
}
