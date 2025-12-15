<template>
  <div class="deliverable-details">
    <div class="details-header">
      <div class="header-info">
        <div class="header-title-section">
          <h4 class="details-title">{{ deliverable.Tituloentregable || 'Deliverable' }}</h4>
          <div class="header-badges">
            <span class="badge badge-outline">Stream</span>
            <span class="badge badge-secondary">
              {{ extractPlatform(deliverable.PlataformaTalento) }}
            </span>
          </div>
        </div>
        <div class="header-meta">
          <span class="meta-item">Talent: {{ deliverable.NombreTalento || '-' }}</span>
          <span class="meta-separator">•</span>
          <span class="meta-item">Published: {{ formatDateShort(deliverable.entregables_fecha) }}</span>
        </div>
      </div>
      <button @click="emit('close')" class="btn-close" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- KPIs -->
    <div class="kpis-section">
      <!-- Métricas de YouTube (Likes, Comments, Engagement) -->
      <template v-if="showYouTubeMetrics">
        <div class="kpi-card">
          <span class="kpi-label">Likes</span>
          <span class="kpi-value metric-pink">{{ formatNumber(deliverable.Likes || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Comments</span>
          <span class="kpi-value metric-blue">{{ formatNumber(deliverable.Comments || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Engagement Rate</span>
          <span class="kpi-value metric-green">{{ calculateEngagement(deliverable) }}%</span>
        </div>
      </template>
      <!-- Métricas de Streaming (Avg Viewers, Peak Viewers, Minutes Watched) -->
      <template v-if="showStreamingMetrics">
        <div class="kpi-card">
          <span class="kpi-label">Avg Viewers</span>
          <span class="kpi-value metric-pink">{{ formatNumber(deliverable['Avg Viewers'] || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Peak Viewers</span>
          <span class="kpi-value metric-blue">{{ formatNumber(deliverable['Peak Viewers'] || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Minutes Watched</span>
          <span class="kpi-value metric-green">{{ formatNumber(deliverable['Minutes Watched'] || 0) }}</span>
        </div>
      </template>
    </div>

    <!-- Timeline Chart with Timeframe Selector -->
    <div class="chart-card chart-full">
      <div class="chart-header">
        <h4 class="chart-title">Conversion Timeline: Clicks → Registrations → Conversions</h4>
        <div class="timeframe-selector">
          <button
            v-for="tf in timeframes"
            :key="tf.value"
            @click="selectedTimeframe = tf.value"
            :class="['timeframe-btn', { 'timeframe-btn-active': selectedTimeframe === tf.value }]"
            type="button"
          >
            {{ tf.label }}
          </button>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas ref="timelineChartCanvas"></canvas>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  deliverable: {
    type: Object,
    required: true
  },
  relatedDeliverables: {
    type: Array,
    default: () => []
  },
  source: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close']);

const timelineChartCanvas = ref(null);
const dailyChartCanvas = ref(null);
let timelineChartInstance = null;
let dailyChartInstance = null;

// Timeframes disponibles (como en trading)
const timeframes = [
  { label: '1M', value: '1m' },      // 1 minute
  { label: '5M', value: '5m' },      // 5 minutes
  { label: '15M', value: '15m' },    // 15 minutes
  { label: '30M', value: '30m' },    // 30 minutes
  { label: '1H', value: '1h' },      // 1 hour
  { label: '4H', value: '4h' },      // 4 hours
  { label: '1D', value: '1d' },      // 1 day
  { label: '1W', value: '1w' },      // 1 week
  { label: '1Mo', value: '1mo' },    // 1 month
  { label: 'All', value: 'lifetime' } // Lifetime
];

const selectedTimeframe = ref('1d'); // Default to 1 day

// Timeline data - Conversiones, Registros y Clicks generados después de la publicación
const timelineData = computed(() => {
  const publishDate = new Date(props.deliverable.entregables_fecha);
  if (isNaN(publishDate.getTime())) return [];

  const totalConversions = parseInt(props.deliverable.FTDObtenido) || 0;
  const totalRegistrations = parseInt(props.deliverable.Registros) || totalConversions * 2.5;
  const totalClicks = parseInt(props.deliverable.Clicks) || totalConversions * 10;

  // Determinar el número de puntos basado en el timeframe
  let dataPoints = 0;
  let labelPrefix = '';

  switch (selectedTimeframe.value) {
    case '1m':
      dataPoints = 60;
      labelPrefix = 'Min';
      break;
    case '5m':
      dataPoints = 48; // 4 hours
      labelPrefix = '5Min';
      break;
    case '15m':
      dataPoints = 48; // 12 hours
      labelPrefix = '15Min';
      break;
    case '30m':
      dataPoints = 48; // 24 hours
      labelPrefix = '30Min';
      break;
    case '1h':
      dataPoints = 48; // 2 days
      labelPrefix = 'Hour';
      break;
    case '4h':
      dataPoints = 42; // 1 week
      labelPrefix = '4H';
      break;
    case '1d':
      dataPoints = 30; // 30 days
      labelPrefix = 'Day';
      break;
    case '1w':
      dataPoints = 12; // 12 weeks
      labelPrefix = 'Week';
      break;
    case '1mo':
      dataPoints = 12; // 12 months
      labelPrefix = 'Month';
      break;
    case 'lifetime':
      dataPoints = 30; // 30 periods
      labelPrefix = 'Period';
      break;
    default:
      dataPoints = 15;
      labelPrefix = 'Day';
  }

  const timeline = [];
  let cumulativeConversions = 0;
  let cumulativeRegistrations = 0;
  let cumulativeClicks = 0;

  for (let i = 0; i < dataPoints; i++) {
    // Distribución exponencial decreciente para simular conversiones reales
    let conversionRate = 0;
    if (i === 0) conversionRate = 0.35;
    else if (i === 1) conversionRate = 0.25;
    else if (i === 2) conversionRate = 0.15;
    else if (i <= 7) conversionRate = 0.05 / 5;
    else conversionRate = 0.20 / (dataPoints - 8);

    const conversions = Math.floor(totalConversions * conversionRate);
    const registrations = Math.floor(totalRegistrations * conversionRate);
    const clicks = Math.floor(totalClicks * conversionRate);

    cumulativeConversions += conversions;
    cumulativeRegistrations += registrations;
    cumulativeClicks += clicks;

    timeline.push({
      label: `${labelPrefix} ${i}`,
      conversions: conversions,
      registrations: registrations,
      clicks: clicks,
      cumulativeConversions: cumulativeConversions,
      cumulativeRegistrations: cumulativeRegistrations,
      cumulativeClicks: cumulativeClicks
    });
  }

  return timeline;
});

// Daily distribution data (primeros 8 días)
const dailyData = computed(() => {
  return timelineData.value.slice(0, 8);
});

const formatNumber = (value) => {
  const num = parseInt(value) || 0;
  return num.toLocaleString('en-US');
};


const extractPlatform = (url) => {
  if (!url) return '-';
  if (url.includes('kick.com')) return 'Kick';
  if (url.includes('twitch')) return 'Twitch';
  if (url.includes('youtube')) return 'YouTube';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('tiktok')) return 'TikTok';
  return 'Other Platform';
};

// Determinar si es YouTube basándose en source o PlataformaTalento
const isYouTube = (url) => {
  // Si hay source en la ruta, usarlo como fuente de verdad
  if (props.source) {
    return props.source.toLowerCase() === 'youtube';
  }
  // Fallback a PlataformaTalento si no hay source
  return url && url.includes('youtube');
};

// Determinar si es plataforma de streaming (kick o twitch)
const isStreamingPlatform = computed(() => {
  if (props.source) {
    const sourceLower = props.source.toLowerCase();
    return sourceLower === 'kick' || sourceLower === 'twitch';
  }
  // Fallback a PlataformaTalento
  const url = props.deliverable.PlataformaTalento || '';
  return url.includes('kick.com') || url.includes('twitch');
});

// Determinar si mostrar métricas de YouTube
const showYouTubeMetrics = computed(() => {
  return isYouTube(props.deliverable.PlataformaTalento);
});

// Determinar si mostrar métricas de streaming
const showStreamingMetrics = computed(() => {
  return isStreamingPlatform.value || !showYouTubeMetrics.value;
});

const calculateEngagement = (deliverable) => {
  const views = parseInt(deliverable.Views) || 0;
  
  if (views === 0) return '0.00';
  
  // Solo calcular engagement con likes/comments si es YouTube
  if (showYouTubeMetrics.value) {
    const likes = parseInt(deliverable.Likes) || 0;
    const comments = parseInt(deliverable.Comments) || 0;
    const engagement = ((likes + comments) / views) * 100;
    return engagement.toFixed(2);
  }
  
  // Para otras plataformas, retornar 0
  return '0.00';
};


const formatDateShort = (date) => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return date;
  }
};

// Crear gráfico de timeline
const createTimelineChart = () => {
  if (!timelineChartCanvas.value || timelineData.value.length === 0) return;
  
  const ctx = timelineChartCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const existingChart = Chart.getChart(timelineChartCanvas.value);
  if (existingChart) {
    try {
      existingChart.destroy();
    } catch (e) {
      console.warn('Error destroying existing timeline chart:', e);
    }
  }
  if (timelineChartInstance) {
    try {
      timelineChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying timeline chart instance:', e);
    }
    timelineChartInstance = null;
  }

  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#dfe3ec';
  const yellow = styles.getPropertyValue('--accent-primary').trim() || '#fdc600';
  const cyan = styles.getPropertyValue('--accent-cyan').trim() || '#00eaff';
  const pink = styles.getPropertyValue('--accent-pink').trim() || '#ff6b9d';

  timelineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timelineData.value.map(d => d.label),
      datasets: [
        {
          label: 'Clicks',
          data: timelineData.value.map(d => d.clicks),
          borderColor: cyan,
          backgroundColor: cyan,
          pointBackgroundColor: cyan,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Registrations',
          data: timelineData.value.map(d => d.registrations),
          borderColor: yellow,
          backgroundColor: yellow,
          pointBackgroundColor: yellow,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Conversions',
          data: timelineData.value.map(d => d.conversions),
          borderColor: pink,
          backgroundColor: pink,
          pointBackgroundColor: pink,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor }
        },
        tooltip: {
          backgroundColor: 'rgba(22, 24, 29, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { color: textColor, font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { color: textColor, font: { size: 11 } },
          beginAtZero: true
        }
      }
    }
  });
};

// Crear gráfico de distribución diaria
const createDailyChart = () => {
  if (!dailyChartCanvas.value || dailyData.value.length === 0) return;
  
  const ctx = dailyChartCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const existingChart = Chart.getChart(dailyChartCanvas.value);
  if (existingChart) {
    try {
      existingChart.destroy();
    } catch (e) {
      console.warn('Error destroying existing daily chart:', e);
    }
  }
  if (dailyChartInstance) {
    try {
      dailyChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying daily chart instance:', e);
    }
    dailyChartInstance = null;
  }

  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#dfe3ec';
  const yellow = styles.getPropertyValue('--accent-primary').trim() || '#fdc600';

  dailyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dailyData.value.map(d => d.label),
      datasets: [{
        label: 'Conversions',
        data: dailyData.value.map(d => d.conversions),
        backgroundColor: yellow,
        borderColor: yellow,
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(22, 24, 29, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: textColor, font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { color: textColor, font: { size: 11 } },
          beginAtZero: true
        }
      }
    }
  });
};

watch([timelineData, dailyData, selectedTimeframe], () => {
  setTimeout(() => {
    createTimelineChart();
    createDailyChart();
  }, 100);
}, { deep: true });

onMounted(() => {
  setTimeout(() => {
    createTimelineChart();
    createDailyChart();
  }, 200);
});

onBeforeUnmount(() => {
  if (timelineChartInstance) {
    try {
      timelineChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying timeline chart on unmount:', e);
    }
    timelineChartInstance = null;
  }
  if (dailyChartInstance) {
    try {
      dailyChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying daily chart on unmount:', e);
    }
    dailyChartInstance = null;
  }
});
</script>

<style scoped>
.deliverable-details {
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.header-info {
  flex: 1;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-sm);
}

.details-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-badges {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-outline {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.badge-secondary {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.header-meta {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  align-items: center;
  margin-top: var(--spacing-sm);
}

.meta-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-separator {
  color: var(--text-muted);
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.kpis-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.kpi-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.kpi-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.metric-cyan,
.metric-pink,
.metric-green,
.metric-blue,
.metric-purple {
  color: var(--accent-primary);
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.chart-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.chart-card.chart-full {
  width: 100%;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.timeframe-selector {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.timeframe-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.timeframe-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.timeframe-btn-active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--color-black);
}

.match-score-info {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.match-score-text {
  font-size: 0.875rem;
  color: var(--text-primary);
  margin: 0;
}

.match-score-text strong {
  color: var(--accent-primary);
}

.content-preview {
  margin-top: var(--spacing-md);
}

.preview-placeholder {
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, var(--accent-primary) 0%, rgba(var(--accent-primary-rgb), 0.7) 100%);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: white;
}

.preview-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.preview-text {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 var(--spacing-sm) 0;
}

.preview-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0 0 var(--spacing-md) 0;
}

.preview-link {
  display: inline-block;
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: white;
  color: var(--accent-primary);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all var(--transition-base);
}

.preview-link:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.info-section {
  margin-top: var(--spacing-xl);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.info-link {
  font-size: 0.875rem;
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.info-link:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}

.engagement-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.breakdown-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.breakdown-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.breakdown-icon {
  width: 16px;
  height: 16px;
}

.breakdown-icon.icon-pink {
  color: var(--accent-primary);
}

.breakdown-icon.icon-blue {
  color: var(--accent-primary);
}

.breakdown-icon.icon-green {
  color: var(--accent-primary);
}

.breakdown-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.breakdown-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
}

@media (max-width: 768px) {
  .deliverable-details {
    padding: var(--spacing-md);
  }

  .kpis-section,
  .charts-section,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    height: 200px;
  }
}
</style>

