# Planificador de mesas de boda

Esta carpeta contiene la app local del planificador.

## Como iniciarla

En Windows, ejecuta:

`iniciar_planificador.bat`

Se abrira la web en:

`http://127.0.0.1:8765/planificador-mesas-boda.html`

Si en otro ordenador falla al iniciar, ejecuta primero:

`instalar_dependencias.bat`

## Base de datos

La app guarda y carga los datos desde:

`base-datos-planificador.xlsx`

No abras ese Excel mientras estes moviendo invitados en la web, porque Excel puede bloquear el archivo y evitar que se guarden los cambios.

## Para usarla desde Google Drive

La carpeta debe estar sincronizada en el ordenador con Google Drive para escritorio. El enlace web de Drive sirve para compartir archivos, pero no puede ejecutar el servidor local.

Cada persona que quiera usar la app debe:

1. Tener esta carpeta descargada o sincronizada.
2. Ejecutar `iniciar_planificador.bat`.
3. Trabajar desde la URL local que se abre.

Si dos personas editan a la vez desde dos ordenadores distintos, Google Drive puede crear conflictos de sincronizacion del Excel. Lo recomendable es que solo una persona edite a la vez.
