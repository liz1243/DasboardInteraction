<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <div class="header-content">
        <div>
          <h3 class="chart-title">Time Series - By Month</h3>
          <div class="month-selector">
            <select v-model="selectedMonth" @change="updateMonth" class="month-select">
              <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                {{ month.label }}
              </option>
            </select>
            <select 
              v-if="!staticPlatform" 
              v-model="selectedPlatform" 
              @change="updatePlatform" 
              class="platform-select"
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="kick">Kick</option>
              <option value="twitch">Twitch</option>
            </select>
            <div v-else class="platform-static">
              <span class="platform-label">Platform:</span>
              <span class="platform-value">{{ getPlatformLabel(staticPlatform) }}</span>
            </div>
          </div>
        </div>
        <div class="metrics-filter">
          <div class="filter-buttons">
            <!-- FTDs siempre visible -->
            <button
              v-for="metric in visibleMetricsList"
              :key="metric.key"
              @click="toggleMetric(metric.key)"
              :class="['metric-toggle', { active: visibleMetrics[metric.key], inactive: !visibleMetrics[metric.key] }]"
            >
              <span class="metric-dot" :style="{ backgroundColor: metric.color }"></span>
              <span class="metric-label">{{ metric.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="chart-wrapper">
      <canvas ref="chartCanvas"></canvas>
      <div v-if="!hasData" class="no-data-message">
        <p>No data available</p>
      </div>
      <div v-else-if="chartData.labels.length === 0" class="no-data-message">
        <p>No data for selected month</p>
      </div>
      <div v-else-if="chartData.datasets.length === 0" class="no-data-message">
        <p>Activa al menos una métrica para ver el gráfico</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  selectedPlatformFromStore: {
    type: String,
    default: 'all'
  },
  staticPlatform: {
    type: String,
    default: null // Si se proporciona, muestra la plataforma de forma estática (no editable)
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

// Mes seleccionado (se inicializará con el mes con más datos)
const selectedMonth = ref(null);

// Plataforma seleccionada
const selectedPlatform = ref(props.staticPlatform || props.selectedPlatformFromStore || 'all');

// Almacenar información de fechas y clientes para el tooltip
const chartDateInfo = ref({});

// Obtener clave del mes actual (YYYY-MM)
function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Obtener el mes con más datos de las campañas
function getMonthWithMostData(data) {
  if (!data || data.length === 0) return getCurrentMonthKey();
  
  const monthCounts = {};
  
  data.forEach(campaign => {
    if (!campaign.entregables_fecha || campaign.entregables_fecha === '' || campaign.entregables_fecha.toString().trim() === '') {
      return;
    }
    
    try {
      const dateStr = campaign.entregables_fecha.toString().trim();
      let y, m;

      // Parsear manualmente para formato YYYY-MM-DD o YYYY-M-D para evitar problemas de zona horaria
      const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

      if (dateMatch) {
        y = parseInt(dateMatch[1], 10);
        m = parseInt(dateMatch[2], 10);
      } else {
        // Para otros formatos, extraer componentes manualmente
        const tempDate = new Date(dateStr);
        if (!isNaN(tempDate.getTime())) {
          y = tempDate.getFullYear();
          m = tempDate.getMonth() + 1;
        } else {
          return; // Ignorar fechas inválidas
        }
      }

      if (y && m) {
        const monthKey = `${y}-${String(m).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    } catch (e) {
      // Ignorar errores
    }
  });
  
  // Encontrar el mes con más datos
  const sortedMonths = Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
  const bestMonth = sortedMonths.length > 0 ? sortedMonths[0][0] : getCurrentMonthKey();
  return bestMonth;
}

// Generar lista de meses disponibles (últimos 12 meses)
const availableMonths = computed(() => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    months.push({
      value: monthKey,
      label: `${monthNames[date.getMonth()]} ${year}`
    });
  }
  
  return months;
});

// Actualizar mes seleccionado
const updateMonth = () => {
  // El computed chartData se actualizará automáticamente
};

// Función para obtener el label de la plataforma
function getPlatformLabel(platform) {
  const labels = {
    'youtube': 'YouTube',
    'kick': 'Kick',
    'twitch': 'Twitch',
    'all': 'All Platforms'
  };
  return labels[platform] || platform;
}

// Función para actualizar la plataforma
function updatePlatform() {
  // El computed chartData se actualizará automáticamente
}

// Colores del esquema - amarillo para acentuar, blanco secundario
const mielaColors = {
  ftds: '#F0B90B',           // Amarillo estilo Binance - acento principal (resalta conversiones)
  views: '#0D21A1',          // Azul oscuro - solo YouTube
  likes: '#ffffff',          // Blanco - secundario (solo YouTube)
  comments: '#FFD54F',       // Amarillo claro - variación para comentarios (solo YouTube)
  avgViewers: '#0D21A1',     // Azul oscuro - solo Streaming
  peakViewers: '#ffffff',    // Blanco - secundario (solo Streaming)
  minutesWatched: '#26a69a'  // Verde azulado - solo Streaming
};

// Métricas disponibles - cada una con su color único de la paleta Miela
const availableMetrics = [
  { key: 'ftds', label: 'Conversions', color: mielaColors.ftds, field: 'FTDObtenido' },
  { key: 'views', label: 'Views', color: mielaColors.views, field: 'Views' },
  { key: 'avgViewers', label: 'Avg Viewers', color: mielaColors.avgViewers, field: 'Avg Viewers' },
  { key: 'peakViewers', label: 'Peak Viewers', color: mielaColors.peakViewers, field: 'Peak Viewers' },
  { key: 'minutesWatched', label: 'Minutes Watched', color: mielaColors.minutesWatched, field: 'Minutes Watched' },
  { key: 'likes', label: 'Likes', color: mielaColors.likes, field: 'Likes' },
  { key: 'comments', label: 'Comments', color: mielaColors.comments, field: 'Comments' }
];

// Función genérica para detectar plataforma desde URL
const getPlatformType = (url) => {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube')) return 'youtube';
  if (urlLower.includes('kick.com') || urlLower.includes('kick')) return 'kick';
  if (urlLower.includes('twitch')) return 'twitch';
  return null;
};

// Detectar la plataforma principal (la que tiene más campañas)
const mainPlatform = computed(() => {
  if (!props.data || props.data.length === 0) return null;
  
  const platformCounts = {};
  props.data.forEach(campaign => {
    const platform = getPlatformType(campaign.PlataformaTalento);
    if (platform) {
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    }
  });
  
  // Retornar la plataforma con más campañas
  const sorted = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
});

// Detectar si hay campañas de YouTube (para compatibilidad)
const isYouTube = (url) => {
  return url && url.toLowerCase().includes('youtube');
};

// Detectar si la plataforma principal es YouTube o streaming
const hasYouTubeCampaigns = computed(() => {
  return mainPlatform.value === 'youtube';
});

// Estado de métricas visibles - se inicializa según el tipo de plataforma
const visibleMetrics = ref({
  ftds: true,
  views: false,
  avgViewers: false,
  peakViewers: false,
  minutesWatched: false,
  likes: false,
  comments: false
});

// Inicializar métricas visibles según el tipo de plataforma
const initializeMetrics = () => {
  if (hasYouTubeCampaigns.value) {
    // YouTube: mostrar Views, Likes, Comments
    visibleMetrics.value = {
      ftds: true,
      views: true,
      likes: true,
      comments: true,
      avgViewers: false,
      peakViewers: false,
      minutesWatched: false
    };
  } else {
    // Otras plataformas: mostrar Avg Viewers, Peak Viewers, Minutes Watched
    visibleMetrics.value = {
      ftds: true,
      views: false,
      likes: false,
      comments: false,
      avgViewers: true,
      peakViewers: true,
      minutesWatched: true
    };
  }
};

// Bandera para saber si el componente está montado
const isMounted = ref(false);

// Watch para actualizar métricas cuando cambie el tipo de plataforma
watch(hasYouTubeCampaigns, () => {
  initializeMetrics();
  // Recrear el gráfico cuando cambien las métricas visibles
  // Solo si el componente ya está montado y el canvas está disponible
  if (isMounted.value && chartInstance && chartCanvas.value) {
    createChart();
  }
}, { immediate: true });

// También watch para cuando cambien los datos
watch(() => props.data, () => {
  initializeMetrics();
  // Solo recrear el gráfico si el componente está montado y ya existe una instancia
  if (isMounted.value && chartInstance && chartCanvas.value) {
    createChart();
  }
}, { deep: true });

// Filtrar métricas disponibles según la plataforma
const visibleMetricsList = computed(() => {
  // FTDs siempre está disponible
  const ftdsMetric = availableMetrics.find(m => m.key === 'ftds');
  const result = [ftdsMetric];
  
  if (hasYouTubeCampaigns.value) {
    // YouTube: mostrar Views, Likes, Comments
    result.push(
      availableMetrics.find(m => m.key === 'views'),
      availableMetrics.find(m => m.key === 'likes'),
      availableMetrics.find(m => m.key === 'comments')
    );
  } else {
    // Otras plataformas: mostrar Avg Viewers, Peak Viewers, Minutes Watched
    result.push(
      availableMetrics.find(m => m.key === 'avgViewers'),
      availableMetrics.find(m => m.key === 'peakViewers'),
      availableMetrics.find(m => m.key === 'minutesWatched')
    );
  }
  
  return result.filter(m => m !== undefined);
});

// Toggle de métrica
const toggleMetric = (metricKey) => {
  visibleMetrics.value[metricKey] = !visibleMetrics.value[metricKey];
  createChart();
};

// Verificar si hay datos
const hasData = computed(() => {
  return props.data && props.data.length > 0;
});

// Preparar datos agrupados por día del mes seleccionado
const chartData = computed(() => {
  if (!props.data || props.data.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Filtrar datos por plataforma si hay una seleccionada
  let filteredData = props.data;
  const platformToFilter = props.staticPlatform || selectedPlatform.value;
  
  if (platformToFilter && platformToFilter !== 'all') {
    filteredData = props.data.filter(campaign => {
      const platform = getPlatformType(campaign.PlataformaTalento);
      return platform === platformToFilter;
    });
  }
  
  // Si no hay datos después del filtro, retornar vacío
  if (filteredData.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Si no hay mes seleccionado, seleccionar el mes con más datos
  if (!selectedMonth.value) {
    selectedMonth.value = getMonthWithMostData(filteredData);
  }

  // Parsear mes seleccionado (YYYY-MM)
  const [year, monthNum] = selectedMonth.value.split('-').map(Number);
  const monthIndex = monthNum - 1; // Convertir a índice 0-based (0-11)
  const firstDay = new Date(year, monthIndex, 1);
  firstDay.setHours(0, 0, 0, 0);
  const lastDay = new Date(year, monthIndex + 1, 0); // Último día del mes (día 0 del siguiente mes)
  lastDay.setHours(23, 59, 59, 999);

  // Agrupar datos por día - SOLO crear entradas para días que tienen datos reales de entregables_fecha
  // NO crear días vacíos basados en el mes del sistema
  const grouped = {};

  // Agregar datos de campañas
  let dataCount = 0;
  let dateRangeCount = 0;
  let skippedNoDate = 0;
  let skippedInvalidDate = 0;
  let skippedOutOfRange = 0;
  const sampleDates = [];
  
  filteredData.forEach((campaign, index) => {
    // Si no tiene fecha de entregable, saltar (no podemos agrupar sin fecha)
    if (!campaign.entregables_fecha || campaign.entregables_fecha === '' || campaign.entregables_fecha.toString().trim() === '') {
      skippedNoDate++;
      if (index < 5) {
        sampleDates.push({ index, fecha: 'empty', ftds: campaign.FTDObtenido, views: campaign.Views });
      }
      return;
    }
    
    // Obtener la fecha como string primero
    const dateStr = campaign.entregables_fecha.toString().trim();
    
    try {
      // Parsear manualmente para formato YYYY-MM-DD o YYYY-M-D para evitar problemas de zona horaria
      let dateKey;
      let date;

      // Regex flexible que acepta YYYY-MM-DD o YYYY-M-D
      const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

      if (dateMatch) {
        // Usar directamente el string como dateKey - normalizar a formato YYYY-MM-DD
        const y = parseInt(dateMatch[1], 10);
        const m = parseInt(dateMatch[2], 10);
        const d = parseInt(dateMatch[3], 10);

        // Normalizar a formato YYYY-MM-DD con ceros
        dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        // Crear Date solo para comparación, usar zona horaria local
        date = new Date(y, m - 1, d, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
      } else {
        // Para otros formatos (ISO completo, etc), extraer componentes manualmente
        const tempDate = new Date(dateStr);
        if (!isNaN(tempDate.getTime())) {
          // Extraer componentes en zona horaria local para evitar conversión UTC
          const y = tempDate.getFullYear();
          const m = tempDate.getMonth() + 1;
          const d = tempDate.getDate();
          dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          date = new Date(y, m - 1, d, 12, 0, 0);
        } else {
          skippedInvalidDate++;
          if (index < 5) {
            sampleDates.push({ index, fecha: dateStr, error: 'invalid date', ftds: campaign.FTDObtenido });
          }
          return;
        }
      }
      
      if (isNaN(date.getTime()) || !dateKey) {
        skippedInvalidDate++;
        if (index < 5) {
          sampleDates.push({ index, fecha: dateStr, error: 'invalid date', ftds: campaign.FTDObtenido });
        }
        return;
      }
      
      // Verificar si está en el rango del mes usando el dateKey (string)
      const [campaignYear, campaignMonth] = dateKey.split('-').map(Number);
      const [selectedYear, selectedMonthNum] = selectedMonth.value.split('-').map(Number);
      
      if (campaignYear === selectedYear && campaignMonth === selectedMonthNum) {
        dateRangeCount++;
        
        // Crear entrada en grouped solo si no existe (usando la fecha del entregable, no del sistema)
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: date,
            ftds: 0,
            views: 0,
            avgViewers: 0,
            peakViewers: 0,
            minutesWatched: 0,
            likes: 0,
            comments: 0,
            count: 0,
            clients: [] // Almacenar información de clientes
          };
        }
        
        if (grouped[dateKey]) {
          const ftds = parseInt(campaign.FTDObtenido) || 0;
          const views = parseInt(campaign.Views) || 0;
          const avgViewers = parseFloat(campaign['Avg Viewers']) || 0;
          const peakViewers = parseInt(campaign['Peak Viewers']) || 0;
          const minutesWatched = parseInt(campaign['Minutes Watched']) || 0;
          const likes = parseInt(campaign.Likes) || 0;
          const comments = parseInt(campaign.Comments) || 0;
          
          
          grouped[dateKey].ftds += ftds;
          grouped[dateKey].views += views;
          grouped[dateKey].avgViewers += avgViewers;
          grouped[dateKey].peakViewers += peakViewers;
          grouped[dateKey].minutesWatched += minutesWatched;
          grouped[dateKey].likes += likes;
          grouped[dateKey].comments += comments;
          grouped[dateKey].count += 1;
          
          // Almacenar información del cliente (evitar duplicados)
          const clientInfo = {
            cliente: campaign.NombreCliente || '-',
            talento: campaign.NombreTalento || '-'
          };
          const clientExists = grouped[dateKey].clients.some(
            c => c.cliente === clientInfo.cliente && c.talento === clientInfo.talento
          );
          if (!clientExists) {
            grouped[dateKey].clients.push(clientInfo);
          }
          
          if (index < 10) {
            sampleDates.push({ 
              index, 
              fecha: dateStr, 
              parsed: dateKey, 
              ftds, 
              views,
              avgViewers,
              peakViewers,
              minutesWatched,
              rawFTD: campaign.FTDObtenido,
              rawViews: campaign.Views,
              rawAvgViewers: campaign['Avg Viewers'],
              rawPeakViewers: campaign['Peak Viewers'],
              inRange: true,
              dateObj: date.toISOString().split('T')[0],
              afterSum: {
                ftds: grouped[dateKey].ftds,
                views: grouped[dateKey].views,
                peakViewers: grouped[dateKey].peakViewers
              }
            });
          }
        } else {
          console.warn('Date key not found in grouped:', dateKey, 'Available keys:', Object.keys(grouped).slice(0, 5));
        }
      } else {
        skippedOutOfRange++;
        if (index < 5) {
          sampleDates.push({ 
            index, 
            fecha: dateStr, 
            parsed: dateKey,
            dateObj: date.toISOString().split('T')[0],
            inRange: false,
            campaignYear,
            campaignMonth,
            selectedYear,
            selectedMonthNum
          });
        }
      }
    } catch (e) {
      skippedInvalidDate++;
      if (index < 5) {
        sampleDates.push({ index, fecha: dateStr, error: e.message });
      }
      return;
    }
  });
  

  // Calcular promedios para Avg Viewers
  Object.keys(grouped).forEach(key => {
    if (grouped[key].count > 0) {
      grouped[key].avgViewers = grouped[key].avgViewers / grouped[key].count;
    }
  });

  // Filtrar solo los días que tienen datos reales (vienen de entregables_fecha)
  // No mostrar días vacíos que se crearon al inicializar el mes
  const entriesWithData = Object.entries(grouped).filter(([key, value]) => {
    // Solo incluir si tiene datos (ftds, views, etc.) o si el dateKey viene de un entregable real
    // Verificar si el dateKey está en los datos originales
    const hasData = value.ftds > 0 || value.views > 0 || value.avgViewers > 0 || 
                    value.peakViewers > 0 || value.minutesWatched > 0 || 
                    value.likes > 0 || value.comments > 0;
    
    // También verificar si este dateKey existe en los datos originales
    const existsInData = filteredData.some(campaign => {
      if (!campaign.entregables_fecha) return false;
      const dateStr = campaign.entregables_fecha.toString().trim();
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr === key;
      }
      return false;
    });
    
    return hasData || existsInData;
  });
  
  // Ordenar por fecha - usar el dateKey (string) para ordenar, no el objeto Date
  const sortedEntries = entriesWithData.sort((a, b) => {
    // Comparar directamente los strings YYYY-MM-DD
    return a[0].localeCompare(b[0]);
  });

  const labels = sortedEntries.map(([key]) => {
    // El key viene directamente del entregables_fecha, no del sistema
    return formatDateLabel(key);
  });
  
  // Almacenar información de clientes y fechas para el tooltip
  const dateInfo = {};
  sortedEntries.forEach(([key, value]) => {
    dateInfo[key] = {
      date: key,
      clients: value.clients || []
    };
  });
  
  // Guardar en ref para acceso en tooltip
  chartDateInfo.value = dateInfo;
  
  // Crear datasets solo para métricas visibles
  const datasets = availableMetrics
    .filter(metric => visibleMetrics.value[metric.key])
    .map(metric => {
      const data = sortedEntries.map(([key, value]) => {
        // Usar metric.key porque grouped usa ftds, views, etc., no FTDObtenido, Views
        const val = value[metric.key] || 0;
        return val;
      });

      return {
        label: metric.label,
        data: data,
        borderColor: metric.color,
        backgroundColor: metric.color,
        pointBackgroundColor: metric.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        spanGaps: false
      };
    });

  return { labels, datasets };
});

// Formatear fecha como clave (YYYY-MM-DD)
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formatear fecha para etiqueta (DD mes)
const formatDateLabel = (dateKey) => {
  const [year, month, day] = dateKey.split('-');
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const monthIndex = parseInt(month) - 1;
  const dayNum = parseInt(day);
  return `${dayNum} ${monthNames[monthIndex]}`;
};

const createChart = () => {
  if (!chartCanvas.value) {
    setTimeout(() => createChart(), 100);
    return;
  }

  const data = chartData.value;
  
  if (!data.labels || data.labels.length === 0) {
    console.warn('No labels available');
    // Limpiar gráfico existente
    const existingChart = Chart.getChart(chartCanvas.value);
    if (existingChart) {
      try {
        existingChart.destroy();
      } catch (e) {
        console.warn('Error destroying existing chart:', e);
      }
    }
    if (chartInstance) {
      try {
        chartInstance.destroy();
      } catch (e) {
        console.warn('Error destroying chart instance:', e);
      }
      chartInstance = null;
    }
    return;
  }

  if (data.datasets.length === 0) {
    console.warn('No datasets available (no visible metrics)');
    // Limpiar gráfico existente si no hay datasets
    const existingChart = Chart.getChart(chartCanvas.value);
    if (existingChart) {
      try {
        existingChart.destroy();
      } catch (e) {
        console.warn('Error destroying existing chart:', e);
      }
    }
    if (chartInstance) {
      try {
        chartInstance.destroy();
      } catch (e) {
        console.warn('Error destroying chart instance:', e);
      }
      chartInstance = null;
    }
    return;
  }

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  // Verificar y destruir gráfico existente
  const existingChart = Chart.getChart(chartCanvas.value);
  if (existingChart) {
    try {
      existingChart.destroy();
    } catch (e) {
      console.warn('Error destroying existing chart:', e);
    }
  }
  if (chartInstance) {
    try {
      chartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying chart instance:', e);
    }
    chartInstance = null;
  }

  // Obtener colores desde variables CSS con valores por defecto
  let textColor = '#dfe3ec';
  try {
    const styles = getComputedStyle(document.documentElement);
    const textColorValue = styles.getPropertyValue('--text-primary');
    if (textColorValue) {
      textColor = textColorValue.trim();
    }
  } catch (e) {
    // Usar valor por defecto
  }

  try {
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
          labels: {
            color: textColor,
            font: {
              size: 10,
              weight: '500'
            },
            padding: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10
          }
          },
          tooltip: {
            backgroundColor: 'rgba(22, 24, 29, 0.95)',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: function(context) {
                // Mostrar la fecha
                const dataIndex = context[0].dataIndex;
                const dateKeys = Object.keys(chartDateInfo.value);
                if (dateKeys[dataIndex]) {
                  const dateKey = dateKeys[dataIndex];
                  const [year, month, day] = dateKey.split('-');
                  const monthNames = [
                    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
                  ];
                  const monthIndex = parseInt(month) - 1;
                  return `${day} ${monthNames[monthIndex]} ${year}`;
                }
                return context[0].label || '';
              },
              label: function(context) {
                // Mostrar métrica y valor
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return `${label}: ${value.toLocaleString('en-US')}`;
              },
              afterBody: function(context) {
                // Mostrar información del cliente
                const dataIndex = context[0].dataIndex;
                const dateKeys = Object.keys(chartDateInfo.value);
                if (dateKeys[dataIndex]) {
                  const dateKey = dateKeys[dataIndex];
                  const dateInfo = chartDateInfo.value[dateKey];
                  if (dateInfo && dateInfo.clients && dateInfo.clients.length > 0) {
                    const clients = dateInfo.clients;
                    // Mostrar solo el primer cliente (o todos si hay pocos)
                    if (clients.length === 1) {
                      const client = clients[0];
                      return [
                        `Cliente: ${client.cliente}`,
                        `Talento: ${client.talento}`
                      ];
                    } else if (clients.length <= 3) {
                      // Mostrar todos si hay 3 o menos
                      return clients.map(c => `Cliente: ${c.cliente} | Talento: ${c.talento}`);
                    } else {
                      // Si hay más de 3, mostrar solo el primero
                      const client = clients[0];
                      return [
                        `Cliente: ${client.cliente}`,
                        `Talento: ${client.talento}`,
                        `(+${clients.length - 1} más)`
                      ];
                    }
                  }
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
          ticks: {
            color: textColor,
            font: {
              size: 9,
              weight: '500'
            },
            maxRotation: 45,
            minRotation: 45
          }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
          ticks: {
            color: textColor,
            font: {
              size: 10,
              weight: '500'
            },
            callback: function(value) {
              if (value === 0) return '0';
              return value.toLocaleString('en-US');
            },
            padding: 8
          },
            beginAtZero: true,
            min: 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating chart:', error);
    console.error('Error details:', error.message, error.stack);
  }
};

let chartUpdateTimeout = null;

watch(
  () => props.data,
  (newData) => {
    // Si no hay mes seleccionado y hay datos, seleccionar el mes con más datos
    if (!selectedMonth.value && newData && newData.length > 0) {
      selectedMonth.value = getMonthWithMostData(newData);
    }
    
    if (chartUpdateTimeout) {
      clearTimeout(chartUpdateTimeout);
    }
    chartUpdateTimeout = setTimeout(() => {
      createChart();
    }, 150);
  },
  { deep: true, immediate: true }
);

watch(
  () => visibleMetrics.value,
  () => {
    if (chartUpdateTimeout) {
      clearTimeout(chartUpdateTimeout);
    }
    chartUpdateTimeout = setTimeout(() => {
      createChart();
    }, 100);
  },
  { deep: true }
);

watch(
  () => selectedMonth.value,
  () => {
    if (chartUpdateTimeout) {
      clearTimeout(chartUpdateTimeout);
    }
    chartUpdateTimeout = setTimeout(() => {
      createChart();
    }, 150);
  }
);

watch(
  () => selectedPlatform.value,
  () => {
    if (chartUpdateTimeout) {
      clearTimeout(chartUpdateTimeout);
    }
    chartUpdateTimeout = setTimeout(() => {
      createChart();
    }, 150);
  }
);

watch(
  () => props.selectedPlatformFromStore,
  (newPlatform) => {
    if (!props.staticPlatform && newPlatform) {
      selectedPlatform.value = newPlatform;
    }
  }
);

onMounted(() => {
  // Marcar como montado
  isMounted.value = true;
  
  // Inicializar métricas si aún no se han inicializado
  initializeMetrics();
  
  // Si no hay mes seleccionado, determinar el mejor mes basado en los datos
  if (!selectedMonth.value && props.data && props.data.length > 0) {
    selectedMonth.value = getMonthWithMostData(props.data);
  } else if (!selectedMonth.value) {
    selectedMonth.value = getCurrentMonthKey();
  }
  
  // Esperar a que el DOM esté completamente renderizado
  setTimeout(() => {
    createChart();
  }, 500);
});

onBeforeUnmount(() => {
  if (chartUpdateTimeout) {
    clearTimeout(chartUpdateTimeout);
  }
  if (chartInstance) {
    try {
      chartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying chart on unmount:', e);
    }
    chartInstance = null;
  }
});
</script>

<style scoped>
.chart-container {
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.chart-header {
  margin-bottom: var(--spacing-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-xl);
  flex-wrap: wrap;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.month-selector {
  margin-top: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.month-select,
.platform-select {
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.month-select:hover,
.platform-select:hover {
  border-color: var(--border-hover);
}

.month-select:focus,
.platform-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.platform-static {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
}

.platform-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.platform-value {
  color: var(--accent-primary);
  font-weight: 600;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
}

.metrics-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-buttons {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.metric-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.metric-toggle:hover {
  border-color: var(--border-hover);
  transform: scale(1.1);
}

.metric-toggle.active {
  border-color: currentColor;
}

.metric-toggle.inactive {
  opacity: 0.5;
}

.metric-toggle.inactive::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 2px;
  background: var(--text-secondary);
  transform: translate(-50%, -50%) rotate(45deg);
  transform-origin: center;
  z-index: 2;
}

.metric-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: block;
  position: relative;
  flex-shrink: 0;
}

.metric-label {
  font-size: 0.65rem;
  color: var(--text-primary);
  white-space: nowrap;
}

.metric-toggle.inactive .metric-label {
  opacity: 0.5;
  text-decoration: line-through;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;
}

.chart-wrapper canvas {
  max-width: 100%;
  height: 100% !important;
  display: block;
  position: relative;
  z-index: 1;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
}

.no-data-message p {
  margin: 0;
}

@media (max-width: 768px) {
  .chart-container {
    padding: var(--spacing-md);
  }
  
  .chart-wrapper {
    min-height: 300px;
  }

  .header-content {
    flex-direction: column;
  }

  .metrics-filter {
    width: 100%;
    min-width: auto;
  }

  .filter-buttons {
    width: 100%;
  }

  .metric-toggle {
    flex: 1;
    min-width: calc(50% - var(--spacing-xs));
    justify-content: center;
  }
}
</style>
