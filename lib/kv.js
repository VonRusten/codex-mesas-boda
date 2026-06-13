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

// Detección robusta de credenciales REST de Upstash/Vercel KV. Al conectar un
// almacén desde el Marketplace de Vercel, las variables pueden venir con un
// prefijo (p. ej. STORAGE_KV_REST_API_URL), así que además de los nombres
// estándar escaneamos cualquier variable que termine en REST_API_URL/TOKEN o
// que sea la pareja de Upstash. Devuelve { url, token } o null.
function detectCreds() {
  const env = process.env;
  // 1) Nombres estándar (camino normal).
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token };

  // 2) Variantes con prefijo: cualquier *REST_API_URL + *REST_API_TOKEN.
  let foundUrl = "";
  let foundToken = "";
  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    if (!foundUrl && /REST_API_URL$/.test(key) && /^https?:\/\//.test(value)) foundUrl = value;
    if (!foundToken && /REST_API_TOKEN$/.test(key)) foundToken = value;
  }
  // 3) Variantes con prefijo del estilo Upstash.
  if (!foundUrl) {
    for (const [key, value] of Object.entries(env)) {
      if (value && /UPSTASH_REDIS_REST_URL$/.test(key) && /^https?:\/\//.test(value)) { foundUrl = value; break; }
    }
  }
  if (!foundToken) {
    for (const [key, value] of Object.entries(env)) {
      if (value && /UPSTASH_REDIS_REST_TOKEN$/.test(key)) { foundToken = value; break; }
    }
  }
  if (foundUrl && foundToken) return { url: foundUrl, token: foundToken };
  return null;
}

const CREDS = detectCreds();
const REST_URL = CREDS ? CREDS.url : "";
const REST_TOKEN = CREDS ? CREDS.token : "";

// Nombres (no valores) de las variables de entorno relacionadas que existen.
// Útil para diagnóstico sin exponer secretos.
export function detectedEnvNames() {
  return Object.keys(process.env).filter((k) =>
    /(REST_API_URL|REST_API_TOKEN|UPSTASH_REDIS|KV_URL|REDIS_URL)$/.test(k)
  );
}

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
