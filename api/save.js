import { isConfigured, writeState } from "../lib/kv.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Método no permitido" });
    return;
  }

  // Sin almacenamiento en la nube configurado: avisamos al frontend para que
  // guarde solo en localStorage, sin tratarlo como un error.
  if (!isConfigured()) {
    res.status(200).json({ ok: true, configured: false, saved: false });
    return;
  }

  try {
    // El body puede llegar ya parseado (Vercel) o como string crudo.
    let state = req.body;
    if (typeof state === "string") {
      state = JSON.parse(state);
    }
    if (!state || typeof state !== "object") {
      throw new Error("Cuerpo de la petición inválido");
    }

    await writeState(state);
    res.status(200).json({
      ok: true,
      configured: true,
      saved: true,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ ok: false, configured: true, error: String(error.message || error) });
  }
}
