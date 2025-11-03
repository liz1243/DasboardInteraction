<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Engagement Rate</h3>
      <div class="chart-badge">
        <span class="badge-value">{{ averageEngagement }}%</span>
        <span class="badge-label">Promedio</span>
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
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  labels: {
    type: Array,
    default: () => []
  },
  engagement: {
    type: Array,
    default: () => []
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

const averageEngagement = computed(() => {
  if (props.engagement.length === 0) return 0;
  const sum = props.engagement.reduce((a, b) => a + b, 0);
  return (sum / props.engagement.length).toFixed(2);
});

const createChart = () => {
  if (!chartCanvas.value) return;

  // Verificar si hay datos
  if (!props.labels || props.labels.length === 0) {
    return;
  }

  const ctx = chartCanvas.value.getContext('2d');

  // Verificar y destruir gráfico existente en el canvas
  const existingChart = Chart.getChart(chartCanvas.value);
  if (existingChart) {
    existingChart.destroy();
  }

  // Destruir instancia anterior si existe
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Gradiente para las barras
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(77, 255, 145, 0.8)');
  gradient.addColorStop(1, 'rgba(77, 255, 145, 0.1)');

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Engagement Rate (%)',
          data: props.engagement,
          backgroundColor: gradient,
          borderColor: '#4dff91',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
            label: function(context) {
              return `Engagement: ${context.parsed.y.toFixed(2)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#a8b0c1',
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#a8b0c1',
            font: {
              size: 11
            },
            callback: function(value) {
              return value + '%';
            }
          },
          beginAtZero: true
        }
      }
    }
  });
};

watch(
  () => [props.labels, props.engagement],
  () => {
    // Usar setTimeout para asegurar que el DOM está actualizado
    setTimeout(() => {
      createChart();
    }, 50);
  },
  { deep: true, immediate: false }
);

onMounted(() => {
  // Esperar a que el DOM esté completamente renderizado
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
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.chart-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.badge-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-green);
  text-shadow: 0 0 10px rgba(77, 255, 145, 0.5);
  line-height: 1;
}

.badge-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.chart-wrapper {
  flex: 1;
  position: relative;
  min-height: 300px;
}
</style>

