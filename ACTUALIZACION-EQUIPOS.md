# Versión 1.2 · Equipos sugeridos y escudos incluidos

Se retiró el sistema de añadir partidos por foto, junto con el motor OCR, los idiomas y el lector de cuadrícula. Los partidos se añaden manualmente con ayuda de un selector de equipos.

## Lo nuevo

- **769 clubes** con un archivo PNG por equipo dentro de `escudos/`.
- El rival se busca por nombre o alias: PSG, Man City, Barça, Juve, la U, Chivas, etc.
- El desplegable muestra nombre, país y escudo. Elegir un resultado rellena el campo.
- Las flechas y Enter permiten seleccionar con teclado; Escape cierra las sugerencias.
- El mismo selector sirve al crear el jugador, editar su club o iniciar otra temporada.
- Las abreviaturas en partidos anteriores reciben su imagen automáticamente, sin tener que reescribir los registros.
- Los clubes fuera del catálogo siguen admitidos como texto y pueden tener un escudo personal.

## Actualizar

Respalda tu carrera y reemplaza los archivos del mismo repositorio con el contenido del ZIP. Incluye toda la carpeta `escudos/`. Puedes eliminar los antiguos `vendor/`, `src/ocr.js`, `src/grid.js` y la guía ACTUALIZACION-ESCUDOS.md. No borres datos del navegador.

Después de publicar, abre con conexión y cierra todas las ventanas de la app para cargar la nueva versión. El guardado y los respaldos siguen siendo compatibles con el esquema 1.

## Añadir un club permanente a la carpeta

Si quieres que un club adicional venga incluido para cualquier persona que abra tu web:

1. Guarda su escudo PNG como `escudos/mi-club.png`.
2. Añade en `escudos/catalogo.json` una entrada con esta forma:

```json
{
  "id": "mi-club",
  "name": "Mi Club",
  "country": "Chile",
  "aliases": ["Otro nombre", "MCF"],
  "crest": "escudos/mi-club.png"
}
```

3. Ejecuta `npm run catalogo` con Node.js. Esto actualiza el archivo de búsqueda `src/teams-data.js` a partir del JSON; no instala dependencias.
4. Incrementa VERSION en `sw.js`, por ejemplo de 1.2.0 a 1.2.1, para actualizar la caché.
5. Sube los archivos modificados y el nuevo PNG al repositorio. Registra la procedencia de la imagen en TERCEROS.md.

El nombre de archivo por sí solo no basta: GitHub Pages no lista automáticamente los archivos de una carpeta. Por eso el catálogo identifica el nombre, sus alias y la imagen correspondiente.

Si el escudo solo es para tu propia carrera, basta con **Mi carrera → Escudos de clubes → Añadir escudo**, sin editar el proyecto.
