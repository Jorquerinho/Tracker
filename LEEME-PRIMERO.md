# FC Tracker · Guía de uso e instalación

Versión 1.2. Un seguimiento local de tu Modo Carrera Jugador, con calendario, estadísticas e historial. Los escudos de **769 clubes** ya están incluidos en la carpeta `escudos/`.

## Publicar en GitHub Pages

1. Descomprime `FC-Tracker-v1.2-Equipos.zip`.
2. Crea un repositorio público de GitHub, o abre el que ya usas para FC Tracker.
3. Sube **el contenido de la carpeta fc-tracker**, con `index.html`, `src/`, `assets/`, `escudos/`, etc. directamente en la raíz del repositorio. No subas el ZIP como único archivo.
4. En **Settings → Pages**, elige **Deploy from a branch → main → / (root)** y guarda.
5. Espera la publicación y abre la dirección que te indique GitHub, normalmente `https://TU-USUARIO.github.io/TU-REPOSITORIO/`.

No debes cambiar el nombre del repositorio en el código, instalar dependencias, crear secretos ni compilar. Todas las imágenes se sirven desde tu misma web, sin consultar una API de fútbol.

Hay cientos de archivos en la carpeta de escudos. Si la carga web de GitHub rechaza un lote grande, súbelos en lotes o usa GitHub Desktop para copiar toda la carpeta al repositorio, confirmar los cambios y hacer Push.

Referencia: [documentación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Actualizar una instalación anterior

1. Descarga un respaldo desde Mi carrera.
2. Reemplaza los archivos del mismo repositorio por esta versión e incluye la nueva carpeta `escudos/`.
3. Puedes eliminar la antigua carpeta `vendor/` y los archivos `src/ocr.js` y `src/grid.js`: ya no se utilizan.
4. Cuando Pages termine de publicar, abre con conexión, cierra todas las pestañas o ventanas instaladas de FC Tracker y vuelve a abrirla. Si aparece el aviso de nueva versión, repite el cierre y apertura.

**No borres los datos del navegador.** Se conserva la misma clave de guardado y se aceptan tus respaldos anteriores.

## Empezar tu carrera

1. En Inicio pulsa Crear mi carrera.
2. Introduce tu jugador y comienza a escribir tu club. El desplegable ofrece coincidencias con su escudo.
3. Elige posición, media, dorsal y temporada; marca las competiciones que juegas. Sin selección se ofrece todo el catálogo de competiciones.
4. Abre Calendario y pulsa Añadir partido.
5. Escribe el rival: por ejemplo `PSG`, `Man City`, `Barcelona` o `Colo Colo`. Elige la sugerencia para rellenar el nombre y ver el escudo.
6. Completa competición, local/visita y la fecha del juego, si la quieres guardar. Confirma el partido.
7. Cuando lo juegues, pulsa Registrar e introduce marcador, goles, asistencias, nota, minutos y premios del encuentro.

El selector también funciona con teclado: flechas arriba/abajo, Enter para elegir, Escape para cerrar la lista y Tab para avanzar. El botón a la derecha del campo abre las sugerencias aunque no hayas escrito nada.

Puedes guardar un equipo que no esté en la lista escribiendo su nombre. Si falta su escudo, usa **Mi carrera → Escudos de clubes → Añadir escudo** para cargar una imagen personal. Tus rivales anteriores también aparecen en las sugerencias.

Los nombres habituales se reconocen sin tildes, mayúsculas o signos. Un partido antiguo que diga `PSG` recibe su escudo aunque su nombre guardado no se modifique. Los nuevos partidos normalizan los alias conocidos a su nombre de catálogo.

## Qué hace cada pantalla

- **Inicio:** próximo partido, cuatro encuentros pendientes, estadísticas oficiales, titularidades, suplencias, minutos, nota, jugador del partido y jugador del mes, con gráfico de forma.
- **Calendario:** pendientes, jugados y todos; búsqueda por rival; filtro de competición; creación, edición, eliminación y colocación de un partido antes de otro.
- **Estadísticas:** temporada o toda la carrera; filtro inicial de oficiales; goles, asistencias, medias y contribuciones cada 90 minutos; palmarés y exportación CSV de los partidos filtrados.
- **Mi carrera:** ficha, temporadas, competiciones, premios, títulos, escudos personales y respaldos.

Explorar demo usa datos temporales en memoria. Entrar, editar y salir de la demo no reemplaza tu carrera real. Un respaldo exportado desde la demo contiene sus datos de ejemplo.

## Reglas del calendario y estadísticas

- Las jornadas se calculan por competición según el orden del calendario. Insertar, mover o eliminar ajusta los siguientes partidos; una jornada manual hace que los posteriores continúen desde ella.
- Las fechas son las del juego y no reordenan automáticamente la agenda. Admite `2026-10-24` o `24 oct`.
- Las estadísticas solo cuentan partidos registrados. Amistosos y pretemporada quedan fuera del filtro inicial de oficiales.
- Solo hay una temporada activa. Iniciar otra finaliza la anterior y conserva sus partidos, estadísticas y títulos. Puedes consultar o editar sus encuentros desde el selector de temporada.
- El marcador es opcional; si se introduce, completa ambos equipos. La nota admite de 0 a 10 y los minutos de 0 a 150. Puedes corregir los minutos propuestos al cambiar titular/suplente.
- Jugador del mes y títulos se introducen manualmente por temporada y no dependen del filtro de competición.
- Las competiciones que ya tienen partidos pueden renombrarse o cambiarse a no oficiales; no se eliminan mientras tengan partidos.

## Escudos incluidos y personales

Los escudos incluidos son archivos PNG locales, por ejemplo:

```text
escudos/paris-saint-germain.png
escudos/manchester-city.png
escudos/real-madrid.png
escudos/fc-barcelona.png
escudos/colo-colo.png
```

El catálogo cubre clubes de 25 países europeos y una selección de Argentina, Brasil, Chile, México, Estados Unidos y Arabia Saudita. Incluye participantes históricos, por lo que no es una lista de ligas de la temporada actual ni un catálogo de todos los clubes existentes.

El escudo se utiliza en Inicio, Calendario, las sugerencias y las temporadas. Los escudos incluidos tienen prioridad sobre recortes de fotos de versiones anteriores. Puedes reemplazar uno a propósito volviendo a guardar una imagen personal en esta versión.

Las imágenes personales se guardan a 128 × 128 px, conservando su proporción; admiten PNG, JPG o WebP de hasta 8 MB. La biblioteca personal admite hasta 200 clubes / 4 MB. **El catálogo incluido no ocupa localStorage** y no cuenta para ese límite.

## Guardado y respaldos

Todo tu progreso se guarda en `localStorage`, clave `fc-tracker:data`. Los registros pertenecen al navegador o instalación donde los creaste; no se sincronizan entre dispositivos.

- Descarga un respaldo JSON después de tus sesiones. En dispositivos compatibles puedes guardarlo mediante la hoja de compartir.
- Restaurar archivo revisa el contenido y muestra un resumen antes de reemplazar los datos.
- Respaldo en texto permite copiarlo completo a una nota o pegar uno para revisar y restaurar.
- Se conservan los respaldos del esquema 1 de las versiones anteriores, incluidas sus imágenes personales.
- Los escudos incluidos no se repiten en cada respaldo: ya vienen con la aplicación. Las imágenes personales sí viajan en el JSON.
- Un aviso de error de guardado requiere mantener abierta la app y descargar un respaldo. Si otra pestaña cambia los datos, la app bloquea la sobrescritura hasta cargar esos cambios.
- Si los datos guardados están dañados, la app ofrece descargar el original antes de recuperarlos.

Borrar datos del sitio, cambiar de navegador o eliminar una instalación puede hacerte perder registros. Un respaldo permite trasladarlos al otro dispositivo. Los archivos JSON no están cifrados y contienen los datos de juego que escribiste.

## Instalar y usar sin conexión

- En iPhone: Safari → Compartir → Agregar a pantalla de inicio.
- En Android o escritorio: busca Instalar app / Agregar a pantalla de inicio en el navegador.
- La primera apertura necesita conexión. La app prepara sus pantallas y después descarga los escudos en segundo plano. Mantén la app abierta con conexión hasta que avise que los escudos están preparados para usar sin conexión.
- Si el navegador limpia la caché o alguna descarga falla, abre con conexión para recuperar las imágenes. El progreso sigue dependiendo de sus respaldos locales.
- Instalar no mueve los datos automáticamente entre almacenamientos separados; usa exportar/restaurar si tu navegador los separa.

La app no tiene analítica ni consulta APIs externas durante el uso. Los archivos se sirven desde el alojamiento que elijas, que puede registrar peticiones como cualquier sitio web.

## Probar en tu computador

Con Node.js 20 o superior, abre una terminal dentro de la carpeta y ejecuta:

```sh
npm start
```

Abre `http://127.0.0.1:5173`. Detén el servidor con Ctrl+C. No hace falta `npm install`. Abrir index.html con doble clic no ejecuta los módulos de la app.

Pruebas incluidas: `npm run check`. Para añadir clubes permanentes al proyecto, consulta [ACTUALIZACION-EQUIPOS.md](./ACTUALIZACION-EQUIPOS.md).

Aplicación independiente de EA y de los clubes. Créditos y procedencia de imágenes en [TERCEROS.md](./TERCEROS.md). Alcance comprobado en [VERIFICACION.md](./VERIFICACION.md).
