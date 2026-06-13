import { isConfigured, readState } from "../lib/kv.js";
import { isAuthorized, unauthorized } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Método no permitido" });
    return;
  }

  if (!isAuthorized(req)) {
    unauthorized(res);
    return;
  }

  // Sin almacenamiento en la nube configurado: el frontend usará localStorage.
  if (!isConfigured()) {
    res.status(200).json({ ok: true, configured: false, exists: false, state: null });
    return;
  }

  try {
    const state = await readState();
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
