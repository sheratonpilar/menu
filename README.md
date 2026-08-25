# Cartas digitales — Sheraton Pilar

Google Sheets → Apps Script → JSON en este repo → GitHub Pages.
La web es estática: no lee la planilla en vivo, lee el JSON publicado.

8 cartas: Don Giovanni, Lobby Bar, Room Service, Pool Snack, La Federala,
Carta de Vinos, Las Vasijas y Adicionales Desayuno.

```
index.html              selector de cartas
carta/<carta_id>/       una página por carta (la genera el script)
assets/css/menu.css     base + un tema por carta
assets/js/menu.js       render, buscador, idiomas (es/en/pt)
assets/img/logos/       logos
assets/img/secciones/   fotos de portada de sección
data/<carta_id>.json    lo escribe Apps Script al publicar
apps-script/Codigo.gs   validar + publicar + aumentos + fotos
```

## La planilla: una sola tabla maestra

Todo vive en **`productos`**: id, familia, sección, orden, nombre, descripción,
traducciones (en/pt), tags, la columna **`cartas`** (multi-select) y una columna
de precio por cada carta (DG, LB, RS, PS, LF, CV, LV, ADD).

- Tildás en `cartas` en qué cartas va el producto.
- Cargás el precio en la columna de cada una de esas cartas.
- La columna `cartas` **manda**: el validador exige que carta marcada = precio cargado,
  y precio cargado = carta marcada. Si no coinciden, no publica.

Dos platos pueden llamarse igual (el "Salmón" de DG y el del Lobby Bar). Lo que los
distingue es el **producto_id**, nunca el nombre. Por eso el id no se toca jamás.

## Puesta en marcha (una vez)

1. **Repo**: subí todo esto a la raíz. Settings ▸ Pages ▸ Branch `main` / `/(root)`.
2. **Planilla**: importá `Cartas_AABB.xlsx` a Google Sheets (Archivo ▸ Importar ▸ Reemplazar).
3. **Activá los desplegables multi-select** (ver sección siguiente).
4. **Token**: GitHub ▸ Settings ▸ Developer settings ▸ Fine-grained token, repo `cartas`,
   permiso **Contents: Read and write**.
5. **Script**: Extensiones ▸ Apps Script, pegá `Codigo.gs`. En Propiedades del script:
   `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH=main`, `GITHUB_TOKEN`, `DRIVE_FOTOS` (opcional).
6. Recargá la planilla → aparece el menú **Cartas** → Validar → Publicar.

## Activar los multi-select (4 clics por columna)

Excel no puede crear el chip multi-select; se activa una vez en Google Sheets:

**Columna `cartas` de la hoja `productos`:**
1. Seleccioná la columna `cartas` (desde la fila 2 hacia abajo).
2. Menú **Datos ▸ Validación de datos ▸ Agregar regla**.
3. Criterio: **Menú desplegable (varios)**. Pegá los valores:
   `don-giovanni, lobby-bar, room-service, pool-snack, la-federala, carta-vinos, las-vasijas, adicionales-desayuno`
4. Listo. Ahora cada celda deja elegir varias cartas como chips.

**Columna `tags` de la hoja `productos`:** igual, con los valores:
`SIN_TACC, VEGETARIANO, VEGANO, NUEVO, SUGERENCIA_CHEF, PROMO`

## Operación diaria

| Necesito… | Hago |
|---|---|
| Cambiar un precio | Hoja `productos`, columna de esa carta → **Cartas ▸ Publicar** |
| Sacar un producto de una carta | Destildo la carta en `cartas` y borro su precio → Publicar |
| Agregar un producto | Fila nueva en `productos`: id, sección, nombre, tildar cartas, precios → Publicar |
| Crear una carta | Fila en `cartas` + sus filas en `secciones` → Publicar |
| Aumento en tanda | Hoja `pendientes`: cargo NUEVO por carta → **Cartas ▸ Aplicar aumentos** → Publicar |
| Cambiar una foto | Reemplazo en Drive → **Cartas ▸ Sincronizar fotos** |

## Aumentos (hoja `pendientes`)

Una sola hoja para comida y bebida. Por cada carta hay dos columnas: **ACTUAL** (se llena
sola con el precio vigente) y **NUEVO** (lo cargás vos). El botón vuelca NUEVO→productos.

| Celda NUEVO | Qué hace |
|---|---|
| vacía | no toca nada |
| `47000` | cambia el precio de esa carta |
| `BAJA` | saca el producto de esa carta (borra precio y destilda la carta) |

Es todo o nada: si hay un valor inválido, no aplica nada. Muestra cambios y bajas por
separado, registra en `historial_precios` y no publica hasta que aprietes Publicar.

## Idiomas

`es` es base. `en` y `pt` viven en las columnas de `productos` y `secciones`. Si falta una
traducción, se muestra el español. Los vinos y destilados no se traducen (nombres propios).
