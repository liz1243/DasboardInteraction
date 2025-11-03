<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Métricas por Cliente</h3>
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
    <div class="chart-wrapper">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
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
  views: {
    type: Array,
    default: () => []
  },
  likes: {
    type: Array,
    default: () => []
  },
  comments: {
    type: Array,
    default: () => []
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

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

  // Crear gradientes para las barras
  const viewsGradient = ctx.createLinearGradient(0, 0, 0, 400);
  viewsGradient.addColorStop(0, 'rgba(0, 234, 255, 0.8)');
  viewsGradient.addColorStop(1, 'rgba(0, 234, 255, 0.1)');

  const likesGradient = ctx.createLinearGradient(0, 0, 0, 400);
  likesGradient.addColorStop(0, 'rgba(255, 123, 247, 0.8)');
  likesGradient.addColorStop(1, 'rgba(255, 123, 247, 0.1)');

  const commentsGradient = ctx.createLinearGradient(0, 0, 0, 400);
  commentsGradient.addColorStop(0, 'rgba(77, 255, 145, 0.8)');
  commentsGradient.addColorStop(1, 'rgba(77, 255, 145, 0.1)');

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Views',
          data: props.views,
          backgroundColor: viewsGradient,
          borderColor: '#00eaff',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Likes',
          data: props.likes,
          backgroundColor: likesGradient,
          borderColor: '#ff7bf7',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Comments',
          data: props.comments,
          backgroundColor: commentsGradient,
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
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString('es-ES')}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: false,
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#a8b0c1',
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          stacked: false,
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
  () => [props.labels, props.views, props.likes, props.comments],
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
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
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
  min-height: 350px;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .chart-legend {
    flex-wrap: wrap;
  }
}
</style>

