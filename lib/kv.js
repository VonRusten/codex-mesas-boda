// Almacenamiento compartido en la nube usando la REST API de Upstash Redis,
// que es la que provee "Vercel KV" / "Upstash for Redis" en el Marketplace de Vercel.
//
// No requiere dependencias npm: hablamos directamente con la REST API.
// Soporta los nombres de variables que inyecta tanto la plantilla KV de Vercel
// (KV_REST_API_URL / KV_REST_API_TOKEN) como la integración de Upstash
// (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).

const REST_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const REST_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

// Clave bajo la que se guarda el plano. Se puede cambiar con una variable de
// entorno por si quieres varios planos en el mismo almacén.
export const STATE_KEY = process.env.PLANNER_KEY || "planificador-mesas-boda";

export function isConfigured() {
  return Boolean(REST_URL && REST_TOKEN);
}

// Lee el JSON guardado. Devuelve null si no hay nada o si no está configurado.
export async function readState() {
  if (!isConfigured()) return null;
  const response = await fetch(`${REST_URL}/get/${encodeURIComponent(STATE_KEY)}`, {
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`KV GET falló: ${response.status}`);
  }
  const data = await response.json();
  if (data.result == null) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}

// Guarda el JSON (recibe un objeto, lo serializa).
export async function writeState(state) {
  if (!isConfigured()) {
    throw new Error("Almacenamiento en la nube no configurado");
  }
  const body = JSON.stringify(state);
  const response = await fetch(`${REST_URL}/set/${encodeURIComponent(STATE_KEY)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body,
  });
  if (!response.ok) {
    throw new Error(`KV SET falló: ${response.status}`);
  }
  return true;
}
