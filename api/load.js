import {
  isConfigured,
  readState,
  writeState,
  readRawKey,
  writeRawKey,
  STATE_KEY,
} from "../lib/kv.js";
import { isAuthorized, unauthorized } from "../lib/auth.js";
import seedState from "../lib/datos-iniciales.js";

const SEED_FLAG_KEY = `${STATE_KEY}:seeded`;

// Siembra la base de datos en la nube con los datos reales una sola vez.
// Devuelve el estado a usar (el sembrado o el ya existente).
async function ensureSeeded() {
  const alreadySeeded = await readRawKey(SEED_FLAG_KEY);
  if (alreadySeeded) {
    return await readState();
  }
  // Primera vez: volcamos los datos reales y marcamos como sembrado.
  await writeState(seedState);
  await writeRawKey(SEED_FLAG_KEY, new Date().toISOString());
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
