# Dashboard de Interacción - Miela

Dashboard moderno en modo oscuro para análisis de métricas y engagement de campañas, construido con Vue 3 y arquitectura PAC.

## 🚀 Tecnologías

- **Vue 3** (Composition API)
- **Vite** (Build tool)
- **Pinia** (Estado global)
- **Chart.js** (Gráficas personalizadas)
- **XLSX** (Procesamiento de archivos Excel)
- **Bootstrap 5** (Solo grid y utilities)
- **CSS Variables** (Dark theme personalizado)

## 📁 Estructura del Proyecto

```
/src
 ├─ components/          # Componentes reutilizables
 │   ├─ KpiCard.vue
 │   ├─ ChartViews.vue
 │   ├─ ChartEngagement.vue
 │   ├─ UploadExcel.vue
 │   └─ TableCampaign.vue
 ├─ modules/
 │   └─ dashboard/       # Módulo dashboard (PAC architecture)
 │       ├─ DashboardView.vue
 │       ├─ dashboardStore.js
 │       └─ dashboardService.js
 ├─ services/           # Servicios (lógica de negocio)
 │   └─ excelParser.js
 ├─ utils/              # Utilidades
 │   ├─ kpiCalculations.js
 │   └─ mockData.js
 ├─ styles/             # Estilos globales
 │   ├─ variables.css
 │   └─ dashboard.css
 ├─ App.vue
 ├─ main.js
 └─ router.js
```

## 🎨 Características de Diseño

- **Dark Mode Premium**: Tema oscuro con colores neón (#00eaff, #ff7bf7, #4dff91)
- **Glassmorphism**: Efectos de vidrio en tarjetas KPI
- **Gráficas Dark**: Chart.js configurado para modo oscuro
- **UI Moderna**: Diseño tipo Dashkit/Metronic/AdminPro
- **Responsive**: Adaptado para móviles y tablets

## 📊 KPIs Calculados

- **Total Views**: Suma de todas las visualizaciones
- **Total Likes**: Suma de todos los likes
- **Total Comments**: Suma de todos los comentarios
- **Engagement Rate**: `((Likes + Comments) / Views) * 100`

## 📄 Formato Excel Requerido

El archivo Excel debe contener las siguientes columnas:

- `NombreCampana`
- `NombreCliente`
- `NombreTalento`
- `entregables_URL`
- `entregables_fecha`
- `Views`
- `Likes`
- `Comments`

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install
```

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

## 📦 Build para Producción

```bash
# Compilar para producción
npm run build
```

## 🧪 Datos Mock

Para pruebas sin Excel, puedes usar los datos mock incluidos. En el componente `DashboardView.vue`, puedes importar y usar:

```javascript
import { loadMockData } from '@/utils/mockData.js';
import { useDashboardStore } from './dashboardStore.js';

const store = useDashboardStore();
loadMockData(store);
```

## 📝 Funcionalidades

1. **Carga de Excel**: Arrastra y suelta o selecciona un archivo Excel
2. **Validación**: Verifica que el Excel tenga las columnas requeridas
3. **Cálculo Automático**: KPIs y gráficas se actualizan automáticamente
4. **Visualización**: Tabla interactiva con todas las campañas
5. **Gráficas**: Views por fecha y Engagement Rate

## 🎯 Arquitectura PAC

El proyecto sigue la arquitectura **Presentation-Abstraction-Control**:

- **Presentation**: Componentes Vue (`.vue`)
- **Abstraction**: Stores Pinia (`dashboardStore.js`)
- **Control**: Services (`dashboardService.js`, `excelParser.js`)

## 📌 Notas

- Bootstrap 5 solo se usa para el sistema de grid y utilities
- Todos los estilos visuales son personalizados con CSS variables
- El tema oscuro está completamente configurado desde `variables.css`
- Las gráficas están optimizadas para modo oscuro con colores neón
