# Especial ECData: admisión regular a San Marcos, 2023-I a 2026-II

Versión de revisión editorial (borrador). Página estática con recursos externos alojados en GitHub Pages.

- `index.html`: estructura del especial con URLs absolutas a imágenes, estilos, datos y scripts.
- `d3.min.js`: D3 v7.9.0, para los gráficos.

Autoría: análisis de datos, diseño y desarrollo, Fabrizio Monge. Edición general, Ariana Lira.
Fuente de los datos: UNMSM. Elaboración: ECData.

## Recursos para Arc

El HTML carga imágenes, CSS y JavaScript mediante URLs absolutas bajo https://fabmonge.github.io/especial-sanmarcos/. Así los recursos siguen apuntando a GitHub Pages cuando el HTML se utiliza en otro dominio.

- `styles.css`: estilos del especial.
- `data.js`: datos originales.
- `app.js`: gráficos e interacciones originales.
- `portada-sanmarcos.jpg`, `logo-ecdata.webp`, `logo-el-comercio.png`: imágenes extraídas sin recomprimir del HTML original.

Se debe conservar el orden de scripts: D3, datos y aplicación. Arc debe permitir cargar estos scripts y estilos externos. La integración dentro de una plantilla de Arc requiere comprobar sus estilos y políticas de contenido.
