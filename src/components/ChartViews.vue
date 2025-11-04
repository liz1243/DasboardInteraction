<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Views by Date</h3>
      <div class="chart-controls">
        <!-- Month filter -->
        <select 
          v-model="selectedMonth" 
          @change="filterByMonth"
          class="month-filter"
        >
          <option value="all">All months</option>
          <option 
            v-for="month in availableMonths" 
            :key="month.value"
            :value="month.value"
          >
            {{ month.label }}
          </option>
        </select>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot legend-views"></span>
            <span>Views</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-likes"></span>
            <span>Likes</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-comments"></span>
            <span>Comments</span>
          </div>
        </div>
      </div>
    </div>
    <div class="chart-wrapper">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps({
  campaigns: {
    type: Array,
    default: () => []
  }
});

const chartCanvas = ref(null);
let chartInstance = null;
const selectedMonth = ref('all');

// Obtener meses disponibles
const availableMonths = computed(() => {
  const monthsSet = new Set();
  
  props.campaigns.forEach(campaign => {
    try {
      const date = new Date(campaign.entregables_fecha);
      if (!isNaN(date.getTime())) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const yearMonth = `${date.getFullYear()}-${month}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthsSet.add(JSON.stringify({ value: yearMonth, label: monthLabel }));
      }
    } catch {
      // Ignorar fechas inválidas
    }
  });

  return Array.from(monthsSet)
    .map(m => JSON.parse(m))
    .sort((a, b) => b.value.localeCompare(a.value));
});

// Filtrar campañas por mes
const filteredCampaigns = computed(() => {
  if (selectedMonth.value === 'all') {
    return props.campaigns;
  }
  
  return props.campaigns.filter(campaign => {
    try {
      const date = new Date(campaign.entregables_fecha);
      if (isNaN(date.getTime())) return false;
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const yearMonth = `${date.getFullYear()}-${month}`;
      return yearMonth === selectedMonth.value;
    } catch {
      return false;
    }
  });
});

// Preparar datos para el gráfico
const chartData = computed(() => {
  if (!filteredCampaigns.value || filteredCampaigns.value.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }

  // Ordenar por fecha
  const sorted = [...filteredCampaigns.value].sort((a, b) => {
    const dateA = new Date(a.entregables_fecha);
    const dateB = new Date(b.entregables_fecha);
    return dateA - dateB;
  });

  // Formatear fechas como dd-mm-yyyy
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  const labels = sorted.map(c => formatDate(c.entregables_fecha));
  const campaignNames = sorted.map(c => c.NombreCampana || 'Untitled');
  const views = sorted.map(c => parseInt(c.Views) || 0);
  const likes = sorted.map(c => parseInt(c.Likes) || 0);
  const comments = sorted.map(c => parseInt(c.Comments) || 0);
  const urls = sorted.map(c => c.entregables_URL || '');

  return {
    labels,
    campaignNames,
    views,
    likes,
    comments,
    urls
  };
});

const filterByMonth = () => {
  createChart();
};

const createChart = () => {
  if (!chartCanvas.value) return;

  const data = chartData.value;
  
  // Verificar si hay datos
  if (!data.labels || data.labels.length === 0) {
    return;
  }

  const ctx = chartCanvas.value.getContext('2d');

  // Verificar y destruir gráfico existente
  const existingChart = Chart.getChart(chartCanvas.value);
  if (existingChart) {
    existingChart.destroy();
  }

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Colores desde variables CSS
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--accent-primary').trim() || '#ffd60a';
  const accentRgb = styles.getPropertyValue('--accent-primary-rgb').trim() || '255, 214, 10';
  const white = styles.getPropertyValue('--color-white').trim() || '#ffffff';
  const whiteRgb = styles.getPropertyValue('--color-white-rgb').trim() || '255, 255, 255';
  const silver = styles.getPropertyValue('--metallic-silver').trim() || '#c0c0c0';
  const silverRgb = styles.getPropertyValue('--metallic-silver-rgb').trim() || '192, 192, 192';
  const likes = styles.getPropertyValue('--chart-likes').trim() || '#e6b800';
  const likesRgb = styles.getPropertyValue('--chart-likes-rgb').trim() || '230, 184, 0';
  const comments = styles.getPropertyValue('--chart-comments').trim() || '#ffd54d';
  const commentsRgb = styles.getPropertyValue('--chart-comments-rgb').trim() || '255, 213, 77';
  const textColor = styles.getPropertyValue('--chart-text').trim() || '#ffffff';

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Views',
          data: data.views,
          borderColor: accent,
          backgroundColor: `rgba(${accentRgb}, 0.1)`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: accent,
          pointBorderColor: '#000000',
          pointBorderWidth: 2
        },
        {
          label: 'Likes',
          data: data.likes,
          borderColor: likes,
          backgroundColor: `rgba(${likesRgb}, 0.1)`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: likes,
          pointBorderColor: '#000000',
          pointBorderWidth: 2
        },
        {
          label: 'Comments',
          data: data.comments,
          borderColor: comments,
          backgroundColor: `rgba(${commentsRgb}, 0.1)`,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: comments,
          pointBorderColor: '#000000',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(22, 24, 29, 0.95)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: `rgba(${silverRgb}, 0.2)`,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              const index = context[0].dataIndex;
              const campaignName = data.campaignNames[index];
              const date = context[0].label;
              return `${campaignName} - ${date}`;
            },
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString('en-US')}`;
            },
            afterBody: function(context) {
              const index = context[0].dataIndex;
              const url = data.urls[index];
              if (url) {
                return [`URL: ${url}`];
              }
              return '';
            },
            footer: function(tooltipItems) {
              // Hacer que el tooltip sea clickeable
              return '';
            }
          }
        },
      },
      hover: {
        onHover: function(event, elements) {
          const canvas = event?.native ? event.native.target : chartCanvas.value;
          if (canvas && canvas.style) {
            canvas.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
          }
        }
      },
      onClick: function(event, elements, chart) {
        if (elements && elements.length > 0) {
          const el = elements[0];
          const index = el.index;
          const url = data.urls[index];
          if (url) {
            window.open(url, '_blank');
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date (dd-mm-yyyy)',
            color: silver,
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: `rgba(${silverRgb}, 0.2)`,
            drawBorder: false
          },
          ticks: {
            color: silver,
            font: {
              size: 10
            },
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          title: {
            display: true,
            text: 'Campaign / Metrics',
            color: silver,
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: `rgba(${silverRgb}, 0.2)`,
            drawBorder: false
          },
          ticks: {
            color: silver,
            font: {
              size: 11
            },
            callback: function(value, index) {
              // Mostrar NombreCampana en el eje Y
              if (index < data.campaignNames.length) {
                const name = data.campaignNames[index];
                return name.length > 20 ? name.substring(0, 20) + '...' : name;
              }
              return value.toLocaleString('en-US');
            }
          },
          beginAtZero: true
        }
      }
    }
  });
};

watch(
  () => [props.campaigns, selectedMonth.value],
  () => {
    setTimeout(() => {
      createChart();
    }, 50);
  },
  { deep: true, immediate: false }
);

onMounted(() => {
  setTimeout(() => {
    createChart();
  }, 100);
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>

<style scoped>
.chart-container {
  padding: var(--spacing-xl);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.month-filter {
  padding: 0.25rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.month-filter:hover {
  border-color: var(--accent-cyan);
}

.month-filter:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 234, 255, 0.1);
}

.chart-legend {
  display: flex;
  gap: var(--spacing-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-views {
  background: var(--chart-views);
}

.legend-likes {
  background: var(--chart-likes);
}

.legend-comments {
  background: var(--chart-comments);
}

.chart-wrapper {
  flex: 1;
  position: relative;
  min-height: 300px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-controls {
    width: 100%;
    justify-content: space-between;
  }

  .month-filter {
    flex: 1;
  }
}
</style>

