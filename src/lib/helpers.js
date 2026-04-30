// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const fmtEur = n =>
  n != null ? Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €" : "—";

export const fmtN = n =>
  n != null ? Number(n).toLocaleString("fr-FR") : "—";

export const fmtDate = d =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export function genId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function applyDateFilter(entries, period) {
  if (!period || period === "all") return entries;
  const now = new Date();
  const cutoff = new Date();
  if (period === "30d") cutoff.setDate(now.getDate() - 30);
  else if (period === "90d") cutoff.setDate(now.getDate() - 90);
  else if (period === "1y") cutoff.setFullYear(now.getFullYear() - 1);
  return entries.filter(e => e.devisDate && new Date(e.devisDate) >= cutoff);
}

// ─── SMART SEARCH ────────────────────────────────────────────────────────────
// Règles :
// - Insensible aux accents : "fenetre" trouve "fenêtre"
// - Insensible à la casse
// - Plusieurs mots = AND strict (plus de mots = moins de résultats)
// - Troncature : "fenêtr" trouve "fenêtre"
// - PAS de synonymes larges qui donnent trop de résultats

function normalizeStr(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // supprime les accents
    .replace(/[^a-z0-9\s]/g, " ")       // remplace ponctuation par espace
    .replace(/\s+/g, " ")
    .trim();
}

export function smartSearch(query, entries) {
  if (!query?.trim()) return entries;

  // Découper la requête en mots, chacun normalisé
  const words = normalizeStr(query)
    .split(" ")
    .filter(w => w.length >= 2); // ignorer mots trop courts

  if (!words.length) return entries;

  return entries.filter(entry => {
    // Construire le texte de recherche de l'entrée (normalisé)
    const haystack = normalizeStr([
      entry.posteNormalise,
      entry.libelleOriginal,
      entry.description,
      entry.lot,
      entry.entreprise,
      entry.devisRef,
      entry.marque,
      entry.zone,
    ].filter(Boolean).join(" "));

    // Chaque mot de la requête doit être présent dans le texte
    // (troncature : le mot de la requête doit être contenu dans un mot du texte)
    return words.every(word => {
      // Correspondance exacte partielle (inclus dans le texte)
      if (haystack.includes(word)) return true;
      // Troncature : un mot du texte commence par le mot cherché
      const haystackWords = haystack.split(" ");
      return haystackWords.some(hw => hw.startsWith(word) || word.startsWith(hw));
    });
  });
}
