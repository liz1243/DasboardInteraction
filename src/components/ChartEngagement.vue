<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Engagement Rate</h3>
      <div class="chart-badge">
        <span class="badge-value">{{ averageEngagement }}%</span>
        <span class="badge-label">Average</span>
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

  // Theme colors
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--accent-primary').trim() || '#fdc600';
  const accentRgb = styles.getPropertyValue('--accent-primary-rgb').trim() || '253, 198, 0';
  const secondary = styles.getPropertyValue('--chart-secondary').trim() || '#bfbfbf';
  const secondaryRgb = styles.getPropertyValue('--chart-secondary-rgb').trim() || '191, 191, 191';
  const silver = styles.getPropertyValue('--metallic-silver').trim() || '#c0c0c0';
  const silverRgb = styles.getPropertyValue('--metallic-silver-rgb').trim() || '192, 192, 192';
  const textColor = styles.getPropertyValue('--chart-text').trim() || '#ffffff';

  // Gradient for bars (yellow)
  const gradientPrimary = ctx.createLinearGradient(0, 0, 0, 400);
  gradientPrimary.addColorStop(0, `rgba(${accentRgb}, 0.8)`);
  gradientPrimary.addColorStop(1, `rgba(${accentRgb}, 0.1)`);

  // Gradient for bars (secondary gray)
  const gradientSecondary = ctx.createLinearGradient(0, 0, 0, 400);
  gradientSecondary.addColorStop(0, `rgba(${secondaryRgb}, 0.8)`);
  gradientSecondary.addColorStop(1, `rgba(${secondaryRgb}, 0.1)`);

  // Alternate colors per bar
  const bgColors = (props.engagement || []).map((_, index) => (index % 2 === 0 ? gradientPrimary : gradientSecondary));
  const borderColors = (props.engagement || []).map((_, index) => (index % 2 === 0 ? accent : secondary));

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Engagement Rate (%)',
          data: props.engagement,
          backgroundColor: bgColors,
          borderColor: borderColors,
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
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: `rgba(${silverRgb}, 0.2)`,
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
            color: silver,
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: `rgba(${silverRgb}, 0.2)`,
            drawBorder: false
          },
          ticks: {
            color: silver,
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
  color: var(--accent-primary);
  text-shadow: 0 0 10px rgba(var(--accent-primary-rgb), 0.5);
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

