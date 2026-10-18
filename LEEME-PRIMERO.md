# FC Tracker · Tu carrera, tu legado

Tu centro de control para el **Modo Carrera Jugador de EA FC**. Una web estática, en español, que puedes publicar en GitHub Pages. Sin cuentas, bases de datos, claves ni servicios de pago. Los datos se guardan en el navegador de cada dispositivo.

## Publicarla en GitHub Pages — la forma más simple

1. Descomprime `FC-Tracker-GitHub-Pages.zip`.
2. Crea un repositorio **público** en GitHub. Puedes llamarlo `fc-tracker` o elegir otro nombre.
3. En el repositorio, elige **Add file → Upload files**. Entra en la carpeta `fc-tracker` descomprimida y arrastra **su contenido completo** a GitHub. Deben quedar `index.html`, `manifest.webmanifest`, `sw.js` y las carpetas `src`, `assets`, `vendor`, etc. directamente en la raíz del repositorio.
4. Pulsa **Commit changes** para guardar en la rama `main`.
5. Abre **Settings → Pages**. En **Build and deployment**, selecciona **Deploy from a branch**. Elige **main** y **/ (root)**. Pulsa **Save**.
6. Espera a que GitHub termine de publicarla. La misma página mostrará la dirección, normalmente `https://TU-USUARIO.github.io/fc-tracker/`.

**No subas el ZIP como único archivo.** GitHub necesita los archivos descomprimidos. Tampoco debe quedar una carpeta adicional entre la raíz del repositorio e `index.html`.

No hay que editar rutas, ejecutar una compilación, crear secretos ni configurar GitHub Actions. Todas las rutas son relativas, por lo que también sirve para un repositorio llamado `TU-USUARIO.github.io` o un dominio propio.

Si ya usabas un workflow para otra versión: desactívalo y cambia la fuente de Pages a la rama indicada. Conserva un respaldo de tu carrera antes de reemplazar una instalación anterior.

Referencia: [configurar la fuente de publicación en GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Probarla en tu computador

Necesitas Node.js 20 o superior **solo para esta prueba local**. Quien use la web publicada no necesita instalar Node.

Abre una terminal dentro de la carpeta `fc-tracker` y ejecuta:

```sh
npm start
```

Abre `http://127.0.0.1:5173` en tu navegador. Para detener la vista previa, pulsa `Ctrl+C` en la terminal.

No necesitas `npm install`. El proyecto entregado ya incluye todos los archivos que usa. Abrir `index.html` con doble clic no ejecuta la app: los módulos y la instalación requieren una dirección web.

## Tu primera carrera

1. Pulsa **Crear mi carrera** en Inicio.
2. Completa nombre, club, posición, media, dorsal y temporada.
3. Marca las competiciones que juegas. Si no marcas ninguna se ofrece todo el catálogo.
4. En **Calendario**, añade rivales o usa **Importar captura**.
5. Al terminar un partido, pulsa **Registrar** y guarda tu actuación.
6. En **Mi carrera**, descarga un respaldo después de tus sesiones de juego.

**Explorar demo** carga una carrera de ejemplo en memoria. No reemplaza ni guarda cambios en tu carrera real. La franja superior permite volver a tus datos. Si exportas desde la demo, el archivo contiene la demo.

## Lo que incluye

- **Inicio:** próximo partido, cuatro encuentros pendientes, goles, asistencias, nota media, jugador del partido, titularidades, suplencias, minutos, jugador del mes y gráfico de forma.
- **Calendario:** pendientes, jugados y todos; búsqueda por rival; filtro por competición; creación, edición, eliminación e inserción de partidos antes de otro encuentro.
- **Estadísticas:** temporada seleccionada o carrera completa, filtro inicial de oficiales, cifras por competición, contribuciones cada 90 minutos y vitrina de títulos. Exportación de los partidos filtrados en CSV compatible con Excel.
- **Mi carrera:** ficha del jugador, historial de temporadas, cierre de temporada, catálogo editable, elección de competiciones por temporada, premios, trofeos y respaldo por archivo o texto.
- Diseño adaptable a teléfono, tablet y escritorio; navegación con teclado y etiquetas para lectores de pantalla.
- Instalación como app y uso sin conexión después de preparar la caché.

### Reglas que se respetan

- Las jornadas se calculan por competición según el orden del calendario. Insertar, mover o eliminar ajusta los siguientes encuentros. Puedes fijar una jornada manual y los encuentros posteriores continúan desde ella.
- Las fechas son las del juego y no reordenan automáticamente la lista. Puedes escribir una fecha ISO (`2026-10-24`) o algo como `24 oct`.
- Los amistosos y la pretemporada quedan fuera de las estadísticas oficiales por defecto. Se pueden incluir cambiando el filtro.
- Solo puede haber una temporada activa. Al iniciar una nueva, la anterior queda finalizada y conserva todos sus datos. Las temporadas anteriores siguen accesibles en el selector superior.
- El marcador es opcional. Si se escribe, hay que completar ambos equipos. La nota admite de 0 a 10 y los minutos, de 0 a 150. Al cambiar titular/suplente se propone 90/20 minutos, que puedes corregir.
- Los premios de jugador del mes y los títulos se registran manualmente por temporada; no dependen del filtro de competición.
- Las competiciones con partidos no se pueden eliminar. Puedes renombrarlas o cambiar si cuentan como oficiales.

## Importar un calendario desde una foto

La importación es **asistida y local**. No necesita cuenta ni API. Incluye Tesseract.js y modelos de español e inglés dentro de `vendor/`. No envía fotos ni texto a ningún servicio de reconocimiento.

### Si aparece texto con los nombres de los clubes

1. Entra en **Calendario → Importar captura** y selecciona una imagen PNG, JPG o WebP de hasta 15 MB.
2. Arrastra sobre una fila o casilla para seleccionarla. En móvil puedes hacerlo con el dedo.
3. Pulsa **Leer selección**. Si no seleccionas una región, el lector usa toda la imagen.
4. Revisa el rival, la fecha, la competición y si eres local o visita. La app busca las competiciones del catálogo que tengas habilitadas y expresiones como `Local`, `Visita`, `Home`, `Away`, `(L)`, `(V)`, `(H)` o `(A)`.
5. Repite con las otras casillas o filas y pulsa **Añadir seleccionados**.

La vista mensual de EA FC puede distribuir números, nombres y competiciones en distintas posiciones. Para esos casos, **lee una casilla a la vez**. La lectura de toda la imagen funciona mejor en listas donde cada partido ocupa una línea. No es un extractor automático universal de todos los diseños del juego.

Los campos desconocidos quedan para revisión. Localía, competición y rival son obligatorios antes de importar; la fecha es opcional. Los partidos se añaden al final en el orden de revisión. Después puedes moverlos editándolos. Si hay la misma fecha, rival, competición y localía en esa temporada, la importación omite el duplicado. Sin fecha, revisa tú los posibles duplicados.

### Si solo aparece el escudo

1. Selecciona el contorno de **un escudo** con el dedo o ratón.
2. Pulsa **Es un escudo**.
3. Escribe el nombre del rival y completa competición y localía.
4. Al añadir el partido, se aprende una firma visual de ese recorte.
5. En una captura posterior, selecciona el mismo escudo y vuelve a pulsar **Es un escudo**. Si el parecido es suficiente y no hay ambigüedad, se propondrá un rival.

Es un aprendizaje sencillo por parecido de color y forma: funciona mejor con escudos recortados de manera similar y la misma apariencia del juego. No incluye una base mundial de escudos y puede fallar si cambia el fondo, el tamaño relativo, la iluminación o el diseño. **Confirma siempre las sugerencias.**

Las fotos y los recortes no se conservan después de cerrar la importación. Solo se guarda una pequeña firma numérica de los escudos asignados, incluida en el respaldo. Los escudos decorativos de la interfaz usan iniciales y colores; no son logotipos oficiales de los clubes.

### También puedes pegar texto

En **Texto detectado / pegar calendario**, escribe una línea por partido y pulsa **Preparar desde texto**:

```text
2026-10-24 | Sevilla FC | Local | Liga
2026-10-28 | Liverpool FC | Visita | Champions League
2026-11-03 | Real Betis | Local | Copa
```

Usa los nombres de tu propio catálogo. Puedes editar el texto OCR si alguna palabra se leyó mal. La primera lectura puede tardar porque hay que cargar el motor; en teléfonos modestos las imágenes pequeñas se procesan mejor.

## Guardado, respaldos y privacidad

El guardado usa `localStorage`, clave `fc-tracker:data`. No hay sincronización entre dispositivos. Borrar datos del sitio, usar otro navegador, cambiar de dispositivo o navegar en privado puede dejarte sin acceso a tu carrera.

- **Descargar respaldo** genera un JSON completo; en dispositivos compatibles abre la opción de compartir/guardar en Archivos. Guarda el archivo donde lo puedas recuperar.
- **Restaurar archivo** valida el contenido y muestra un resumen antes de reemplazar tu carrera.
- **Respaldo en texto** permite copiar todo el JSON o pegar uno para restaurarlo.
- Se aceptan los respaldos `app: "fc-tracker"`, esquema 1 del boceto original. Las referencias rotas, versiones incompatibles y archivos ajenos se rechazan.
- Si los datos almacenados están dañados, la app bloquea las escrituras y ofrece descargar el original antes de recuperar. No empieza sobrescribiendo esa copia.
- Si el navegador no permite guardar o se queda sin espacio, aparece un aviso. Mantén la página abierta y descarga un respaldo.
- Si otra pestaña modifica los datos, se bloquea la sobrescritura hasta cargar los cambios. Usa una sola pestaña para registrar tu carrera.

No hay analítica, fuentes externas ni llamadas a APIs en el código de la app. Los archivos de la web se sirven desde el alojamiento que elijas; su proveedor puede registrar peticiones como en cualquier sitio web. Los respaldos se descargan sin cifrar: contienen los datos de juego que escribiste.

## Instalarla y usarla sin conexión

- **iPhone:** abre la dirección de GitHub Pages en Safari → Compartir → Agregar a pantalla de inicio.
- **Android / escritorio:** usa Instalar app o Agregar a pantalla de inicio, según el navegador.
- Abre la app publicada con conexión y deja que se preparen los archivos. Las pantallas y los registros quedan disponibles sin conexión después de instalar su caché.
- El OCR descarga sus archivos desde **tu propia web** cuando se usa. Para leer imágenes sin conexión, realiza primero una lectura completa con conexión en ese navegador o app instalada. El navegador puede limpiar la caché si falta espacio; el guardado local también necesita respaldos.
- Si la instalación o Safari usan almacenamientos distintos, lleva tus datos con exportar/restaurar. Comprueba dónde aparecen y utiliza siempre el mismo acceso.
- Publica por HTTPS (GitHub Pages ya lo hace). El servidor local de prueba también permite el modo app en navegadores compatibles.

## Actualizar la web

1. Descarga un respaldo de la carrera.
2. Cambia los archivos necesarios.
3. Incrementa `VERSION` en `sw.js`, por ejemplo de `1.0.0` a `1.0.1`.
4. Sube los archivos actualizados a GitHub.
5. Cuando la app anuncie una nueva versión, cierra **todas** sus ventanas y vuelve a abrirla. El nuevo código conserva los registros locales.

Los cambios en `freshState()` solo afectan carreras nuevas. Para cambiar las competiciones de una carrera existente usa Mi carrera.

## Archivos principales

```text
index.html                 Página de entrada
manifest.webmanifest       Configuración de instalación
sw.js                      Caché para uso sin conexión
src/app.js                 Formularios, guardado y acciones
src/ui.js                  Las cuatro pantallas
src/style.css              Diseño y adaptación a pantallas
src/domain.js              Reglas, estadísticas y respaldos
src/ocr.js                 Lectura de texto y parecido de escudos
assets/                    Iconos de la app
vendor/                    Motor OCR e idiomas, incluidos
scripts/serve.mjs           Servidor local opcional
tests/                     Pruebas de lógica y publicación
```

Para ejecutar las pruebas incluidas: `npm run check`. No requieren instalar dependencias.

Lee `VERIFICACION.md` para conocer lo probado y las limitaciones de esta entrega, y `TERCEROS.md` para los componentes y sus licencias.

Aplicación independiente; no está afiliada a EA Sports ni a los clubes mencionados. Los nombres de la demo son datos de ejemplo.
