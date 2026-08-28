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

## La planilla: modelo unificado

**`productos`** — la tabla maestra. Un producto existe UNA vez aunque esté en varias cartas:
id, seccion_id, orden, nombre, descripción, traducciones (en/pt), tags, la columna
**`cartas`** (multi-select) y una columna de precio por carta (DG, LB, RS, PS, LF, CV, LV, ADD).
Los productos iguales (agua, copas de vino, cocktails, café…) están unificados: una fila,
precio por carta. Editás el nombre una vez y cambia en todas.

**`secciones`** — catálogo de secciones, una fila por sección, SIN prefijo de carta:
seccion_id, nombre (es/en/pt), nota, foto. La sección `copa` unifica las viejas copa de
vino / espumante / vino-y-espumante en una sola.

**`secciones_carta`** — dónde aparece cada sección y en qué orden: `carta_id | seccion_id | orden`.
Una misma sección (`postres`, `copa`) se coloca en varias cartas, cada una con su propio orden.

Un producto aparece en una carta si: (a) esa carta declara su sección en `secciones_carta`,
y (b) el producto tiene precio en esa carta.

Algunos platos comparten nombre pero son recetas distintas (el "Salmón" de DG, LB y RS):
esos NO se unifican, quedan como filas separadas con el nombre desambiguado. Lo que distingue
a cualquier producto es el **producto_id**, nunca el nombre. El id no se toca jamás.

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
| Agregar una sección a una carta | Fila en `secciones_carta` (carta + seccion_id + orden) → Publicar |
| Crear una sección nueva | Fila en `secciones` (catálogo) + fila(s) en `secciones_carta` → Publicar |
| Crear una carta | Fila en `cartas` + filas en `secciones_carta` → Publicar |
| Aumento en tanda | **Cartas ▸ Regenerar pendientes** → cargo NUEVO por carta → **Cartas ▸ Aplicar aumentos** → Publicar |
| Cambiar una foto | Reemplazo en Drive → **Cartas ▸ Sincronizar fotos** |

## Aumentos (hoja `pendientes`)

La hoja tiene: `producto_id | nombre | cartas | (ACTUAL/NUEVO por cada carta)`. ACTUAL se
llena sola con el precio vigente (fórmula); NUEVO lo cargás vos. El botón vuelca NUEVO→productos.

**Antes de cargar, corré Cartas ▸ Regenerar pendientes.** Reconstruye la hoja desde
`productos`: incluye los productos nuevos, saca los borrados, y **deja fuera los que no
tienen precio en ninguna carta**. Cualquier NUEVO a medio cargar se pierde, así que se corre
al EMPEZAR un aumento, no en el medio.

La hoja `pendientes` NO se sincroniza sola cuando editás `productos`: por eso está el botón.
Si agregás un producto y no regenerás, ese producto simplemente no aparece en el próximo
aumento en tanda (igual funciona en la web).

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
