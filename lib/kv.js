// Almacenamiento compartido en la nube usando la REST API de Upstash Redis,
// que es la que provee "Vercel KV" / "Upstash for Redis" en el Marketplace de Vercel.
//
// No requiere dependencias npm: hablamos directamente con la REST API usando el
// formato de comando universal (POST a la raíz con el comando como array JSON),
// que es el más fiable y soporta valores grandes.
//
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

// Ejecuta un comando de Redis vía la REST API de Upstash.
// Ej: redisCommand(["SET", "clave", "valor"]) -> "OK"
async function redisCommand(args) {
  if (!isConfigured()) {
    throw new Error("Almacenamiento en la nube no configurado");
  }
  const response = await fetch(REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(`KV ${args[0]} falló: ${data.error || response.status}`);
  }
  return data.result;
}

// Lee un valor crudo (string) de cualquier clave. null si no existe.
export async function readRawKey(key) {
  if (!isConfigured()) return null;
  const result = await redisCommand(["GET", key]);
  return result == null ? null : String(result);
}

// Guarda un valor crudo (string) en cualquier clave.
export async function writeRawKey(key, value) {
  await redisCommand(["SET", key, String(value)]);
  return true;
}

// Lee el JSON guardado. Devuelve null si no hay nada o si no está configurado.
export async function readState() {
  if (!isConfigured()) return null;
  const result = await redisCommand(["GET", STATE_KEY]);
  if (result == null) return null;
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

// Guarda el JSON (recibe un objeto, lo serializa).
export async function writeState(state) {
  await redisCommand(["SET", STATE_KEY, JSON.stringify(state)]);
  return true;
}
