import { isConfigured, writeState } from "../lib/kv.js";
import { isAuthorized, unauthorized } from "../lib/auth.js";

// Lee y parsea el cuerpo de la petición de forma robusta: en algunas
// configuraciones de Vercel (funciones ESM) req.body no viene parseado, así que
// caemos a leer el stream manualmente.
async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Método no permitido" });
    return;
  }

  if (!isAuthorized(req)) {
    unauthorized(res);
    return;
  }

  // Sin almacenamiento en la nube configurado: avisamos al frontend para que
  // guarde solo en localStorage, sin tratarlo como un error.
  if (!isConfigured()) {
    res.status(200).json({ ok: true, configured: false, saved: false });
    return;
  }

  try {
    const state = await readJsonBody(req);
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
