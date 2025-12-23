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

    <!-- KPIs Conversiones -->
    <div class="kpis-section">
      <div class="kpi-card">
        <span class="kpi-label">Clicks</span>
        <span class="kpi-value">{{ formatNumber(conversionTotals.totalClicks) }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Registros</span>
        <span class="kpi-value" >{{ formatNumber(conversionTotals.totalRegistros) }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Depósitos</span>
        <span class="kpi-value">{{ formatNumber(conversionTotals.totalDepositos) }}</span>
      </div>

      <!-- Métricas de YouTube (Views, Likes, Comments, Engagement) -->
      <template v-if="showYouTubeMetrics">
        <div class="kpi-card">
          <span class="kpi-label">Views</span>
          <span class="kpi-value">{{ formatNumber(deliverable.Views || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Likes</span>
          <span class="kpi-value" >{{ formatNumber(deliverable.Likes || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Comments</span>
          <span class="kpi-value" >{{ formatNumber(deliverable.Comments || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Engagement Rate</span>
          <span class="kpi-value" >{{ calculateEngagement(deliverable) }}%</span>
        </div>
      </template>
      <!-- Métricas de Streaming (Avg Viewers, Peak Viewers, Minutes Watched) -->
      <template v-if="showStreamingMetrics">
        <div class="kpi-card">
          <span class="kpi-label">Avg Viewers</span>
          <span class="kpi-value" >{{ formatNumber(deliverable['Avg Viewers'] || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Peak Viewers</span>
          <span class="kpi-value" >{{ formatNumber(deliverable['Peak Viewers'] || 0) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Minutes Watched</span>
          <span class="kpi-value" >{{ formatNumber(deliverable['Minutes Watched'] || 0) }}</span>
        </div>
      </template>
    </div>

    <!-- Conversion Summary -->
    <div class="conversion-summary" v-if="hasTimelineData">
      <div class="summary-card" v-if="timelineData.startTime && timelineData.endTime">
        <span class="summary-label">Período</span>
        <span class="summary-value summary-period">
          {{ formatDateShort(timelineData.startTime) }} - {{ formatDateShort(timelineData.endTime) }}
        </span>
      </div>
    </div>

    <!-- Timeline Chart with Timeframe Selector -->
    <div class="chart-card chart-full">
      <div class="chart-header">
        <h4 class="chart-title">Conversion Timeline</h4>
        <div class="timeframe-selector" v-if="hasTimelineData">
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
        <div v-if="!hasTimelineData" class="no-data-message">
          <p>No conversion timestamps available for this deliverable.</p>
          <p class="text-muted">Conversions data will appear here once available.</p>
        </div>
        <canvas v-else ref="timelineChartCanvas"></canvas>
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
let timelineChartInstance = null;

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

// Timeline data - Conversiones reales desde timestampsEntregables
const timelineData = computed(() => {
  const timestampsObj = props.deliverable.timestampsEntregables || {};
  const depositos = timestampsObj.depositos || [];
  const registros = timestampsObj.registros || [];
  const clicks = timestampsObj.clicks || [];

  console.log('=== DeliverableDetails Debug ===');
  console.log('Deliverable completo:', props.deliverable);
  console.log('Depósitos:', depositos.length);
  console.log('Registros:', registros.length);
  console.log('Clicks:', clicks.length);

  // Combinar todos los timestamps para obtener el rango completo
  const allTimestamps = [...depositos, ...registros, ...clicks];

  if (allTimestamps.length === 0) {
    console.warn('No hay timestamps disponibles para mostrar en el gráfico');
    return { clicks: [], registros: [], depositos: [], startTime: null, endTime: null };
  }

  // Ordenar timestamps por fecha
  const sortedTimestamps = [...allTimestamps].sort((a, b) => {
    return new Date(a.conv_time) - new Date(b.conv_time);
  });

  // Obtener rango de fechas
  const firstDate = new Date(sortedTimestamps[0].conv_time);
  const lastDate = new Date(sortedTimestamps[sortedTimestamps.length - 1].conv_time);

  // Determinar intervalo en milisegundos basado en el timeframe
  let intervalMs = 0;
  let labelFormat = null;

  switch (selectedTimeframe.value) {
    case '1m':
      intervalMs = 60 * 1000; // 1 minuto
      labelFormat = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      break;
    case '5m':
      intervalMs = 5 * 60 * 1000; // 5 minutos
      labelFormat = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      break;
    case '15m':
      intervalMs = 15 * 60 * 1000; // 15 minutos
      labelFormat = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      break;
    case '30m':
      intervalMs = 30 * 60 * 1000; // 30 minutos
      labelFormat = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      break;
    case '1h':
      intervalMs = 60 * 60 * 1000; // 1 hora
      labelFormat = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      break;
    case '4h':
      intervalMs = 4 * 60 * 60 * 1000; // 4 horas
      labelFormat = (date) => date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
      break;
    case '1d':
      intervalMs = 24 * 60 * 60 * 1000; // 1 día
      labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      break;
    case '1w':
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 semana
      labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      break;
    case '1mo':
      intervalMs = 30 * 24 * 60 * 60 * 1000; // 1 mes (aproximado)
      labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      break;
    case 'lifetime':
      // Para lifetime, dividir el rango total en 30 buckets
      const totalRange = lastDate - firstDate;
      intervalMs = totalRange / 30;
      labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      break;
    default:
      intervalMs = 24 * 60 * 60 * 1000;
      labelFormat = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Crear buckets de tiempo
  const buckets = new Map();
  let currentTime = new Date(Math.floor(firstDate.getTime() / intervalMs) * intervalMs);
  const endTime = new Date(Math.ceil(lastDate.getTime() / intervalMs) * intervalMs);

  // Inicializar buckets
  while (currentTime <= endTime) {
    const bucketKey = currentTime.getTime();
    buckets.set(bucketKey, {
      time: new Date(currentTime),
      clicks: 0,
      registros: 0,
      depositos: 0
    });
    currentTime = new Date(currentTime.getTime() + intervalMs);
  }

  // Función helper para asignar timestamps a buckets
  const assignToBuckets = (timestamps, type) => {
    timestamps.forEach(ts => {
      const tsDate = new Date(ts.conv_time);
      const bucketKey = Math.floor(tsDate.getTime() / intervalMs) * intervalMs;

      if (buckets.has(bucketKey)) {
        const bucket = buckets.get(bucketKey);
        bucket[type] += 1;
      }
    });
  };

  // Asignar cada tipo de timestamp a los buckets
  assignToBuckets(clicks, 'clicks');
  assignToBuckets(registros, 'registros');
  assignToBuckets(depositos, 'depositos');

  // Convertir a arrays separados
  const clicksTimeline = [];
  const registrosTimeline = [];
  const depositosTimeline = [];
  const labels = [];

  Array.from(buckets.values()).forEach(bucket => {
    labels.push(labelFormat(bucket.time));
    clicksTimeline.push(bucket.clicks);
    registrosTimeline.push(bucket.registros);
    depositosTimeline.push(bucket.depositos);
  });

  return {
    labels,
    clicks: clicksTimeline,
    registros: registrosTimeline,
    depositos: depositosTimeline,
    startTime: firstDate,
    endTime: lastDate
  };
});

// Helper para verificar si hay datos
const hasTimelineData = computed(() => {
  const data = timelineData.value;
  return data.labels && data.labels.length > 0;
});

// Calcular totales de conversiones desde timestampsEntregables
const conversionTotals = computed(() => {
  const timestampsObj = props.deliverable.timestampsEntregables || {};
  const depositos = timestampsObj.depositos || [];
  const registros = timestampsObj.registros || [];
  const clicks = timestampsObj.clicks || [];

  return {
    totalClicks: clicks.length,
    totalRegistros: registros.length,
    totalDepositos: depositos.length
  };
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
  if (!timelineChartCanvas.value || !hasTimelineData.value) return;

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

  // Datasets base (conversiones)
  const datasets = [
    {
      label: 'Clicks',
      data: timelineData.value.clicks,
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
      tension: 0.4,
      borderWidth: 2
    },
    {
      label: 'Registros',
      data: timelineData.value.registros,
      borderColor: '#fdc600',
      backgroundColor: '#fdc600',
      pointBackgroundColor: '#fdc600',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
      tension: 0.4,
      borderWidth: 2
    },
    {
      label: 'Depósitos',
      data: timelineData.value.depositos,
      borderColor: '#10b981',
      backgroundColor: '#10b981',
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
      tension: 0.4,
      borderWidth: 2,
      yAxisID: 'y'
    }
  ];

  // Añadir métricas adicionales según plataforma
  // Crear un array con el valor fijo para cada punto en el timeline
  const labelsCount = timelineData.value.labels.length;

  if (showYouTubeMetrics.value) {
    // YouTube: Views, Likes, Comments
    const views = parseInt(props.deliverable.Views) || 0;
    const likes = parseInt(props.deliverable.Likes) || 0;
    const comments = parseInt(props.deliverable.Comments) || 0;

    if (views > 0) {
      datasets.push({
        label: 'Views',
        data: Array(labelsCount).fill(views),
        borderColor: '#0D21A1',
        backgroundColor: '#0D21A1',
        pointBackgroundColor: '#0D21A1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'y1'
      });
    }

    if (likes > 0) {
      datasets.push({
        label: 'Likes',
        data: Array(labelsCount).fill(likes),
        borderColor: '#F7F4F3',
        backgroundColor: '#F7F4F3',
        pointBackgroundColor: '#F7F4F3',
        pointBorderColor: '#000',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'y1'
      });
    }

    if (comments > 0) {
      datasets.push({
        label: 'Comments',
        data: Array(labelsCount).fill(comments),
        borderColor: '#1a5f3f',
        backgroundColor: '#1a5f3f',
        pointBackgroundColor: '#1a5f3f',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'y1'
      });
    }
  } else if (showStreamingMetrics.value) {
    // Streaming: Avg Viewers, Peak Viewers, Minutes Watched
    const avgViewers = parseFloat(props.deliverable['Avg Viewers']) || 0;
    const peakViewers = parseInt(props.deliverable['Peak Viewers']) || 0;
    const minutesWatched = parseInt(props.deliverable['Minutes Watched']) || 0;

    if (avgViewers > 0) {
      datasets.push({
        label: 'Avg Viewers',
        data: Array(labelsCount).fill(avgViewers),
        borderColor: '#0D21A1',
        backgroundColor: '#0D21A1',
        pointBackgroundColor: '#0D21A1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'y1'
      });
    }

    if (peakViewers > 0) {
      datasets.push({
        label: 'Peak Viewers',
        data: Array(labelsCount).fill(peakViewers),
        borderColor: '#F7F4F3',
        backgroundColor: '#F7F4F3',
        pointBackgroundColor: '#F7F4F3',
        pointBorderColor: '#000',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'y1'
      });
    }

    if (minutesWatched > 0) {
      datasets.push({
        label: 'Minutes Watched',
        data: Array(labelsCount).fill(minutesWatched),
        borderColor: '#26a69a',
        backgroundColor: '#26a69a',
        pointBackgroundColor: '#26a69a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        yAxisID: 'y1'
      });
    }
  }

  timelineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timelineData.value.labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: textColor,
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(22, 24, 29, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString('en-US')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 10 },
            precision: 0
          },
          beginAtZero: true,
          title: {
            display: true,
            text: 'Conversions',
            color: textColor,
            font: { size: 11 }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false, drawBorder: false },
          ticks: {
            color: textColor,
            font: { size: 10 },
            precision: 0,
            callback: function(value) {
              return value.toLocaleString('en-US');
            }
          },
          beginAtZero: true,
          title: {
            display: true,
            text: 'Metrics',
            color: textColor,
            font: { size: 11 }
          }
        }
      }
    }
  });
};

watch([timelineData, selectedTimeframe], () => {
  setTimeout(() => {
    createTimelineChart();
  }, 100);
}, { deep: true });

onMounted(() => {
  setTimeout(() => {
    createTimelineChart();
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.conversion-summary {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  flex: 1;
  min-width: 200px;
}

.summary-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.summary-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.summary-period {
  color: var(--accent-primary);
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

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-secondary);
}

.no-data-message p {
  margin: var(--spacing-sm) 0;
}

.no-data-message .text-muted {
  font-size: 0.875rem;
  color: var(--text-muted);
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

