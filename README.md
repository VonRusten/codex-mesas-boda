# Planificador de mesas de boda

App web para organizar las mesas de tu boda con un **plano interactivo**: arrastra
invitados a las sillas, coloca y rota las mesas en la sala, marca alergias, importa
la lista de invitados desde Excel/CSV y exporta la organización a Excel.

Esta versión está preparada para desplegarse en **Vercel**. Los datos se guardan en
una base de datos compartida en la nube (Vercel KV / Upstash Redis), de modo que
varias personas pueden ver y editar el mismo plano desde cualquier dispositivo. Si
no configuras la nube, la app funciona igual guardando los datos en el navegador.

## Estructura del proyecto

```
.
├── public/
│   └── index.html        ← La aplicación (HTML + JS, sin build)
├── api/
│   ├── load.js           ← Función serverless: carga el plano desde la nube
│   └── save.js           ← Función serverless: guarda el plano en la nube
├── lib/
│   └── kv.js             ← Acceso a Vercel KV / Upstash Redis (REST, sin dependencias)
├── vercel.json           ← Configuración (evita cachear la API)
├── package.json
├── .env.example          ← Plantilla de variables de entorno
└── legacy/               ← Versión antigua local (servidor Python + .bat). Solo referencia.
```

## Desplegar en Vercel (paso a paso)

### 1. Sube el código a GitHub
Este repositorio ya contiene todo. Solo necesitas que esté en GitHub (ya lo está).

### 2. Importa el proyecto en Vercel
1. Entra en [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New… → Project** e importa este repositorio de GitHub.
3. Vercel detecta la configuración automáticamente (no hay framework ni build).
   Pulsa **Deploy**.

En este punto la app **ya funciona**: cada navegador guarda su propio plano. Para
que el plano se **comparta entre personas**, conecta la base de datos (paso 3).

### 3. Conecta el almacenamiento compartido (Vercel KV / Upstash)
1. En tu proyecto de Vercel ve a la pestaña **Storage**.
2. **Create Database / Connect Store** → elige **Upstash for Redis** (KV).
   Tiene un plan gratuito de sobra para esta app.
3. Crea el almacén y **conéctalo a este proyecto**. Vercel añadirá solo las
   variables de entorno necesarias (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).
4. Vuelve a desplegar (**Deployments → Redeploy**) para que tomen efecto.

¡Listo! A partir de ahora todos los cambios se guardan en la nube y todo el mundo
que abra la URL verá el mismo plano.

### Contraseña de acceso

La app está protegida con una contraseña: al abrir la URL se pide antes de mostrar
el plano, y las funciones del servidor rechazan cargar o guardar datos sin ella.

- Contraseña por defecto: **`MartayCarlos`**.
- Para cambiarla sin tocar el código, define la variable de entorno
  `PLANNER_PASSWORD` en Vercel (*Project Settings → Environment Variables*) y vuelve
  a desplegar.

> La contraseña se valida en el backend, así que protege también los datos, no solo
> la pantalla. Comparte la URL y la contraseña solo con quien deba editar el plano.

## Uso de la app

- **Añadir invitados**: botón *Añadir invitado*, o importa una lista con el botón
  de cargar **Excel/CSV** (busca una columna con el nombre y, opcionalmente, alergia).
- **Añadir/editar mesas**: crea mesas, cambia forma (redonda, rectangular, ovalada)
  y capacidad, y colócalas/rótalas en el plano de la sala.
- **Sentar invitados**: arrástralos desde la columna "Sin asignar" a las sillas.
- **Exportar**: el botón *Exportar* descarga un Excel (`.xlsx`) con las hojas
  *Asignaciones*, *Invitados* y *Mesas*.
- **Guardado**: automático. El indicador de la barra superior muestra el estado
  ("Guardando…", "Guardado HH:MM", o "Guardado en este equipo" si no hay nube).

## Desarrollo en local (opcional)

```bash
npm install -g vercel   # una sola vez
vercel dev              # levanta la app y las funciones en http://localhost:3000
```

Para probar la nube en local, copia `.env.example` a `.env.local` y rellena las
variables del almacén Upstash.

## Notas

- **Sin la nube**, los datos viven en el `localStorage` del navegador: no se
  comparten entre equipos, pero la app es totalmente funcional y no se pierde nada.
- La carpeta `legacy/` contiene la versión anterior que corría con un servidor
  Python local y guardaba en un Excel. Se conserva solo como referencia; no se usa
  en el despliegue de Vercel.
