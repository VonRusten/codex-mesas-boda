import { isConfigured, readState, writeState } from "../lib/kv.js";
import { isAuthorized, unauthorized } from "../lib/auth.js";
import seedState from "../lib/datos-iniciales.js";

// Devuelve el estado a usar. Si la base de datos está vacía (primera vez, o una
// siembra anterior que no llegó a persistir), la siembra con los datos reales.
// Si ya hay datos válidos, los respeta y NUNCA los sobrescribe.
async function ensureSeeded() {
  const existing = await readState();
  if (existing) return existing;
  await writeState(seedState);
  return seedState;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Método no permitido" });
    return;
  }

  if (!isAuthorized(req)) {
    unauthorized(res);
    return;
  }

  // Sin almacenamiento en la nube configurado: el frontend usará localStorage,
  // y como respaldo le pasamos los datos iniciales para que no arranque vacío.
  if (!isConfigured()) {
    res.status(200).json({ ok: true, configured: false, exists: true, state: seedState });
    return;
  }

  try {
    const state = await ensureSeeded();
    res.status(200).json({
      ok: true,
      configured: true,
      exists: state !== null,
      state,
    });
  } catch (error) {
    res.status(500).json({ ok: false, configured: true, error: String(error.message || error) });
  }
}
