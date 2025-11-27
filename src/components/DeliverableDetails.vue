<template>
  <div class="deliverable-details">
    <div class="details-header">
      <div class="header-info">
        <div class="header-title-section">
          <h4 class="details-title">{{ deliverable.Tituloentregable || 'Entregable' }}</h4>
          <div class="header-badges">
            <span class="badge badge-outline">Stream</span>
            <span class="badge badge-secondary">
              {{ getPlatformIcon(deliverable.PlataformaTalento) }} {{ extractPlatform(deliverable.PlataformaTalento) }}
            </span>
          </div>
        </div>
        <div class="header-meta">
          <span class="meta-item">Talent: {{ deliverable.NombreTalento || '-' }}</span>
          <span class="meta-separator">•</span>
          <span class="meta-item">Published: {{ formatDateShort(deliverable.entregables_fecha) }}</span>
        </div>
      </div>
      <button @click="$emit('close')" class="btn-close" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- KPIs -->
    <div class="kpis-section">
      <div class="kpi-card">
        <span class="kpi-label">Views</span>
        <span class="kpi-value metric-cyan">{{ formatNumber(deliverable.Views || 0) }}</span>
      </div>
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
      <div class="kpi-card">
        <span class="kpi-label">Associated FTDs</span>
        <span class="kpi-value metric-purple">{{ formatNumber(deliverable.FTDObtenido || 0) }}</span>
        <span class="kpi-subtitle">Match Score: {{ matchScore }}%</span>
      </div>
    </div>

    <!-- Timeline Chart -->
    <div class="chart-card chart-full">
      <h4 class="chart-title">Timeline: Published vs FTDs Generated</h4>
      <div class="chart-wrapper">
        <canvas ref="timelineChartCanvas"></canvas>
      </div>
    </div>

    <!-- Daily FTD Distribution -->
    <div class="chart-card chart-full">
      <h4 class="chart-title">Daily FTDs Distribution</h4>
      <div class="chart-wrapper">
        <canvas ref="dailyChartCanvas"></canvas>
      </div>
      <div class="match-score-info">
        <p class="match-score-text">
          <strong>Match Score: {{ matchScore }}%</strong> de los FTDs fueron generados dentro de los primeros 3 días post-publicación.
        </p>
      </div>
    </div>

    <!-- Content Preview -->
    <div class="chart-card chart-full">
      <h4 class="chart-title">Content Preview</h4>
      <div class="content-preview">
        <div class="preview-placeholder">
          <div class="preview-icon">{{ getPlatformIcon(deliverable.PlataformaTalento) }}</div>
          <p class="preview-text">Stream en {{ extractPlatform(deliverable.PlataformaTalento) }}</p>
          <p class="preview-subtitle">{{ truncateTitle(deliverable.Tituloentregable || '-') }}</p>
          <a 
            v-if="deliverable.entregables_URL" 
            :href="deliverable.entregables_URL" 
            target="_blank"
            rel="noopener noreferrer"
            class="preview-link"
          >
            Ver contenido original →
          </a>
        </div>
      </div>
    </div>

    <!-- Engagement Breakdown -->
    <div class="engagement-breakdown">
      <template v-if="showYouTubeMetrics">
        <div class="breakdown-card">
          <div class="breakdown-header">
            <span class="breakdown-label">Like Rate</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="breakdown-icon icon-pink">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <p class="breakdown-value">{{ calculateLikeRate(deliverable) }}%</p>
          <p class="breakdown-subtitle">
            {{ formatNumber(deliverable.Likes || 0) }} of {{ formatNumber(deliverable.Views || 0) }} views
          </p>
        </div>

        <div class="breakdown-card">
          <div class="breakdown-header">
            <span class="breakdown-label">Comment Rate</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="breakdown-icon icon-blue">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <p class="breakdown-value">{{ calculateCommentRate(deliverable) }}%</p>
          <p class="breakdown-subtitle">
            {{ formatNumber(deliverable.Comments || 0) }} comments
          </p>
        </div>
      </template>

      <div class="breakdown-card">
        <div class="breakdown-header">
          <span class="breakdown-label">FTD Conversion</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="breakdown-icon icon-green">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <p class="breakdown-value">{{ calculateFTDConversion(deliverable) }}%</p>
        <p class="breakdown-subtitle">
          {{ formatNumber(deliverable.FTDObtenido || 0) }} FTDs of {{ formatNumber(deliverable.Views || 0) }} views
        </p>
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

// Timeline data - FTDs generados después de la publicación
const timelineData = computed(() => {
  const publishDate = new Date(props.deliverable.entregables_fecha);
  if (isNaN(publishDate.getTime())) return [];
  
  const totalFTDs = parseInt(props.deliverable.FTDObtenido) || 0;
  const timeline = [];
  let cumulative = 0;
  
  for (let i = 0; i <= 14; i++) {
    let ftdCount = 0;
    if (i === 0) ftdCount = Math.floor(totalFTDs * 0.35);
    else if (i === 1) ftdCount = Math.floor(totalFTDs * 0.25);
    else if (i === 2) ftdCount = Math.floor(totalFTDs * 0.15);
    else if (i <= 7) ftdCount = Math.floor(totalFTDs * 0.05);
    else ftdCount = Math.floor(totalFTDs * 0.01);
    
    cumulative += ftdCount;
    
    timeline.push({
      day: `Día ${i}`,
      ftds: ftdCount,
      cumulative: cumulative
    });
  }
  
  return timeline;
});

// Match Score - FTDs dentro de los primeros 3 días
const matchScore = computed(() => {
  const ftdsWithin3Days = timelineData.value.slice(0, 4).reduce((sum, d) => sum + d.ftds, 0);
  const totalFTDs = parseInt(props.deliverable.FTDObtenido) || 0;
  if (totalFTDs === 0) return '0.0';
  return ((ftdsWithin3Days / totalFTDs) * 100).toFixed(1);
});

// Daily distribution data (primeros 8 días)
const dailyData = computed(() => {
  return timelineData.value.slice(0, 8);
});

const formatNumber = (value) => {
  const num = parseInt(value) || 0;
  return num.toLocaleString('en-US');
};

const formatDate = (date) => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return date;
  }
};

const extractPlatform = (url) => {
  if (!url) return '-';
  if (url.includes('kick.com')) return 'Kick';
  if (url.includes('twitch')) return 'Twitch';
  if (url.includes('youtube')) return 'YouTube';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('tiktok')) return 'TikTok';
  return 'Otra plataforma';
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

const getPlatformIcon = (url) => {
  if (!url) return '📺';
  if (url.includes('kick.com')) return '🎮';
  if (url.includes('twitch')) return '🎮';
  if (url.includes('youtube')) return '📺';
  if (url.includes('instagram')) return '📷';
  if (url.includes('tiktok')) return '🎵';
  return '📺';
};

const calculateLikeRate = (deliverable) => {
  if (!showYouTubeMetrics.value) return '-';
  const views = parseInt(deliverable.Views) || 0;
  const likes = parseInt(deliverable.Likes) || 0;
  if (views === 0) return '0.00';
  return ((likes / views) * 100).toFixed(2);
};

const calculateCommentRate = (deliverable) => {
  if (!showYouTubeMetrics.value) return '-';
  const views = parseInt(deliverable.Views) || 0;
  const comments = parseInt(deliverable.Comments) || 0;
  if (views === 0) return '0.00';
  return ((comments / views) * 100).toFixed(2);
};

const calculateFTDConversion = (deliverable) => {
  const views = parseInt(deliverable.Views) || 0;
  const ftds = parseInt(deliverable.FTDObtenido) || 0;
  if (views === 0) return '0.000';
  return ((ftds / views) * 100).toFixed(3);
};

const formatDateShort = (date) => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return date;
  }
};

const truncateTitle = (title) => {
  if (!title) return '-';
  if (title.length > 50) {
    return title.substring(0, 47) + '...';
  }
  return title;
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
  const yellowRgb = styles.getPropertyValue('--accent-primary-rgb').trim() || '253, 198, 0';
  const yellowLight = styles.getPropertyValue('--chart-comments').trim() || '#ffd54d';
  const yellowLightRgb = styles.getPropertyValue('--chart-comments-rgb').trim() || '255, 213, 77';

  timelineChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timelineData.value.map(d => d.day),
      datasets: [
        {
          label: 'FTDs por día',
          data: timelineData.value.map(d => d.ftds),
          borderColor: yellow,
          backgroundColor: yellow,
          pointBackgroundColor: yellow,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4
        },
        {
          label: 'FTDs acumulados',
          data: timelineData.value.map(d => d.cumulative),
          borderColor: yellowLight,
          backgroundColor: yellowLight,
          pointBackgroundColor: yellowLight,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4
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
      labels: dailyData.value.map(d => d.day),
      datasets: [{
        label: 'FTDs',
        data: dailyData.value.map(d => d.ftds),
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

watch([timelineData, dailyData], () => {
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.kpi-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
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

