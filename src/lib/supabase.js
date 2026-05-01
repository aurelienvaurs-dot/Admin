// Client Supabase admin — service role key (bypass RLS)
// Les credentials sont lus depuis localStorage pour éviter de gérer un .env en local

function getCreds() {
  return {
    url: localStorage.getItem("admin_supa_url") || import.meta.env.VITE_SUPABASE_URL || "",
    key: localStorage.getItem("admin_supa_key") || import.meta.env.VITE_SUPABASE_SERVICE_KEY || "",
  };
}

function makeHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function req(path, options = {}) {
  const { url, key } = getCreds();
  if (!url || !key) throw new Error("Credentials manquants — configurez l'accès Supabase.");

  const endpoint = `${url}${path}`;
  const r = await fetch(endpoint, { ...options, headers: { ...makeHeaders(key), ...options.headers } });

  // Lire en texte d'abord pour éviter le crash JSON sur erreur HTML
  const text = await r.text();
  if (!r.ok) {
    // Tenter d'extraire un message d'erreur Supabase
    try {
      const d = JSON.parse(text);
      throw new Error(d.message || d.error_description || `HTTP ${r.status}`);
    } catch(e) {
      if (e.message !== `HTTP ${r.status}`) throw e;
      throw new Error(`HTTP ${r.status} — vérifiez l'URL et la clé Supabase`);
    }
  }

  if (!text || text === "null") return null;
  try { return JSON.parse(text); }
  catch { throw new Error("Réponse invalide (non-JSON)"); }
}

export const db = {
  getCreds,
  saveCreds(url, key) {
    localStorage.setItem("admin_supa_url", url.trim());
    localStorage.setItem("admin_supa_key", key.trim());
  },
  clearCreds() {
    localStorage.removeItem("admin_supa_url");
    localStorage.removeItem("admin_supa_key");
  },
  hasCreds() {
    const { url, key } = getCreds();
    return !!url && !!key;
  },

  async select(table, query = "") {
    return req(`/rest/v1/${table}?${query}`);
  },
  async patch(table, id, data) {
    return req(`/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(data),
    });
  },
  async delete_(table, id) {
    return req(`/rest/v1/${table}?id=eq.${id}`, { method: "DELETE" });
  },
  // Supprimer par filtre arbitraire (ex: org_id=eq.xxx)
  async deleteWhere(table, filter) {
    return req(`/rest/v1/${table}?${filter}`, { method: "DELETE" });
  },
  // Mettre à jour par filtre arbitraire
  async patchWhere(table, filter, data) {
    return req(`/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(data),
    });
  },
  async rpc(fn, params = {}) {
    return req(`/rest/v1/rpc/${fn}`, { method: "POST", body: JSON.stringify(params) });
  },
};
