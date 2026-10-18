# Verificación de la entrega

Versión 1.2.0 · 18 de octubre de 2026.

## Resultado

**27 pruebas incluidas**, ejecutadas con `npm run check`, todas aprobadas.

Se verificaron las reglas del calendario, jornadas e inserciones; estadísticas por competición y minutos; temporadas e historial; validación y recuperación de respaldos; datos de demostración; rutas relativas y manifest; caché sin conexión y preparación del catálogo de escudos.

Las pruebas del catálogo verifican:

- 769 identificadores únicos y 769 archivos PNG locales, con firma PNG y dimensiones válidas.
- Igualdad del catálogo JSON con el catálogo usado por la app.
- Alias PSG, Paris SG, Man City, MCI, Barça, Bayern, Juve, Inter, la U y otros nombres habituales.
- Búsqueda parcial, orden de sugerencias, límite de resultados y rivales del historial.
- Equipos personalizados y tratamiento de nombres como texto.
- Escudos en partidos antiguos escritos con abreviaturas, sin modificar los registros.
- Prioridad del catálogo sobre recortes antiguos y reemplazo explícito por un escudo personal.
- Compatibilidad de respaldos, incluidas las preferencias de imágenes personales.
- Ausencia de los módulos de OCR, lector de cuadrícula y carpeta de dependencias del lector.

**Los 769 PNG se decodificaron además con una biblioteca de imágenes** para comprobar su integridad. Se inspeccionaron visualmente los escudos de PSG y Manchester City, que corresponden a sus emblemas originales.

## Flujos simulados de interfaz

Un DOM simulado comprobó los siguientes flujos con el código real de la aplicación:

- Buscar y elegir el club propio, con vista previa de su escudo.
- Escribir PSG, elegir la sugerencia, registrar el partido y obtener su escudo en Inicio.
- Guardar Man City sin elegir una opción y normalizar el nombre a Manchester City.
- Buscar manch, mover la selección con flechas y usar Enter sin enviar el formulario accidentalmente.
- Cerrar las sugerencias con Escape y abrir/cerrar con el botón del desplegable.
- Guardar un rival desconocido y verlo después como sugerencia del historial.
- Mostrar escudos en Calendario, sin botón de importar fotos.
- Entrar y salir de la demo sin modificar los registros reales.
- Parsear correctamente la hoja de estilos CSS.

Las comprobaciones pasaron. También se verificó la sintaxis de los módulos JavaScript y la generación del catálogo con `npm run catalogo`.

## Límites de verificación

La vista previa integrada quedó bloqueada en una ejecución anterior. No se realizó una nueva inspección visual de la interfaz en un navegador ni una prueba física en iPhone/Android. El DOM simulado comprueba eventos y contenido, pero no distribución visual ni gestos táctiles.

La preparación de caché se probó mediante simulación del service worker, no desconectando un navegador real. Los fallos de descarga o falta de espacio pueden impedir completar la caché de escudos; la app avisa que están listos únicamente cuando termina la preparación completa.

El catálogo es una selección de clubes y participantes históricos, no un inventario universal ni una afirmación de las ligas o temporadas actuales. La procedencia exacta de las imágenes figura en escudos/fuentes.json.

No se publicó en una cuenta de GitHub ni se verificó una dirección pública porque no se indicó un repositorio de destino. La carpeta y el ZIP están preparados para alojamiento estático.
