# Componentes de terceros

El código específico de FC Tracker se entrega bajo la licencia MIT de `LICENSE`. Los siguientes archivos conservan sus propias licencias:

| Componente | Versión | Licencia | Origen |
|---|---|---|---|
| Tesseract.js | 6.0.1 | Apache 2.0 | https://github.com/naptha/tesseract.js |
| Tesseract.js Core | 6.0.0 | Apache 2.0 | https://github.com/naptha/tesseract.js-core |
| Datos `eng` y `spa` de Tesseract | Paquetes `@tesseract.js-data/*` 1.0.0, variante `4.0.0_best_int` | Apache 2.0 | https://github.com/naptha/tessdata y https://github.com/tesseract-ocr/tessdata_best |

Las licencias del motor y el core están en `vendor/TESSERACT-LICENSE.txt` y `vendor/CORE-LICENSE.txt`. Los modelos proceden de los paquetes publicados por el proyecto. Todos se distribuyen localmente: no se cargan desde un CDN durante el uso de esta app.

Archivos originales descargados desde `https://cdn.jsdelivr.net/npm/` con las versiones fijas indicadas. No modifiques los archivos del motor; si los actualizas, usa versiones compatibles, conserva sus licencias y vuelve a probar el lector.

FC Tracker no incorpora fotografías, logos oficiales de EA ni un catálogo de escudos de clubes. Los símbolos de la interfaz se crean con CSS/SVG y tipografías del dispositivo.
