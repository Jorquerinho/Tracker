# FC Tracker · Tu carrera, tu legado

App en español para el Modo Carrera Jugador de EA FC, lista para GitHub Pages.

**Versión 1.2:** calendario manual con **769 clubes y sus escudos PNG incluidos**, y un desplegable de rivales que busca por nombre o alias (PSG, Man City, Barça…). Se retiró el sistema de importación por fotos.

- Inicio, calendario, estadísticas, temporadas, premios y títulos.
- Escudos automáticos tanto para tus rivales como para tu club.
- Sugerencias con escudo al escribir un equipo; admite nombres personalizados.
- Guardado en este dispositivo, respaldos JSON y exportación CSV.
- Sin cuenta, base de datos, API ni compilación.

**[Guía para publicar y usar](./LEEME-PRIMERO.md)** · [Cómo actualizar y ampliar los equipos](./ACTUALIZACION-EQUIPOS.md).

Para probarla con Node.js 20 o superior: `npm start`. Abre `http://127.0.0.1:5173`. No necesitas instalar dependencias.

Para publicar: sube el contenido de esta carpeta a la raíz del repositorio y activa **Settings → Pages → Deploy from a branch → main → / (root)**.

Pruebas: `npm run check`. Alcance de verificación: [VERIFICACION.md](./VERIFICACION.md). Créditos de imágenes: [TERCEROS.md](./TERCEROS.md).
