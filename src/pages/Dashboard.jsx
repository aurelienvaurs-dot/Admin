import { useEffect, useState, useCallback } from "react";
import { db } from "../lib/supabase.js";
import { makeCss } from "../lib/styles.js";
import { TK, applyTheme, getSavedTheme, saveTheme } from "../lib/theme.js";
import { fmtDate } from "../lib/helpers.js";

// ── Badges ─────────────────────────────────────────────────────────────────────
const PLAN_META = {
  free:       { color: "#64748b", bg: "#1e293b", label: "FREE" },
  pro:        { color: "#4a7fe8", bg: "#1e3a5f", label: "PRO"  },
  enterprise: { color: "#8b5cf6", bg: "#2d1b69", label: "ENT"  },
};
function PlanBadge({ plan }) {
  const p = PLAN_META[plan || "free"];
  return <span style={{ padding:"2px 9px", borderRadius:8, fontSize:"0.63rem", fontWeight:700,
    background:p.bg, color:p.color, textTransform:"uppercase", letterSpacing:"0.06em" }}>{p.label}</span>;
}
function StatusBadge({ status }) {
  const map = {
    active:    { color:"#16a34a", bg:"#052e16", label:"Actif" },
    suspended: { color:"#f0a030", bg:"#1c1000", label:"Suspendu" },
    free:      { color:"#64748b", bg:"#1e293b", label:"Free" },
    cancelled: { color:"#ef4444", bg:"#1a0608", label:"Résilié" },
  };
  const s = map[status] || map.free;
  return <span style={{ padding:"2px 9px", borderRadius:8, fontSize:"0.63rem", fontWeight:700,
    background:s.bg, color:s.color }}>{s.label}</span>;
}
function Stat({ label, value, color, sub, onClick }) {
  const { C2, BRD2, TX, TX4, TX5 } = TK;
  return (
    <div onClick={onClick} style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10,
      padding:"16px 18px", display:"flex", flexDirection:"column", gap:4,
      cursor:onClick?"pointer":"default" }}>
      <div style={{ color:color||TX, fontWeight:800, fontSize:"1.8rem",
        fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{value}</div>
      <div style={{ color:TX4, fontSize:"0.7rem", textTransform:"uppercase",
        letterSpacing:"0.07em" }}>{label}</div>
      {sub && <div style={{ color:TX5, fontSize:"0.68rem" }}>{sub}</div>}
    </div>
  );
}
function InfoRow({ label, value }) {
  const { TX4, TX2 } = TK;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0",
      borderBottom:`1px solid ${TK.BRD}` }}>
      <span style={{ color:TX4, fontSize:"0.74rem" }}>{label}</span>
      <span style={{ color:TX2, fontSize:"0.74rem", fontFamily:"monospace",
        maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        textAlign:"right" }}>{value}</span>
    </div>
  );
}
function SectionCard({ title, children }) {
  const { C2, BRD2, TX } = TK;
  return (
    <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10, padding:"14px 16px" }}>
      {title && <div style={{ color:TX, fontWeight:600, fontSize:"0.82rem", marginBottom:10 }}>{title}</div>}
      {children}
    </div>
  );
}
function orgStatus(org) {
  if (org.suspended) return "suspended";
  if (org.plan !== "free" && org.stripe_sub_id) return "active";
  return "free";
}

// ── Vue Organisations ──────────────────────────────────────────────────────────
function OrgsView({ orgs, members, postes, logs, onPlanChange, onDeleteOrg, onToggleSuspend, search, setSearch }) {
  const { C, C2, C3, BRD, BRD2, TX, TX3, TX4, TX5, BLUE, RED, AMBER } = TK;
  const css = makeCss();
  const [selected, setSelected] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = orgs.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.plan?.toLowerCase().includes(search.toLowerCase())
  );
  const orgMembers   = id => members.filter(m => m.org_id === id);
  const orgPostes    = id => postes.filter(p => p.org_id === id).length;
  const orgAdmins    = id => members.filter(m => m.org_id === id && m.role === "admin");
  const orgLogs      = id => logs.filter(l => l.org_id === id).slice(0, 6);
  const lastActivity = id => { const l = logs.find(x => x.org_id === id); return l ? fmtDate(l.created_at) : "—"; };

  useEffect(() => {
    if (selected) {
      const u = orgs.find(o => o.id === selected.id);
      setSelected(u || null);
    }
  }, [orgs]);

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try { await onDeleteOrg(selected.id); setSelected(null); setConfirmDel(null); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
      <div style={{ flex:1, minWidth:0 }}>
        <input style={{ ...css.inp, marginBottom:14 }} placeholder="Rechercher une organisation…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ border:`1px solid ${BRD}`, borderRadius:8, overflow:"hidden" }}>
          <table style={css.tbl}>
            <thead><tr>
              <th style={css.th}>Organisation</th>
              <th style={css.th}>Plan</th>
              <th style={css.th}>Statut</th>
              <th style={{ ...css.th, textAlign:"right" }}>Membres</th>
              <th style={{ ...css.th, textAlign:"right" }}>Postes</th>
              <th style={css.th}>Activité</th>
              <th style={css.th}>Créée le</th>
              <th style={css.th}>Plan</th>
            </tr></thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.id} style={{ background:selected?.id===o.id?`${BLUE}12`:i%2===0?C:C3,
                  cursor:"pointer", opacity:o.suspended?0.6:1 }}
                  onClick={() => setSelected(s => s?.id===o.id ? null : o)}>
                  <td style={{ ...css.td, fontWeight:600, color:TX }}>{o.name}</td>
                  <td style={css.td}><PlanBadge plan={o.plan}/></td>
                  <td style={css.td}><StatusBadge status={orgStatus(o)}/></td>
                  <td style={{ ...css.td, textAlign:"right", fontFamily:"monospace" }}>{orgMembers(o.id).length}</td>
                  <td style={{ ...css.td, textAlign:"right", fontFamily:"monospace" }}>{orgPostes(o.id)}</td>
                  <td style={{ ...css.td, color:TX4, fontSize:"0.73rem" }}>{lastActivity(o.id)}</td>
                  <td style={{ ...css.td, color:TX4, fontSize:"0.73rem" }}>{fmtDate(o.created_at)}</td>
                  <td style={css.td} onClick={e => e.stopPropagation()}>
                    <select style={{ ...css.sel, fontSize:"0.72rem", padding:"3px 6px" }}
                      value={o.plan||"free"} onChange={e => onPlanChange(o.id, e.target.value)}>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={8} style={{ ...css.td, textAlign:"center", color:TX4, padding:24 }}>
                  Aucune organisation
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div style={{ width:320, flexShrink:0, display:"flex", flexDirection:"column", gap:10 }}>
          <SectionCard>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ color:TX, fontWeight:700, fontSize:"0.95rem" }}>{selected.name}</div>
                <div style={{ display:"flex", gap:5, marginTop:5 }}>
                  <PlanBadge plan={selected.plan}/>
                  <StatusBadge status={orgStatus(selected)}/>
                </div>
              </div>
              <button style={{ ...css.iBtn, color:TX4 }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <InfoRow label="ID" value={selected.id?.slice(0,12)+"…"}/>
            <InfoRow label="Créée le" value={fmtDate(selected.created_at)}/>
            <InfoRow label="Membres" value={orgMembers(selected.id).length}/>
            <InfoRow label="Postes importés" value={orgPostes(selected.id)}/>
            <InfoRow label="Stripe Customer" value={selected.stripe_customer_id||"—"}/>
            <InfoRow label="Stripe Sub" value={selected.stripe_sub_id||"—"}/>
          </SectionCard>

          <SectionCard title={`Admins (${orgAdmins(selected.id).length})`}>
            {orgAdmins(selected.id).length===0 ? (
              <div style={{ color:TX4, fontSize:"0.75rem" }}>Aucun admin</div>
            ) : orgAdmins(selected.id).map(m => (
              <div key={m.id} style={{ display:"flex", alignItems:"center", gap:6,
                padding:"4px 0", borderBottom:`1px solid ${BRD}` }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:BLUE, flexShrink:0 }}/>
                <span style={{ color:TX3, fontSize:"0.76rem", overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {m.email||m.user_id?.slice(0,12)}
                </span>
              </div>
            ))}
          </SectionCard>

          <SectionCard title={`Membres (${orgMembers(selected.id).length})`}>
            <div style={{ maxHeight:130, overflowY:"auto" }}>
              {orgMembers(selected.id).map(m => (
                <div key={m.id} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"4px 0", borderBottom:`1px solid ${BRD}` }}>
                  <span style={{ color:TX3, fontSize:"0.74rem", overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }}>
                    {m.email||m.user_id?.slice(0,12)}
                  </span>
                  <span style={{ fontSize:"0.66rem", color:m.role==="admin"?BLUE:TX4,
                    fontWeight:600, textTransform:"uppercase", flexShrink:0 }}>{m.role}</span>
                </div>
              ))}
              {orgMembers(selected.id).length===0 && <div style={{ color:TX4, fontSize:"0.75rem" }}>Aucun membre</div>}
            </div>
          </SectionCard>

          <SectionCard title="Activité récente">
            {orgLogs(selected.id).length===0 ? (
              <div style={{ color:TX4, fontSize:"0.75rem" }}>Aucune activité</div>
            ) : orgLogs(selected.id).map(l => (
              <div key={l.id} style={{ display:"flex", justifyContent:"space-between",
                padding:"4px 0", borderBottom:`1px solid ${BRD}` }}>
                <span style={{ color:TX3, fontSize:"0.71rem" }}>{l.action}</span>
                <span style={{ color:TX5, fontSize:"0.68rem", flexShrink:0, marginLeft:8 }}>{fmtDate(l.created_at)}</span>
              </div>
            ))}
          </SectionCard>

          <div style={{ background:C2, border:`1px solid ${RED}30`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ color:RED, fontWeight:600, fontSize:"0.8rem", marginBottom:10 }}>Zone danger</div>
            <button style={{ ...css.btnS, fontSize:"0.74rem", width:"100%", marginBottom:8, justifyContent:"center",
              color:orgStatus(selected)==="suspended"?"#16a34a":AMBER,
              borderColor:orgStatus(selected)==="suspended"?"#16a34a40":`${AMBER}40` }}
              onClick={() => onToggleSuspend(selected)}>
              {orgStatus(selected)==="suspended" ? "✓ Réactiver l'organisation" : "⚠ Suspendre l'organisation"}
            </button>
            {confirmDel!==selected.id ? (
              <button style={{ ...css.btnS, color:RED, borderColor:`${RED}40`, background:`${RED}08`,
                fontSize:"0.74rem", padding:"5px 11px", display:"block", width:"100%", justifyContent:"center" }}
                onClick={() => setConfirmDel(selected.id)}>
                🗑 Supprimer l'organisation
              </button>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:7,
                background:`${RED}08`, border:`1px solid ${RED}30`, borderRadius:6, padding:"10px 12px" }}>
                <div style={{ color:TX3, fontSize:"0.73rem", lineHeight:1.5 }}>
                  Supprimer <strong style={{ color:TX }}>{selected.name}</strong> et
                  <strong style={{ color:RED }}> toutes ses données</strong> ?
                  <br/><span style={{ color:TX4 }}>Membres, postes, logs — irrécupérable.</span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button style={{ ...css.btnP, fontSize:"0.73rem", padding:"5px 10px",
                    background:RED, border:`1px solid ${RED}`, opacity:deleting?0.6:1 }}
                    onClick={handleDelete} disabled={deleting}>
                    {deleting?"Suppression…":"Confirmer"}
                  </button>
                  <button style={{ ...css.btnS, fontSize:"0.73rem", padding:"5px 10px" }}
                    onClick={() => setConfirmDel(null)}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vue Utilisateurs ───────────────────────────────────────────────────────────
function UsersView({ members, orgs, logs, onBlockUser, onUnblockUser }) {
  const { C, C2, C3, BRD, BRD2, TX, TX3, TX4, TX5, BLUE, RED, AMBER } = TK;
  const css = makeCss();
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selected, setSelected] = useState(null);

  const allUsers = Object.values(members.reduce((acc, m) => {
    if (!acc[m.user_id]) acc[m.user_id] = { user_id:m.user_id, email:m.email, orgs:[], roles:[], blocked:m.blocked||false };
    const org = orgs.find(o => o.id===m.org_id);
    if (org) { acc[m.user_id].orgs.push({ ...org, role:m.role }); acc[m.user_id].roles.push(m.role); }
    if (m.blocked) acc[m.user_id].blocked = true;
    return acc;
  }, {}));

  const userPlan = u => {
    const plans = u.orgs.map(o => o.plan);
    if (plans.includes("enterprise")) return "enterprise";
    if (plans.includes("pro")) return "pro";
    return "free";
  };
  const lastActivity = uid => { const l = logs.find(x => x.user_id===uid); return l ? fmtDate(l.created_at) : "—"; };
  const userLogs = uid => logs.filter(l => l.user_id===uid).slice(0, 8);

  const filtered = allUsers.filter(u => {
    const ms = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.user_id?.includes(search);
    const mp = filterPlan==="all" || userPlan(u)===filterPlan;
    return ms && mp;
  });

  useEffect(() => {
    if (selected) {
      const u = allUsers.find(x => x.user_id===selected.user_id);
      setSelected(u||null);
    }
  }, [members]);

  return (
    <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <input style={{ ...css.inp, flex:1 }} placeholder="Rechercher par email ou ID…"
            value={search} onChange={e => setSearch(e.target.value)}/>
          <select style={{ ...css.sel, minWidth:130 }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
            <option value="all">Tous les plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div style={{ color:TX4, fontSize:"0.72rem", marginBottom:8 }}>
          {filtered.length} utilisateur{filtered.length>1?"s":""}
        </div>
        <div style={{ border:`1px solid ${BRD}`, borderRadius:8, overflow:"hidden" }}>
          <table style={css.tbl}>
            <thead><tr>
              <th style={css.th}>Email</th>
              <th style={css.th}>Plan</th>
              <th style={{ ...css.th, textAlign:"right" }}>Orgs</th>
              <th style={css.th}>Rôle max</th>
              <th style={css.th}>Dernière activité</th>
              <th style={css.th}>Statut</th>
            </tr></thead>
            <tbody>
              {filtered.map((u, i) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.user_id} style={{ background:selected?.user_id===u.user_id?`${BLUE}12`:i%2===0?C:C3,
                    cursor:"pointer", opacity:u.blocked?0.5:1 }}
                    onClick={() => setSelected(s => s?.user_id===u.user_id?null:u)}>
                    <td style={{ ...css.td, color:TX, fontWeight:500, maxWidth:220,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {u.email||u.user_id?.slice(0,16)+"…"}
                    </td>
                    <td style={css.td}><PlanBadge plan={userPlan(u)}/></td>
                    <td style={{ ...css.td, textAlign:"right", fontFamily:"monospace" }}>{u.orgs.length}</td>
                    <td style={css.td}>
                      <span style={{ fontSize:"0.68rem", color:isAdmin?BLUE:TX4, fontWeight:600, textTransform:"uppercase" }}>
                        {isAdmin?"Admin":"Member"}
                      </span>
                    </td>
                    <td style={{ ...css.td, color:TX4, fontSize:"0.73rem" }}>{lastActivity(u.user_id)}</td>
                    <td style={css.td}>
                      {u.blocked
                        ? <span style={{ fontSize:"0.68rem", color:RED, fontWeight:600 }}>Bloqué</span>
                        : <span style={{ fontSize:"0.68rem", color:"#16a34a", fontWeight:600 }}>Actif</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0 && (
                <tr><td colSpan={6} style={{ ...css.td, textAlign:"center", color:TX4, padding:24 }}>
                  Aucun utilisateur
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div style={{ width:300, flexShrink:0, display:"flex", flexDirection:"column", gap:10 }}>
          <SectionCard>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ color:TX, fontWeight:700, fontSize:"0.85rem", wordBreak:"break-all", flex:1, marginRight:8 }}>
                {selected.email||"—"}
              </div>
              <button style={{ ...css.iBtn, color:TX4 }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <InfoRow label="User ID" value={selected.user_id?.slice(0,14)+"…"}/>
            <InfoRow label="Plan" value={userPlan(selected).toUpperCase()}/>
            <InfoRow label="Organisations" value={selected.orgs.length}/>
            <InfoRow label="Dernière activité" value={lastActivity(selected.user_id)}/>
          </SectionCard>

          <SectionCard title="Organisations">
            {selected.orgs.length===0
              ? <div style={{ color:TX4, fontSize:"0.75rem" }}>Aucune</div>
              : selected.orgs.map(o => (
                <div key={o.id} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${BRD}` }}>
                  <div>
                    <div style={{ color:TX3, fontSize:"0.76rem" }}>{o.name}</div>
                    <div style={{ marginTop:3 }}><PlanBadge plan={o.plan}/></div>
                  </div>
                  <span style={{ fontSize:"0.66rem", color:o.role==="admin"?BLUE:TX4,
                    fontWeight:600, textTransform:"uppercase" }}>{o.role}</span>
                </div>
              ))
            }
          </SectionCard>

          <SectionCard title="Activité récente">
            {userLogs(selected.user_id).length===0
              ? <div style={{ color:TX4, fontSize:"0.75rem" }}>Aucune activité</div>
              : userLogs(selected.user_id).map(l => (
                <div key={l.id} style={{ display:"flex", justifyContent:"space-between",
                  padding:"4px 0", borderBottom:`1px solid ${BRD}` }}>
                  <span style={{ color:TX3, fontSize:"0.71rem" }}>{l.action}</span>
                  <span style={{ color:TX5, fontSize:"0.68rem", flexShrink:0, marginLeft:8 }}>{fmtDate(l.created_at)}</span>
                </div>
              ))
            }
          </SectionCard>

          <div style={{ background:C2, border:`1px solid ${RED}30`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ color:RED, fontWeight:600, fontSize:"0.8rem", marginBottom:8 }}>Modération</div>
            {selected.blocked ? (
              <button style={{ ...css.btnS, fontSize:"0.74rem", color:"#16a34a", borderColor:"#16a34a40", width:"100%", justifyContent:"center" }}
                onClick={() => onUnblockUser(selected.user_id)}>
                ✓ Débloquer le compte
              </button>
            ) : (
              <>
                <div style={{ color:TX4, fontSize:"0.72rem", marginBottom:8 }}>
                  Bloquer empêche la connexion sans supprimer les données.
                </div>
                <button style={{ ...css.btnS, fontSize:"0.74rem", color:AMBER, borderColor:`${AMBER}40`, width:"100%", justifyContent:"center" }}
                  onClick={() => onBlockUser(selected.user_id)}>
                  ⚠ Bloquer le compte
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vue Paiements ──────────────────────────────────────────────────────────────
function PaymentsView({ orgs, logs }) {
  const { C, C2, C3, BRD, BRD2, TX, TX3, TX4, TX5, BLUE, RED, AMBER } = TK;
  const css = makeCss();
  const [period, setPeriod] = useState("all");

  const now = new Date();
  const applyPeriod = list => {
    if (period==="all") return list;
    const cutoff = new Date();
    if (period==="30d") cutoff.setDate(now.getDate()-30);
    else if (period==="90d") cutoff.setDate(now.getDate()-90);
    else if (period==="1y") cutoff.setFullYear(now.getFullYear()-1);
    return list.filter(x => x.created_at && new Date(x.created_at)>=cutoff);
  };

  const paidOrgs = orgs.filter(o => o.plan!=="free" && o.stripe_sub_id);
  const proOrgs  = paidOrgs.filter(o => o.plan==="pro");
  const entOrgs  = paidOrgs.filter(o => o.plan==="enterprise");
  const mrr      = proOrgs.length*49 + entOrgs.length*149;
  const churned  = orgs.filter(o => o.plan==="free" && o.stripe_customer_id);

  const paymentLogs = logs.filter(l => {
    const a = (l.action||"").toLowerCase();
    return a.includes("payment")||a.includes("stripe")||a.includes("checkout")||a.includes("plan")||a.includes("upgrade")||a.includes("subscription");
  });

  const filteredPaid   = applyPeriod([...paidOrgs].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)));
  const filteredChurn  = applyPeriod([...churned]);
  const filteredLogs   = applyPeriod([...paymentLogs]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ color:TX4, fontSize:"0.75rem" }}>Période :</span>
        {[["all","Tout"],["30d","30 j"],["90d","90 j"],["1y","1 an"]].map(([v,l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${period===v?BLUE:BRD2}`,
              background:period===v?`${BLUE}20`:"transparent",
              color:period===v?BLUE:TX4, cursor:"pointer", fontSize:"0.74rem" }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <Stat label="MRR" value={`${mrr} €`} color="#16a34a" sub={`ARR : ${(mrr*12).toLocaleString("fr-FR")} €`}/>
        <Stat label="Abonnés Pro" value={proOrgs.length} color={BLUE} sub="49 €/mois"/>
        <Stat label="Abonnés Ent." value={entOrgs.length} color="#8b5cf6" sub="149 €/mois"/>
        <Stat label="Résiliés (churn)" value={churned.length} color={RED} sub="Free + ancien Stripe"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${BRD}`, color:TX,
            fontWeight:600, fontSize:"0.84rem", display:"flex", justifyContent:"space-between" }}>
            <span>Abonnements actifs</span>
            <span style={{ color:TX4, fontWeight:400, fontSize:"0.75rem" }}>{filteredPaid.length}</span>
          </div>
          <div style={{ maxHeight:300, overflowY:"auto" }}>
            <table style={css.tbl}>
              <thead><tr>
                <th style={css.th}>Organisation</th>
                <th style={css.th}>Plan</th>
                <th style={{ ...css.th, textAlign:"right" }}>MRR</th>
                <th style={css.th}>Depuis</th>
              </tr></thead>
              <tbody>
                {filteredPaid.map((o,i) => (
                  <tr key={o.id} style={{ background:i%2===0?C:C3 }}>
                    <td style={{ ...css.td, color:TX, fontWeight:500 }}>{o.name}</td>
                    <td style={css.td}><PlanBadge plan={o.plan}/></td>
                    <td style={{ ...css.td, textAlign:"right", fontFamily:"monospace", color:"#16a34a", fontWeight:600 }}>
                      {o.plan==="enterprise"?"149 €":"49 €"}
                    </td>
                    <td style={{ ...css.td, color:TX4, fontSize:"0.72rem" }}>{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
                {filteredPaid.length===0 && (
                  <tr><td colSpan={4} style={{ ...css.td, textAlign:"center", color:TX4, padding:20 }}>Aucun abonnement</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${BRD}`, color:TX,
            fontWeight:600, fontSize:"0.84rem", display:"flex", justifyContent:"space-between" }}>
            <span>Résiliations</span>
            <span style={{ color:RED, fontWeight:400, fontSize:"0.75rem" }}>{filteredChurn.length}</span>
          </div>
          <div style={{ maxHeight:300, overflowY:"auto" }}>
            <table style={css.tbl}>
              <thead><tr>
                <th style={css.th}>Organisation</th>
                <th style={css.th}>Stripe Customer</th>
                <th style={css.th}>Créée le</th>
              </tr></thead>
              <tbody>
                {filteredChurn.map((o,i) => (
                  <tr key={o.id} style={{ background:i%2===0?C:C3 }}>
                    <td style={{ ...css.td, color:TX3 }}>{o.name}</td>
                    <td style={{ ...css.td, fontFamily:"monospace", fontSize:"0.7rem", color:TX4 }}>
                      {o.stripe_customer_id?.slice(0,20)+"…"}
                    </td>
                    <td style={{ ...css.td, color:TX4, fontSize:"0.72rem" }}>{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
                {filteredChurn.length===0 && (
                  <tr><td colSpan={3} style={{ ...css.td, textAlign:"center", color:TX4, padding:20 }}>Aucune résiliation</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ background:C2, border:`1px solid ${BRD2}`, borderRadius:10, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${BRD}`, color:TX, fontWeight:600, fontSize:"0.84rem" }}>
          Événements paiements ({filteredLogs.length})
        </div>
        {filteredLogs.length===0 ? (
          <div style={{ padding:"20px 16px", color:TX4, fontSize:"0.78rem", textAlign:"center" }}>
            Aucun événement paiement trouvé dans les logs
          </div>
        ) : (
          <table style={css.tbl}>
            <thead><tr>
              <th style={css.th}>Date</th><th style={css.th}>Action</th>
              <th style={css.th}>Utilisateur</th><th style={css.th}>Détails</th>
            </tr></thead>
            <tbody>
              {filteredLogs.slice(0,50).map((l,i) => (
                <tr key={l.id} style={{ background:i%2===0?C:C3 }}>
                  <td style={{ ...css.td, color:TX4, fontSize:"0.72rem", whiteSpace:"nowrap" }}>{fmtDate(l.created_at)}</td>
                  <td style={css.td}><span style={{ fontFamily:"monospace", fontSize:"0.71rem", color:"#8b5cf6" }}>{l.action}</span></td>
                  <td style={{ ...css.td, color:TX3, fontSize:"0.73rem" }}>{l.user_email||l.user_id?.slice(0,10)||"—"}</td>
                  <td style={{ ...css.td, color:TX4, fontSize:"0.7rem", maxWidth:240,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {typeof l.details==="object"?JSON.stringify(l.details):l.details||"—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Vue Logs ───────────────────────────────────────────────────────────────────
function LogsView({ logs, orgs }) {
  const { C, C3, BRD, TX, TX3, TX4, TX5, BLUE, AMBER } = TK;
  const css = makeCss();
  const [filter, setFilter] = useState("");
  const [cat, setCat] = useState("all");

  const orgName = id => orgs.find(o => o.id===id)?.name || id?.slice(0,8)||"—";
  const matchCat = action => {
    const a = (action||"").toLowerCase();
    if (a.includes("import")||a.includes("devis")||a.includes("poste")) return "import";
    if (a.includes("login")||a.includes("register")||a.includes("password")) return "auth";
    if (a.includes("payment")||a.includes("stripe")||a.includes("plan")||a.includes("upgrade")||a.includes("checkout")) return "payment";
    if (a.includes("team")||a.includes("member")||a.includes("invite")||a.includes("join")) return "team";
    return "other";
  };
  const actionColor = action => {
    const t = matchCat(action);
    if (t==="import") return BLUE;
    if (t==="auth") return "#16a34a";
    if (t==="payment") return "#8b5cf6";
    if (t==="team") return AMBER;
    return TX3;
  };
  const filtered = logs.filter(l => {
    const ms = !filter || l.action?.includes(filter) ||
      orgName(l.org_id)?.toLowerCase().includes(filter.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(filter.toLowerCase());
    const mc = cat==="all"||matchCat(l.action)===cat;
    return ms && mc;
  });

  const CATS = { all:"Tous", import:"Import", auth:"Auth", payment:"Paiement", team:"Équipe", other:"Autre" };

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <input style={{ ...css.inp, flex:1, minWidth:200 }}
          placeholder="Filtrer par action, org, email…" value={filter} onChange={e => setFilter(e.target.value)}/>
        <select style={{ ...css.sel, minWidth:130 }} value={cat} onChange={e => setCat(e.target.value)}>
          {Object.entries(CATS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div style={{ color:TX4, fontSize:"0.72rem", marginBottom:8 }}>
        {filtered.length} log{filtered.length>1?"s":""} — max 200 affichés
      </div>
      <div style={{ border:`1px solid ${BRD}`, borderRadius:8, overflow:"hidden" }}>
        <table style={css.tbl}>
          <thead><tr>
            <th style={css.th}>Date</th><th style={css.th}>Organisation</th>
            <th style={css.th}>Action</th><th style={css.th}>Utilisateur</th><th style={css.th}>Détails</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0,200).map((l,i) => (
              <tr key={l.id} style={{ background:i%2===0?C:C3 }}>
                <td style={{ ...css.td, color:TX4, fontSize:"0.72rem", whiteSpace:"nowrap" }}>{fmtDate(l.created_at)}</td>
                <td style={{ ...css.td, fontWeight:500, color:TX, fontSize:"0.78rem" }}>{orgName(l.org_id)}</td>
                <td style={css.td}>
                  <span style={{ fontSize:"0.72rem", fontFamily:"monospace", color:actionColor(l.action) }}>{l.action}</span>
                </td>
                <td style={{ ...css.td, color:TX3, fontSize:"0.73rem" }}>{l.user_email||l.user_id?.slice(0,10)||"—"}</td>
                <td style={{ ...css.td, color:TX4, fontSize:"0.7rem", maxWidth:220,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {typeof l.details==="object"?JSON.stringify(l.details):l.details||"—"}
                </td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={5} style={{ ...css.td, textAlign:"center", color:TX4, padding:24 }}>Aucun log</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Setup Screen ───────────────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [url, setUrl] = useState("https://yzmcqjtepybifjbyxfer.supabase.co");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const { C2, BRD2, TX, TX3, TX4, TX5, BLUE } = TK;
  const css = makeCss();
  const inp = { ...css.inp, fontSize:"0.83rem", fontFamily:"monospace" };
  const test = async () => {
    if (!url||!key) { setError("Les deux champs sont requis"); return; }
    setTesting(true); setError("");
    try {
      db.saveCreds(url, key);
      const r = await db.select("organisations", "select=id&limit=1");
      if (Array.isArray(r)) onSave();
      else throw new Error("Réponse inattendue");
    } catch(e) { db.clearCreds(); setError(e.message||"Connexion échouée"); }
    setTesting(false);
  };
  return (
    <div style={{ minHeight:"100vh", background:TK.C, display:"flex", alignItems:"center",
      justifyContent:"center", fontFamily:"Outfit,system-ui,sans-serif" }}>
      <div style={{ width:"90vw", maxWidth:480, background:C2, border:`1px solid ${BRD2}`,
        borderRadius:12, padding:"32px 28px", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:48, height:48, background:`linear-gradient(135deg,${BLUE},${BLUE}88)`,
            borderRadius:10, marginBottom:12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
              <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
              <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
            </svg>
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, color:TK.TX, fontSize:"1rem", letterSpacing:"0.1em" }}>DEVIS·BASE ADMIN</div>
          <div style={{ color:TX4, fontSize:"0.78rem", marginTop:6 }}>Configurez l'accès à votre base Supabase</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ color:TX3, fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>URL Supabase</label>
            <input style={inp} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxxx.supabase.co"/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ color:TX3, fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em" }}>Service Role Key</label>
            <input style={{ ...inp, fontSize:"0.72rem" }} value={key} onChange={e => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." type="password"/>
            <div style={{ color:TX5, fontSize:"0.69rem", lineHeight:1.5 }}>
              Supabase → Settings → API → <strong style={{ color:TX4 }}>service_role</strong> (secret).<br/>
              Stockée uniquement dans votre navigateur.
            </div>
          </div>
          {error && (
            <div style={{ padding:"9px 12px", background:"#1a0608", border:"1px solid #3f1019",
              borderRadius:6, color:"#fca5a5", fontSize:"0.78rem" }}>{error}</div>
          )}
          <button style={{ ...css.btnP, justifyContent:"center", padding:"10px", opacity:testing?0.6:1 }}
            onClick={test} disabled={testing}>
            {testing?"Test de connexion…":"Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [configured, setConfigured] = useState(() => db.hasCreds());
  const [view, setView]     = useState("orgs");
  const [orgs, setOrgs]     = useState([]);
  const [members, setMembers] = useState([]);
  const [postes, setPostes] = useState([]);
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  const [search, setSearch] = useState("");
  const [theme, setTheme]   = useState(getSavedTheme()||"dark");

  const showToast = (msg, type="ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const toggleTheme = () => { const n=theme==="dark"?"light":"dark"; applyTheme(n); saveTheme(n); setTheme(n); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o,m,p,l] = await Promise.all([
        db.select("organisations", "select=*&order=created_at.desc"),
        db.select("org_members",   "select=*"),
        db.select("postes",        "select=org_id"),
        db.select("activity_logs", "select=*&order=created_at.desc&limit=1000"),
      ]);
      setOrgs(o||[]); setMembers(m||[]); setPostes(p||[]); setLogs(l||[]);
    } catch(e) { showToast("Erreur de chargement : "+e.message, "err"); }
    setLoading(false);
  }, []);

  useEffect(() => { if (configured) load(); }, [load, configured]);

  const onPlanChange = async (orgId, plan) => {
    try {
      await db.patch("organisations", orgId, { plan });
      setOrgs(o => o.map(x => x.id===orgId?{...x,plan}:x));
      showToast(`Plan mis à jour → ${plan.toUpperCase()}`);
    } catch(e) { showToast("Erreur : "+e.message, "err"); }
  };

  const onDeleteOrg = async (orgId) => {
    try {
      // Suppression en cascade dans l'ordre des dépendances FK
      await db.deleteWhere("activity_logs",  `org_id=eq.${orgId}`).catch(()=>{});
      await db.deleteWhere("devis_files",    `org_id=eq.${orgId}`).catch(()=>{});
      await db.deleteWhere("postes",         `org_id=eq.${orgId}`).catch(()=>{});
      await db.deleteWhere("projets",        `org_id=eq.${orgId}`).catch(()=>{});
      await db.deleteWhere("org_invitations",`org_id=eq.${orgId}`).catch(()=>{});
      await db.deleteWhere("org_members",    `org_id=eq.${orgId}`).catch(()=>{});
      await db.delete_("organisations", orgId);
      setOrgs(o => o.filter(x => x.id!==orgId));
      setMembers(m => m.filter(x => x.org_id!==orgId));
      setPostes(p => p.filter(x => x.org_id!==orgId));
      setLogs(l => l.filter(x => x.org_id!==orgId));
      showToast("Organisation et toutes ses données supprimées");
    } catch(e) { showToast("Erreur suppression : "+e.message, "err"); }
  };

  const onToggleSuspend = async (org) => {
    const v = !org.suspended;
    try {
      await db.patch("organisations", org.id, { suspended:v });
      setOrgs(o => o.map(x => x.id===org.id?{...x,suspended:v}:x));
      showToast(v?"Organisation suspendue":"Organisation réactivée");
    } catch(e) { showToast("Erreur : "+e.message, "err"); }
  };

  const onBlockUser = async (userId) => {
    try {
      await db.patchWhere("org_members", `user_id=eq.${userId}`, { blocked:true });
      setMembers(m => m.map(x => x.user_id===userId?{...x,blocked:true}:x));
      showToast("Compte bloqué");
    } catch(e) { showToast("Erreur : "+e.message, "err"); }
  };

  const onUnblockUser = async (userId) => {
    try {
      await db.patchWhere("org_members", `user_id=eq.${userId}`, { blocked:false });
      setMembers(m => m.map(x => x.user_id===userId?{...x,blocked:false}:x));
      showToast("Compte débloqué");
    } catch(e) { showToast("Erreur : "+e.message, "err"); }
  };

  const { C, C2, C3, BRD, BRD2, TX, TX2, TX3, TX4, BLUE, AMBER, RED } = TK;
  const css = makeCss();

  const proOrgs      = orgs.filter(o => o.plan==="pro").length;
  const entOrgs      = orgs.filter(o => o.plan==="enterprise").length;
  const mrr          = proOrgs*49 + entOrgs*149;
  const now          = new Date();
  const newThisMonth = orgs.filter(o => { const d=new Date(o.created_at); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  const churnCount   = orgs.filter(o => o.plan==="free"&&o.stripe_customer_id).length;

  const VIEWS = [
    { key:"orgs",     label:"🏢 Organisations" },
    { key:"users",    label:"👤 Utilisateurs"  },
    { key:"payments", label:"💳 Paiements"     },
    { key:"logs",     label:"📋 Logs"          },
  ];

  if (!configured) return <SetupScreen onSave={() => setConfigured(true)}/>;

  return (
    <div style={{ minHeight:"100vh", background:TK.C, fontFamily:"Outfit,system-ui,sans-serif", color:TK.TX }}>
      {toast && (
        <div style={{ position:"fixed", top:14, right:16, zIndex:9999, padding:"9px 18px",
          borderRadius:7, fontWeight:500, fontSize:"0.82rem", color:"#fff",
          background:toast.type==="err"?"#dc2626":"#16a34a", boxShadow:"0 4px 20px rgba(0,0,0,.4)" }}>
          {toast.msg}
        </div>
      )}

      <header style={{ height:54, background:C2, borderBottom:`1px solid ${BRD}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
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
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:"0.88rem", letterSpacing:"0.08em" }}>DEVIS·BASE</span>
            <span style={{ padding:"2px 8px", borderRadius:6, fontSize:"0.6rem", fontWeight:700,
              background:"#7c3aed20", color:"#8b5cf6", textTransform:"uppercase", letterSpacing:"0.08em" }}>ADMIN</span>
          </div>
          <nav style={{ display:"flex", gap:2 }}>
            {VIEWS.map(v => (
              <button key={v.key} onClick={() => setView(v.key)}
                style={{ padding:"5px 12px", borderRadius:5, border:"none", cursor:"pointer",
                  fontSize:"0.78rem", fontWeight:500, fontFamily:"inherit", transition:"all .15s",
                  background:view===v.key?`${BLUE}20`:"transparent",
                  color:view===v.key?BLUE:TX3 }}>
                {v.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} style={{ ...css.btnS, padding:"4px 10px", fontSize:"0.73rem" }}>↻ Actualiser</button>
          <button onClick={() => { db.clearCreds(); setConfigured(false); setOrgs([]); setMembers([]); setPostes([]); setLogs([]); }}
            style={{ ...css.btnS, padding:"4px 10px", fontSize:"0.73rem", color:TX4 }}>⎋ Déconnecter</button>
          <button onClick={toggleTheme} style={{ ...css.btnS, padding:"4px 10px", fontSize:"0.73rem" }}>
            {theme==="dark"?"☀ Clair":"☾ Sombre"}
          </button>
        </div>
      </header>

      <div style={{ padding:"20px 24px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10, marginBottom:20 }}>
          <Stat label="Organisations"   value={orgs.length}    color={BLUE}      onClick={() => setView("orgs")}/>
          <Stat label="MRR"             value={`${mrr} €`}    color="#16a34a"   sub={`ARR : ${(mrr*12).toLocaleString("fr-FR")} €`} onClick={() => setView("payments")}/>
          <Stat label="Plan Pro"        value={proOrgs}        color={BLUE}      onClick={() => setView("payments")}/>
          <Stat label="Enterprise"      value={entOrgs}        color="#8b5cf6"   onClick={() => setView("payments")}/>
          <Stat label="Utilisateurs"    value={members.length} color={TX2}       onClick={() => setView("users")}/>
          <Stat label="Nouveaux / mois" value={newThisMonth}   color={AMBER}/>
          <Stat label="Résiliés"        value={churnCount}     color={RED}       onClick={() => setView("payments")}/>
        </div>
      </div>

      <main style={{ padding:"0 24px 40px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:TX4 }}>Chargement des données…</div>
        ) : view==="orgs" ? (
          <OrgsView orgs={orgs} members={members} postes={postes} logs={logs}
            onPlanChange={onPlanChange} onDeleteOrg={onDeleteOrg} onToggleSuspend={onToggleSuspend}
            search={search} setSearch={setSearch}/>
        ) : view==="users" ? (
          <UsersView members={members} orgs={orgs} logs={logs}
            onBlockUser={onBlockUser} onUnblockUser={onUnblockUser}/>
        ) : view==="payments" ? (
          <PaymentsView orgs={orgs} logs={logs}/>
        ) : (
          <LogsView logs={logs} orgs={orgs}/>
        )}
      </main>
    </div>
  );
}
