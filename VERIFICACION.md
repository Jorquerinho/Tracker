# Verificación de la entrega

Versión: 1.0.0 · 18 de octubre de 2026.

## Comprobado

**23 pruebas incluidas** ejecutadas con `npm run check`, todas aprobadas:

- Jornadas por competición; inserción y eliminación intermedia; jornada manual.
- Cierre de temporada al abrir otra y conservación del historial.
- Filtro de oficiales, partidos pendientes excluidos y estadísticas por minutos reales.
- Estadísticas vacías y límites numéricos.
- Protección de competiciones con partidos.
- Respaldo/restauración, compatibilidad con el formato del boceto y aprendizaje de escudos.
- Rechazo de JSON ajeno, esquemas futuros, IDs inseguros, duplicados y referencias inválidas.
- Aislamiento de los datos de demostración.
- Extracción de fecha, competición y localía desde texto; campos desconocidos vacíos.
- Parecido de escudos y rechazo de coincidencias ambiguas.
- Recursos HTML, importaciones, iconos, idiomas y motor OCR incluidos.
- Manifest y caché con una subruta arbitraria de repositorio.
- Recuperación de la página de entrada sin conexión, mediante simulación del service worker.

**23 comprobaciones adicionales de flujos en DOM simulado**, todas aprobadas:

- Carrera nueva, ficha, temporada, creación e inserción de partidos.
- Validación de marcador y registro de actuación.
- Vistas del calendario, búsqueda y filtros.
- Preparación e importación de dos encuentros desde texto y bloqueo de filas incompletas.
- Entrada, edición y salida de demo sin modificar los datos reales.
- Premios, títulos, copia del respaldo y revisión antes de restaurar.
- Restauración inválida sin pérdida de datos.
- Cambio de temporada y estadísticas de toda la carrera.
- Tratamiento de nombres como texto y protección ante cambios de otra pestaña.

**Prueba real del motor Tesseract.js 6.0.1 en Node**, con los modelos locales incluidos: reconoció dos partidos escritos en una imagen sintética, incluidos los nombres `Sevilla FC` y `Liverpool FC`, la competición `Champions League` y las palabras `Local` y `Visita` (5 comprobaciones aprobadas).

También se verificó la sintaxis de los módulos de la aplicación.

## Límites de esta verificación

El navegador integrado bloqueó el acceso a la vista previa local. **No se realizó inspección visual en navegador, ni una prueba completa de OCR a través de la interfaz.** Los flujos de interfaz se comprobaron con un DOM simulado, que no verifica distribución visual, gestos táctiles, instalación PWA ni funciones nativas de Safari.

No se recibió una captura real del calendario del usuario. El OCR se probó con una imagen de texto controlada. La precisión con una foto del juego depende del diseño, recorte y nitidez. El aprendizaje de escudos es una comparación sencilla de firmas visuales, con revisión humana; no identifica de manera universal escudos desconocidos.

La carpeta está preparada para publicación estática. **No se publicó en una cuenta de GitHub ni se verificó una dirección pública**, porque no se indicó un repositorio de destino.

## Primera comprobación al publicarla

1. Abre la dirección de Pages y pulsa Explorar demo. Navega por las cuatro pantallas y vuelve a tu carrera.
2. Crea tu jugador, agrega un partido, registra la actuación y recarga: debe conservarse.
3. Descarga un respaldo y comprueba que puedes revisarlo y restaurarlo.
4. Importa una captura nítida del juego, corrige los campos y confirma los partidos.
5. Para probar sin conexión, abre primero la app con conexión y completa una lectura OCR. Después vuelve a abrirla sin conexión en ese mismo navegador o instalación.
