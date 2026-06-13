import { isConfigured, readState, detectedEnvNames } from "../lib/kv.js";

// Diagnóstico público (sin contraseña y sin exponer secretos): indica si la base
// de datos en la nube está conectada y si tiene datos guardados. Sirve para
// comprobar de un vistazo si la sincronización entre dispositivos está activa.
// Visítalo en https://TU-APP.vercel.app/api/status
export default async function handler(req, res) {
  const cloud = isConfigured();
  let hasData = false;
  let error = null;
  if (cloud) {
    try {
      hasData = (await readState()) !== null;
    } catch (e) {
      error = String(e.message || e);
    }
  }
  res.status(200).json({
    ok: true,
    cloud, // true = sincroniza entre dispositivos; false = solo en cada navegador
    hasData,
    // Solo nombres de variables, nunca valores. Ayuda a diagnosticar si Vercel
    // inyectó las credenciales con algún prefijo.
    envVars: detectedEnvNames(),
    ...(error ? { error } : {}),
    hint: cloud
      ? "La base de datos en la nube está conectada. Los cambios se comparten entre dispositivos."
      : "No hay base de datos en la nube conectada. Conecta un almacén KV/Upstash en Vercel (pestaña Storage) y vuelve a desplegar.",
  });
}
