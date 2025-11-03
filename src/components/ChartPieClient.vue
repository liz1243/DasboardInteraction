<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Client Distribution</h3>
      <p class="chart-subtitle">Total views by client</p>
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
  ArcElement,
  PieController,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  ArcElement,
  PieController,
  Tooltip,
  Legend
);

const props = defineProps({
  labels: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

// Theme yellow shades for slices (increasing opacity per slice)
const getThemeColors = () => {
  const styles = getComputedStyle(document.documentElement);
  const accent = (styles.getPropertyValue('--accent-primary').trim() || '#fdc600');
  const accentRgb = (styles.getPropertyValue('--accent-primary-rgb').trim() || '253, 198, 0');
  return { accent, accentRgb };
};

const createChart = () => {
  if (!chartCanvas.value) return;

  // Verificar si hay datos
  if (!props.labels || props.labels.length === 0 || !props.data || props.data.length === 0) {
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

  // Generate yellow shades for each segment with increasing opacity
  const { accent, accentRgb } = getThemeColors();
  const totalSegments = props.labels.length || 1;
  const backgroundColors = props.labels.map((_, index) => {
    const t = totalSegments > 1 ? index / (totalSegments - 1) : 1; // 0..1
    const alpha = Math.min(0.9, 0.35 + t * 0.55); // 0.35 → 0.9
    return `rgba(${accentRgb}, ${alpha})`;
  });

  const borderColorsArray = props.labels.map(() => accent);

  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.data,
          backgroundColor: backgroundColors,
          borderColor: borderColorsArray,
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#dfe3ec',
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
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
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString('en-US')} (${percentage}%)`;
            }
          }
        }
      },
      interaction: {
        intersect: false
      }
    }
  });
};

watch(
  () => [props.labels, props.data],
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
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.chart-wrapper {
  flex: 1;
  position: relative;
  min-height: 300px;
}
</style>

