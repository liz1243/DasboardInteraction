<template>
  <div class="campaign-details">
    <div class="details-header">
      <div class="header-info">
        <h3 class="details-title">{{ campaign.NombreCampana || 'Campaign' }}</h3>
        <div class="header-meta">
          <span :class="['status-badge', getStatusClass(campaign)]">
            {{ getStatus(campaign) }}
          </span>
          <span class="meta-date">{{ formatDate(campaign.entregables_fecha) }}</span>
          <span class="meta-client">Client: {{ campaign.NombreCliente }}</span>
        </div>
      </div>
      <button @click="$emit('close')" class="btn-close" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- KPIs -->
    <div class="kpis-section">
      <div class="kpi-card">
        <span class="kpi-label">Campaign FTDs</span>
        <span class="kpi-value metric-cyan">{{ formatNumber(campaign.FTDObtenido || 0) }}</span>
        <span class="kpi-subtitle">of {{ formatNumber(campaign.FTDs || 0) }} target</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">CPA</span>
        <span class="kpi-value metric-pink">${{ calculateCPA(campaign) }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Deliverables</span>
        <span class="kpi-value metric-blue">{{ relatedCampaigns.length }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Talent</span>
        <span class="kpi-value">{{ campaign.NombreTalento || 'N/A' }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Best Performance</span>
        <span class="kpi-value metric-green">{{ topTalentName }}</span>
        <span class="kpi-subtitle">{{ topTalentFTDs }} FTDs</span>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="charts-section">
      <!-- Gráfico de Barras Horizontal - Top Talentos -->
      <div class="chart-card">
        <h4 class="chart-title">Top Talents by FTDs</h4>
        <div class="chart-wrapper">
          <canvas ref="barChartCanvas"></canvas>
        </div>
      </div>

      <!-- Gráfico de Torta - Distribución por Plataforma -->
      <div class="chart-card">
        <h4 class="chart-title">Platform Distribution</h4>
        <div class="chart-wrapper">
          <canvas ref="pieChartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Gráfico de Barras Apiladas - Heatmap Semanal -->
    <div class="chart-card chart-full">
      <h4 class="chart-title">Weekly Conversions Heatmap</h4>
      <div class="chart-wrapper">
        <canvas ref="heatmapChartCanvas"></canvas>
      </div>
    </div>

    <!-- Tabla de Performance -->
    <div class="table-section">
      <h4 class="section-title">Performance by Deliverable</h4>
      <div class="table-wrapper-scroll">
        <table class="details-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Fecha</th>
              <th>FTDs</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Avg Viewers</th>
              <th>Peak Viewers</th>
              <th>Minutes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(item, index) in paginatedDeliverables" :key="`deliverable-${item.entregables_URL || index}-${item.entregables_fecha || index}`">
            <tr>
              <td>
                <a 
                  v-if="item.entregables_URL" 
                  :href="item.entregables_URL" 
                  target="_blank"
                  class="table-link"
                >
                  {{ truncateTitle(item.Tituloentregable || '-') }}
                </a>
                <span v-else>{{ truncateTitle(item.Tituloentregable || '-') }}</span>
              </td>
              <td>{{ formatDateShort(item.entregables_fecha) }}</td>
              <td class="text-end">{{ formatNumber(item.FTDObtenido || 0) }}</td>
              <td class="text-end">{{ formatNumber(item.Views || 0) }}</td>
              <td class="text-end">{{ formatNumber(item.Likes || 0) }}</td>
              <td class="text-end">{{ formatNumber(item.Comments || 0) }}</td>
              <td class="text-end">{{ formatNumber(item['Avg Viewers'] || 0) }}</td>
              <td class="text-end">{{ formatNumber(item['Peak Viewers'] || 0) }}</td>
              <td class="text-end">{{ formatNumber(item['Minutes Watched'] || 0) }}</td>
              <td>
                <button 
                  @click="handleViewDeliverable(item)"
                  class="btn-details"
                  type="button"
                >
                  View details →
                </button>
              </td>
            </tr>
            </template>
          </tbody>
        </table>
      </div>
      <!-- Paginación -->
      <div class="pagination" v-if="totalDeliverablePages > 1">
        <button 
          @click="goToDeliverablePage(currentDeliverablePage - 1)" 
          :disabled="currentDeliverablePage === 1"
          class="btn-pagination"
        >
          Anterior
        </button>
        <span class="page-info">
          Página {{ currentDeliverablePage }} de {{ totalDeliverablePages }}
        </span>
        <button 
          @click="goToDeliverablePage(currentDeliverablePage + 1)" 
          :disabled="currentDeliverablePage === totalDeliverablePages"
          class="btn-pagination"
        >
          Siguiente
        </button>
        <select v-model.number="deliverablesPerPage" @change="handleDeliverablePageSizeChange" class="select-modern select-page-size">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
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
  ArcElement,
  PieController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useDashboardStore } from '@/modules/dashboard/dashboardStore.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  ArcElement,
  PieController,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  campaign: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'view-deliverable']);
const dashboardStore = useDashboardStore();

const barChartCanvas = ref(null);
const pieChartCanvas = ref(null);
const heatmapChartCanvas = ref(null);
let barChartInstance = null;
let pieChartInstance = null;
let heatmapChartInstance = null;
const currentDeliverablePage = ref(1);
const deliverablesPerPage = ref(10);

// Funciones helper
const extractPlatform = (url) => {
  if (!url) return 'Otra plataforma';
  if (url.includes('kick.com')) return 'Kick';
  if (url.includes('twitch')) return 'Twitch';
  if (url.includes('youtube')) return 'YouTube';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('tiktok')) return 'TikTok';
  return 'Otra plataforma';
};

// Obtener campañas relacionadas (misma campaña y cliente)
const relatedCampaigns = computed(() => {
  return dashboardStore.campaigns.filter(c => 
    c.NombreCampana === props.campaign.NombreCampana &&
    c.NombreCliente === props.campaign.NombreCliente
  );
});

// Top talento
const topTalentData = computed(() => {
  const talentCounts = {};
  relatedCampaigns.value.forEach(c => {
    const talent = c.NombreTalento || 'Unknown';
    if (!talentCounts[talent]) {
      talentCounts[talent] = 0;
    }
    talentCounts[talent] += parseInt(c.FTDObtenido) || 0;
  });
  
  const sorted = Object.entries(talentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return {
    labels: sorted.map(([name]) => name.split(' ')[0]),
    data: sorted.map(([, count]) => count)
  };
});

const topTalentName = computed(() => {
  return topTalentData.value.labels[0] || 'N/A';
});

const topTalentFTDs = computed(() => {
  return topTalentData.value.data[0] || 0;
});

// Datos de plataforma
const platformData = computed(() => {
  const platforms = {};
  relatedCampaigns.value.forEach(c => {
    const platform = extractPlatform(c.PlataformaTalento);
    if (!platforms[platform]) {
      platforms[platform] = 0;
    }
    platforms[platform] += 1;
  });
  
  return Object.entries(platforms).map(([name, value]) => ({ name, value }));
});

// Datos de heatmap semanal
const heatmapData = computed(() => {
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  
  // Generar datos mock basados en los FTDs de las campañas
  const baseFTDs = relatedCampaigns.value.reduce((sum, c) => sum + (parseInt(c.FTDObtenido) || 0), 0) / 4;
  
  return days.map(day => {
    const data = { day };
    weeks.forEach((week, index) => {
      data[week] = Math.floor(baseFTDs * (0.7 + Math.random() * 0.6));
    });
    return data;
  });
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


const calculateProgress = (campaign) => {
  const target = parseInt(campaign.FTDs) || 0;
  const obtained = parseInt(campaign.FTDObtenido) || 0;
  if (target === 0) return 0;
  return Number(((obtained / target) * 100).toFixed(1));
};

const getProgressClass = (campaign) => {
  const progress = calculateProgress(campaign);
  if (progress >= 100) return 'metric-green';
  if (progress >= 70) return 'metric-yellow';
  return 'metric-red';
};

const calculateCPA = (campaign) => {
  const ftds = parseInt(campaign.FTDObtenido) || 0;
  const estimatedBudget = (parseInt(campaign.FTDs) || 0) * 50;
  if (ftds === 0) return '0.00';
  return Number((estimatedBudget / ftds).toFixed(2));
};

const calculateEngagement = (campaign) => {
  const views = parseInt(campaign.Views) || 0;
  const likes = parseInt(campaign.Likes) || 0;
  const comments = parseInt(campaign.Comments) || 0;
  
  if (views === 0) return '0.00';
  
  const engagement = ((likes + comments) / views) * 100;
  return engagement.toFixed(2);
};

const getStatus = (campaign) => {
  const progress = calculateProgress(campaign);
  if (progress >= 100) return 'Completada';
  const date = new Date(campaign.entregables_fecha);
  const now = new Date();
  if (date > now) return 'Activa';
  return 'Pausada';
};

const getStatusClass = (campaign) => {
  const status = getStatus(campaign);
  if (status === 'Completada') return 'status-completed';
  if (status === 'Activa') return 'status-active';
  return 'status-paused';
};

const formatDateShort = (date) => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  } catch {
    return date;
  }
};

const truncateTitle = (title) => {
  if (!title) return '-';
  if (title.length > 40) {
    return title.substring(0, 37) + '...';
  }
  return title;
};

// Crear gráfico de barras horizontal
const createBarChart = () => {
  if (!barChartCanvas.value || topTalentData.value.labels.length === 0) return;
  
  const ctx = barChartCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const existingChart = Chart.getChart(barChartCanvas.value);
  if (existingChart) {
    try {
      existingChart.destroy();
    } catch (e) {
      console.warn('Error destroying existing bar chart:', e);
    }
  }
  if (barChartInstance) {
    try {
      barChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying bar chart instance:', e);
    }
    barChartInstance = null;
  }

  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#dfe3ec';
  const yellow = styles.getPropertyValue('--accent-primary').trim() || '#fdc600';
  const yellowRgb = styles.getPropertyValue('--accent-primary-rgb').trim() || '253, 198, 0';

  barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topTalentData.value.labels,
      datasets: [{
        label: 'FTDs',
        data: topTalentData.value.data,
        backgroundColor: yellow,
        borderColor: yellow,
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
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
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { color: textColor, font: { size: 11 } },
          beginAtZero: true
        },
        y: {
          grid: { display: false, drawBorder: false },
          ticks: { color: textColor, font: { size: 11 } }
        }
      }
    }
  });
};

// Crear gráfico de torta
const createPieChart = () => {
  if (!pieChartCanvas.value || platformData.value.length === 0) return;
  
  const ctx = pieChartCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const existingChart = Chart.getChart(pieChartCanvas.value);
  if (existingChart) {
    try {
      existingChart.destroy();
    } catch (e) {
      console.warn('Error destroying existing pie chart:', e);
    }
  }
  if (pieChartInstance) {
    try {
      pieChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying pie chart instance:', e);
    }
    pieChartInstance = null;
  }

  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#dfe3ec';
  const yellow = styles.getPropertyValue('--accent-primary').trim() || '#fdc600';
  const yellowRgb = styles.getPropertyValue('--accent-primary-rgb').trim() || '253, 198, 0';
  const secondary = styles.getPropertyValue('--chart-secondary').trim() || '#bfbfbf';
  const secondaryRgb = styles.getPropertyValue('--chart-secondary-rgb').trim() || '191, 191, 191';
  
  // Colores alternados: amarillo y gris
  const colors = [yellow, secondary, yellow, secondary];

  pieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: platformData.value.map(p => p.name),
      datasets: [{
        data: platformData.value.map(p => p.value),
        backgroundColor: colors.slice(0, platformData.value.length),
        borderColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, font: { size: 11 }, padding: 15 }
        },
        tooltip: {
          backgroundColor: 'rgba(22, 24, 29, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12
        }
      }
    }
  });
};

// Crear gráfico de heatmap
const createHeatmapChart = () => {
  if (!heatmapChartCanvas.value || heatmapData.value.length === 0) return;
  
  const ctx = heatmapChartCanvas.value.getContext('2d');
  if (!ctx) return;
  
  const existingChart = Chart.getChart(heatmapChartCanvas.value);
  if (existingChart) {
    try {
      existingChart.destroy();
    } catch (e) {
      console.warn('Error destroying existing heatmap chart:', e);
    }
  }
  if (heatmapChartInstance) {
    try {
      heatmapChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying heatmap chart instance:', e);
    }
    heatmapChartInstance = null;
  }

  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#dfe3ec';
  const yellow = styles.getPropertyValue('--accent-primary').trim() || '#fdc600';
  const yellowRgb = styles.getPropertyValue('--accent-primary-rgb').trim() || '253, 198, 0';
  const secondary = styles.getPropertyValue('--chart-secondary').trim() || '#bfbfbf';
  const secondaryRgb = styles.getPropertyValue('--chart-secondary-rgb').trim() || '191, 191, 191';
  
  // Colores alternados: amarillo y gris para las semanas
  const colors = [
    `rgba(${yellowRgb}, 0.8)`,
    `rgba(${yellowRgb}, 0.6)`,
    `rgba(${yellowRgb}, 0.4)`,
    `rgba(${yellowRgb}, 0.2)`
  ];

  heatmapChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: heatmapData.value.map(d => d.day),
      datasets: [
        { label: 'Semana 1', data: heatmapData.value.map(d => d['Sem 1']), backgroundColor: colors[0], stack: 'a' },
        { label: 'Semana 2', data: heatmapData.value.map(d => d['Sem 2']), backgroundColor: colors[1], stack: 'a' },
        { label: 'Semana 3', data: heatmapData.value.map(d => d['Sem 3']), backgroundColor: colors[2], stack: 'a' },
        { label: 'Semana 4', data: heatmapData.value.map(d => d['Sem 4']), backgroundColor: colors[3], stack: 'a' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, font: { size: 11 }, padding: 15 }
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

watch([relatedCampaigns, topTalentData, platformData, heatmapData], () => {
  setTimeout(() => {
    createBarChart();
    createPieChart();
    createHeatmapChart();
  }, 100);
}, { deep: true });

onMounted(() => {
  setTimeout(() => {
    createBarChart();
    createPieChart();
    createHeatmapChart();
  }, 200);
});

onBeforeUnmount(() => {
  if (barChartInstance) {
    try {
      barChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying bar chart on unmount:', e);
    }
    barChartInstance = null;
  }
  if (pieChartInstance) {
    try {
      pieChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying pie chart on unmount:', e);
    }
    pieChartInstance = null;
  }
  if (heatmapChartInstance) {
    try {
      heatmapChartInstance.destroy();
    } catch (e) {
      console.warn('Error destroying heatmap chart on unmount:', e);
    }
    heatmapChartInstance = null;
  }
});

const toggleDeliverableDetails = (index) => {
  if (expandedDeliverableIndex.value === index) {
    expandedDeliverableIndex.value = null;
  } else {
    expandedDeliverableIndex.value = index;
  }
};

const handleViewDeliverable = (deliverable) => {
  emit('view-deliverable', deliverable);
};

// Paginación de entregables
const totalDeliverablePages = computed(() => {
  return Math.ceil(relatedCampaigns.value.length / deliverablesPerPage.value);
});

const startDeliverableIndex = computed(() => {
  return (currentDeliverablePage.value - 1) * deliverablesPerPage.value;
});

const endDeliverableIndex = computed(() => {
  return Math.min(startDeliverableIndex.value + deliverablesPerPage.value, relatedCampaigns.value.length);
});

const paginatedDeliverables = computed(() => {
  return relatedCampaigns.value.slice(startDeliverableIndex.value, endDeliverableIndex.value);
});


const goToDeliverablePage = (page) => {
  if (page >= 1 && page <= totalDeliverablePages.value) {
    currentDeliverablePage.value = page;
  }
};

const handleDeliverablePageSizeChange = () => {
  currentDeliverablePage.value = 1;
};

watch(relatedCampaigns, () => {
  currentDeliverablePage.value = 1;
});
</script>

<style scoped>
.campaign-details {
  padding: var(--spacing-xl);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.details-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
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

.details-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.details-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.875rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
}

.detail-link {
  font-size: 0.875rem;
  color: var(--accent-cyan);
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.detail-link:hover {
  color: var(--accent-pink);
  text-decoration: underline;
}

.deliverable-title {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-number {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.metric-cyan {
  color: var(--accent-cyan);
}

.metric-green {
  color: var(--accent-green);
}

.metric-pink {
  color: var(--accent-pink);
}

.metric-blue {
  color: var(--accent-blue);
}

.metric-yellow {
  color: #ffd700;
}

.metric-red {
  color: #ff6b6b;
}

.header-info {
  flex: 1;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xs);
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: rgba(77, 255, 145, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(77, 255, 145, 0.3);
}

.status-completed {
  background: rgba(91, 141, 239, 0.1);
  color: var(--accent-blue);
  border: 1px solid rgba(91, 141, 239, 0.3);
}

.status-paused {
  background: rgba(255, 123, 247, 0.1);
  color: var(--accent-pink);
  border: 1px solid rgba(255, 123, 247, 0.3);
}

.meta-date,
.meta-client {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* KPIs Section */
.kpis-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
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
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.kpi-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.chart-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.chart-card.chart-full {
  grid-column: 1 / -1;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-full .chart-wrapper {
  height: 250px;
}

/* Table Section */
.table-section {
  margin-top: var(--spacing-2xl);
}

.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-md);
}

.table-wrapper-scroll {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.table-wrapper-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper-scroll::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.table-wrapper-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--radius-sm);
}

.table-wrapper-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan);
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.details-table thead {
  background: var(--bg-tertiary);
}

.details-table th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border-color);
}

.details-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.details-table tbody tr:hover {
  background: var(--bg-tertiary);
}

.details-table .text-end {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.table-link {
  color: var(--accent-cyan);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.table-link:hover {
  color: var(--accent-pink);
  text-decoration: underline;
}

.btn-details {
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--accent-cyan);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.btn-details:hover {
  background: rgba(0, 234, 255, 0.1);
  border-color: var(--accent-cyan);
  transform: translateX(2px);
}


.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.btn-pagination {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-pagination:hover:not(:disabled) {
  border-color: var(--accent-cyan);
  background: var(--bg-card);
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.select-modern {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.select-modern:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 234, 255, 0.1);
}

.select-page-size {
  min-width: 100px;
}

@media (max-width: 768px) {
  .campaign-details {
    padding: var(--spacing-md);
  }

  .details-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .kpis-section {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    height: 250px;
  }

  .header-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

