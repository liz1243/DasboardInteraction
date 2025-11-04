## Guía de paleta y aplicación en gráficos (Chart.js)

### Paleta aprobada

- **Color principal (destacado)**: `#FDC600`
- **Color secundario (para contraste)**: `#BFBFBF`
- **Color neutro oscuro**: `#333333`
- **Color metálico (ejes/grids)**: `#C0C0C0`
- **Fondo**: `#000000`
- **Texto**: `#FFFFFF`

### Variables CSS añadidas/ajustadas

Archivo: `src/styles/variables.css`

```css
:root {
  /* Base */
  --bg-primary: #000000; /* antes: #070807 */

  /* Paleta genérica */
  --color-yellow: #fdc600;
  --color-black: #000000;
  --color-white: #ffffff;

  /* Tokens de tema */
  --accent-primary: var(--color-yellow);
  --accent-primary-rgb: 253, 198, 0;

  /* Nuevos tokens para charts */
  --neutral-dark: #333333;
  --metallic-silver: #c0c0c0;
  --metallic-silver-rgb: 192, 192, 192;

  --chart-bg: #000000;
  --chart-text: #ffffff;
  --chart-primary: #fdc600;            /* amarillo principal */
  --chart-views: var(--chart-primary);
  --chart-secondary: #bfbfbf;          /* gris secundario */
  --chart-secondary-rgb: 191, 191, 191;
  --chart-likes: var(--chart-secondary);
  --chart-likes-rgb: var(--chart-secondary-rgb);
  --chart-comments: #ffd54d;           /* amarillo claro */
  --chart-comments-rgb: 255, 213, 77;
  --chart-axis: var(--metallic-silver);
  --chart-grid: rgba(192, 192, 192, 0.2);
}
```

Archivo: `src/styles/base.css`

```css
body { background: #000000; color: #fff; }
```

### Aplicación en componentes

- `src/components/ChartViews.vue`
  - Views: `--chart-views` (amarillo principal).
  - Likes: `--chart-likes` (gris #BFBFBF).
  - Comments: `--chart-comments` (amarillo claro).
  - Ejes/ticks en `--metallic-silver`; grillas `rgba(192,192,192,0.2)`; tooltip texto blanco y borde plateado translúcido.

- `src/components/ChartPieClient.vue`
  - Segmentos alternan entre amarillo (`--accent-primary-rgb`) y gris (`--chart-secondary-rgb`) variando la opacidad.
  - Borde del segmento: alterna amarillo/gris acorde; leyenda en blanco; tooltip con borde plateado sutil.

- `src/components/ChartEngagement.vue`
  - Barras alternan degradado amarillo y gris (`--chart-secondary-rgb`).
  - Bordes alternan amarillo/gris; ejes en plateado; tooltips como arriba.

- `src/components/ChartEngagementByVideo.vue`
  - Barras horizontales alternan degradado amarillo/gris; resto consistente con el patrón anterior.

### Lectura de variables en Chart.js

Ejemplo de lectura de tokens desde JS:

```js
const styles = getComputedStyle(document.documentElement);
const accent = styles.getPropertyValue('--accent-primary').trim();
const accentRgb = styles.getPropertyValue('--accent-primary-rgb').trim();
const secondary = styles.getPropertyValue('--chart-secondary').trim();
const secondaryRgb = styles.getPropertyValue('--chart-secondary-rgb').trim();
const silverRgb = styles.getPropertyValue('--metallic-silver-rgb').trim();
```

### Patrones de color usados en barras/segmentos

- Alternancia 1–1 (default): índice par amarillo, impar gris.

```js
const bg = data.map((_, i) => (i % 2 === 0 ? gradientPrimary : gradientSecondary));
const border = data.map((_, i) => (i % 2 === 0 ? accent : secondary));
```

- Cambiar inicio a gris:

```js
const bg = data.map((_, i) => (i % 2 === 0 ? gradientSecondary : gradientPrimary));
```

- Patrón 2–1 (dos amarillos, uno gris):

```js
const pick = (i) => (i % 3 === 2 ? 'secondary' : 'primary');
```

### Cómo extender la paleta para nuevos datasets

1) Añadir variables en `variables.css`:

```css
--chart-shares: #9e9e9e;
--chart-shares-rgb: 158, 158, 158;
```

2) Leerlas en el componente y aplicarlas en `datasets`:

```js
const shares = styles.getPropertyValue('--chart-shares').trim();
const sharesRgb = styles.getPropertyValue('--chart-shares-rgb').trim();
// usar shares / rgba(sharesRgb, 0.1)
```

### Accesibilidad y contraste

- Mantener texto en `#FFFFFF` sobre fondo `#000000` para WCAG AA.
- Usar `--metallic-silver` para ejes y `--chart-grid` con baja opacidad para no competir con los datos.
- Aumentar `borderWidth` o `hoverOffset` en pie/bar para mejorar foco visual cuando sea necesario.

### Registro de cambios (resumen)

- `variables.css`: nuevos tokens de paleta para charts; `--bg-primary` a `#000000`.
- `base.css`: fondo de `body` a negro.
- `ChartViews.vue`: series diferenciadas (views amarillo, likes gris, comments amarillo claro) y ejes/tooltip actualizados.
- `ChartPieClient.vue`: alternancia amarillo/gris en segmentos y ajuste de leyenda/tooltip.
- `ChartEngagement.vue`: barras alternadas amarillo/gris (degradados), ejes y tooltips.
- `ChartEngagementByVideo.vue`: barras horizontales alternadas amarillo/gris, ejes y tooltips.

### Recomendaciones para siguientes proyectos

- Centralizar toda la paleta en `variables.css` y derivar desde ahí.
- Evitar hardcodear hex en componentes; usar `getComputedStyle` para mantener un único origen de verdad.
- Definir desde el inicio los tokens para: color primario, secundario, texto, ejes y grillas.
- Documentar el patrón de alternancia y cómo cambiarlo por prop para flexibilidad.


