<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Views por Fecha</h3>
      <div class="chart-controls">
        <!-- Filtro por Mes -->
        <select 
          v-model="selectedMonth" 
          @change="filterByMonth"
          class="month-filter"
        >
          <option value="all">Todos los meses</option>
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
        const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
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
  const campaignNames = sorted.map(c => c.NombreCampana || 'Sin nombre');
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

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Views',
          data: data.views,
          borderColor: '#00eaff',
          backgroundColor: 'rgba(0, 234, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#00eaff',
          pointBorderColor: '#0e0f12',
          pointBorderWidth: 2
        },
        {
          label: 'Likes',
          data: data.likes,
          borderColor: '#ff7bf7',
          backgroundColor: 'rgba(255, 123, 247, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ff7bf7',
          pointBorderColor: '#0e0f12',
          pointBorderWidth: 2
        },
        {
          label: 'Comments',
          data: data.comments,
          borderColor: '#4dff91',
          backgroundColor: 'rgba(77, 255, 145, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#4dff91',
          pointBorderColor: '#0e0f12',
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
          titleColor: '#dfe3ec',
          bodyColor: '#dfe3ec',
          borderColor: 'rgba(255, 255, 255, 0.1)',
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
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString('es-ES')}`;
            },
            afterBody: function(context) {
              const index = context[0].dataIndex;
              const url = data.urls[index];
              if (url) {
                return [`URL: ${url}`, '(Clic para abrir)'];
              }
              return '';
            },
            footer: function(tooltipItems) {
              // Hacer que el tooltip sea clickeable
              return '';
            }
          }
        },
        onClick: function(event, elements) {
          if (elements.length > 0) {
            const element = elements[0];
            const index = element.index;
            const url = data.urls[index];
            if (url) {
              window.open(url, '_blank');
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Fecha (dd-mm-yyyy)',
            color: '#a8b0c1',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#a8b0c1',
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
            text: 'Campaña / Métricas',
            color: '#a8b0c1',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#a8b0c1',
            font: {
              size: 11
            },
            callback: function(value, index) {
              // Mostrar NombreCampana en el eje Y
              if (index < data.campaignNames.length) {
                const name = data.campaignNames[index];
                return name.length > 20 ? name.substring(0, 20) + '...' : name;
              }
              return value.toLocaleString('es-ES');
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
  padding: var(--spacing-xs) var(--spacing-md);
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
  background: var(--accent-cyan);
  box-shadow: 0 0 8px rgba(0, 234, 255, 0.5);
}

.legend-likes {
  background: var(--accent-pink);
  box-shadow: 0 0 8px rgba(255, 123, 247, 0.5);
}

.legend-comments {
  background: var(--accent-green);
  box-shadow: 0 0 8px rgba(77, 255, 145, 0.5);
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

