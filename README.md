# FC Tracker

**Tu carrera, tu legado.** Una app local en español para registrar tu Modo Carrera Jugador de EA FC.

- Inicio, calendario, estadísticas e historial de temporadas.
- Importación asistida de capturas, OCR en el dispositivo y aprendizaje sencillo de escudos.
- Datos locales y respaldos JSON; sin cuentas, bases de datos ni APIs.
- Web estática, instalable, preparada para GitHub Pages.

**[Lee la guía de instalación y uso](./LEEME-PRIMERO.md).**

Para publicar: sube el contenido de esta carpeta a la raíz de un repositorio y activa **Settings → Pages → Deploy from a branch → main → / (root)**. No requiere compilación ni configuración del nombre del repositorio.

Para probar en tu computador con Node.js 20 o superior:

```sh
npm start
```

Abre `http://127.0.0.1:5173`. No hace falta instalar dependencias.

Pruebas: `npm run check`. Consulta [VERIFICACION.md](./VERIFICACION.md) para conocer el alcance comprobado y las limitaciones de verificación.
