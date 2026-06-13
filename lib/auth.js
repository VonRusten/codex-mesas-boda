// Contraseña de acceso compartida. Por defecto la que pidió el cliente, pero se
// puede cambiar sin tocar el código definiendo la variable de entorno
// PLANNER_PASSWORD en Vercel.
const PASSWORD = process.env.PLANNER_PASSWORD || "MartayCarlos";

// Comprueba la contraseña enviada por el frontend. Se acepta en la cabecera
// "x-planner-password" (peticiones GET y POST) o, como respaldo, en ?pw= .
export function isAuthorized(req) {
  const headerValue = req.headers["x-planner-password"];
  if (typeof headerValue === "string" && headerValue === PASSWORD) {
    return true;
  }
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.searchParams.get("pw") === PASSWORD) {
      return true;
    }
  } catch {
    // url no parseable: ignoramos
  }
  return false;
}

export function unauthorized(res) {
  res.status(401).json({ ok: false, error: "Contraseña incorrecta" });
}
