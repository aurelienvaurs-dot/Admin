import { TK } from "./theme.js";

// ─── STYLES ───────────────────────────────────────────────────────────────────
// All styles computed from current theme tokens (TK)
// Call makeCss() on every render to get theme-aware styles


export function makeCss() {
  const { C, C2, C3, BRD, BRD2, TX, TX2, TX3, TX4, TX5, BLUE, AMBER, RED } = TK;
  return {
    app:       { minHeight:"100vh", background:C, color:TX2, fontFamily:"'Outfit',system-ui,sans-serif", fontSize:"0.875rem" },
    hdr:       { display:"flex", alignItems:"center", gap:16, padding:"0 20px", height:54, background:C2, borderBottom:`1px solid ${BRD}`, position:"sticky", top:0, zIndex:100, boxShadow:TK===TK?"none":"0 1px 3px rgba(0,0,0,.08)" },
    navBtn:    { display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"transparent", border:"none", borderRadius:5, color:TX4, cursor:"pointer", fontSize:"0.76rem", transition:"all .15s" },
    navOn:     { background:C3, color:TX, border:`1px solid ${BRD2}` },
    statPill:  { display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:C2, border:`1px solid ${BRD}`, borderRadius:4 },
    main:      { padding:"14px 20px 80px" },
    card:      { background:C2, border:`1px solid ${BRD}`, borderRadius:7, padding:"16px 18px" },
    tbl:       { width:"100%", borderCollapse:"collapse" },
    th:        { padding:"7px 10px", textAlign:"left", borderBottom:`1px solid ${BRD}`, color:TX5, fontSize:"0.62rem", letterSpacing:"0.09em", textTransform:"uppercase", whiteSpace:"nowrap", background:C3 },
    td:        { padding:"8px 10px", borderBottom:`1px solid ${BRD}`, color:TX3, verticalAlign:"middle", fontSize:"0.78rem", cursor:"pointer" },
    inp:       { padding:"6px 10px", background:C, border:`1px solid ${BRD2}`, borderRadius:4, color:TX, fontSize:"0.8rem", width:"100%", colorScheme:C==="#f2f5f9"?"light":"dark" },
    sel:       { padding:"5px 8px", background:C, border:`1px solid ${BRD}`, borderRadius:4, color:TX2, fontSize:"0.76rem", colorScheme:C==="#f2f5f9"?"light":"dark" },
    lbl:       { color:TX4, fontSize:"0.66rem", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4, display:"block" },
    btnP:      { display:"inline-flex", alignItems:"center", gap:5, padding:"8px 15px", background:BLUE, border:`1px solid ${BLUE}`, borderRadius:5, color:"#fff", fontWeight:600, cursor:"pointer", fontSize:"0.77rem" },
    btnS:      { display:"inline-flex", alignItems:"center", gap:4, padding:"7px 13px", background:"transparent", border:`1px solid ${BRD2}`, borderRadius:5, color:TX3, cursor:"pointer", fontSize:"0.77rem" },
    btnDanger: { display:"inline-flex", alignItems:"center", gap:4, padding:"5px 9px", background:"transparent", border:`1px solid ${RED}44`, borderRadius:4, color:RED, cursor:"pointer", fontSize:"0.77rem" },
    txtarea:   { width:"100%", padding:"8px 10px", background:C, border:`1px solid ${BRD2}`, borderRadius:4, color:TX, fontSize:"0.79rem", lineHeight:1.6, resize:"vertical" },
    lotPill:   { display:"inline-block", padding:"2px 8px", background:`${BLUE}18`, border:`1px solid ${BLUE}40`, borderRadius:3, color:BLUE, fontSize:"0.69rem", whiteSpace:"nowrap" },
    badge:     { padding:"2px 8px", background:C, border:`1px solid ${BRD2}`, borderRadius:10, color:TX4, fontSize:"0.69rem", fontFamily:"'IBM Plex Mono',monospace", whiteSpace:"nowrap" },
    iBtn:      { background:"none", border:"none", padding:2, cursor:"pointer", display:"inline-flex", alignItems:"center", color:TX4, lineHeight:1 },
    toast:     { position:"fixed", top:12, right:14, zIndex:9999, padding:"8px 15px", borderRadius:5, color:"#fff", fontWeight:500, fontSize:"0.78rem", display:"flex", alignItems:"center", gap:7, boxShadow:"0 4px 20px rgba(0,0,0,.4)" },
    overlay:   { position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" },
    modal:     { background:C2, border:`1px solid ${BRD2}`, borderRadius:10, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,.3)" },
    panel:     { position:"fixed", top:0, right:0, width:440, maxWidth:"96vw", height:"100vh", background:C2, borderLeft:`1px solid ${BRD}`, overflowY:"auto", padding:"18px 20px" },
    mHdr:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", borderBottom:`1px solid ${BRD}`, flexShrink:0 },
    mClose:    { background:"transparent", border:`1px solid ${BRD2}`, borderRadius:4, color:TX3, cursor:"pointer", fontSize:"0.78rem", padding:"3px 8px" },
    fab:       { position:"fixed", bottom:64, right:24, zIndex:99, display:"flex", alignItems:"center", gap:8, background:BLUE, border:"none", borderRadius:28, color:"#fff", cursor:"pointer", padding:"12px 20px", boxShadow:`0 4px 20px ${BLUE}60`, fontSize:"0.82rem", fontWeight:700 },
    accHdr:    { display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:C3, cursor:"pointer", userSelect:"none" },
    backBtn:   { display:"inline-flex", alignItems:"center", gap:4, padding:"5px 10px", background:"transparent", border:`1px solid ${BRD2}`, borderRadius:4, color:TX3, cursor:"pointer", fontSize:"0.75rem" },
    tabBar:    { display:"flex", borderBottom:`1px solid ${BRD}`, marginBottom:4 },
    tabBtn:    { padding:"9px 16px", background:"transparent", border:"none", color:TX4, cursor:"pointer", fontSize:"0.78rem", borderBottom:"2px solid transparent" },
    tabOn:     { color:BLUE, borderBottomColor:BLUE },
    dropzone:  { border:`2px dashed ${BRD2}`, borderRadius:8, padding:"38px 24px", cursor:"pointer", textAlign:"center", background:C, transition:"all .2s" },
    stepPill:  { padding:"7px 14px", borderBottom:"2px solid transparent", color:TX5, fontSize:"0.73rem", cursor:"pointer" },
    stepOn:    { color:BLUE, borderBottomColor:BLUE },
    stepDone:  { color:"#16a34a", borderBottomColor:"#16a34a" },
    filterCard:{ background:C2, border:`1px solid ${BRD}`, borderRadius:7, padding:"11px 14px" },
    clearBtn:  { padding:"4px 9px", background:"transparent", border:`1px solid ${BRD2}`, borderRadius:3, color:TX4, cursor:"pointer", fontSize:"0.7rem" },
    projCard:  { background:C2, border:`1px solid ${BRD}`, borderRadius:8, padding:"16px 18px", cursor:"pointer", transition:"all .15s" },
    entBadge:  { display:"inline-block", padding:"1px 6px", background:C3, border:`1px solid ${BRD}`, borderRadius:2, color:TX4, fontSize:"0.67rem", whiteSpace:"nowrap" },
    synthCard: { background:"transparent", border:`1px solid ${BRD}`, borderRadius:6, padding:"12px 14px" },
    devisCard:  { background:C2, border:`1px solid ${BRD}`, borderRadius:7 },
    miniSave:   { padding:"4px 10px", background:BLUE, border:"none", borderRadius:4, color:"#fff", cursor:"pointer", fontSize:"0.75rem" },
    miniBtn:    { padding:"4px 10px", background:"transparent", border:`1px solid ${BRD2}`, borderRadius:4, color:TX3, cursor:"pointer", fontSize:"0.75rem" },
    textViewer:{ flex:1, overflowY:"auto", padding:16, margin:0, background:C, color:TX4, fontSize:"0.74rem", lineHeight:1.75, whiteSpace:"pre-wrap", wordBreak:"break-word", fontFamily:"monospace" },
  };
}
