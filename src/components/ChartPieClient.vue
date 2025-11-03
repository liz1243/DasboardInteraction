<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Distribución por Cliente</h3>
      <p class="chart-subtitle">Views totales por cliente</p>
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

// Colores neón para las porciones
const neonColors = [
  'rgba(0, 234, 255, 0.8)',   // Cyan
  'rgba(255, 123, 247, 0.8)', // Pink
  'rgba(77, 255, 145, 0.8)',  // Green
  'rgba(91, 141, 239, 0.8)',  // Blue
  'rgba(255, 193, 7, 0.8)',   // Yellow
  'rgba(255, 107, 107, 0.8)', // Red
  'rgba(161, 136, 255, 0.8)', // Purple
  'rgba(255, 159, 64, 0.8)'   // Orange
];

const borderColors = [
  '#00eaff',
  '#ff7bf7',
  '#4dff91',
  '#5b8def',
  '#ffc107',
  '#ff6b6b',
  '#a188ff',
  '#ff9f40'
];

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

  // Generar colores para cada segmento
  const backgroundColors = props.labels.map((_, index) => 
    neonColors[index % neonColors.length]
  );
  
  const borderColorsArray = props.labels.map((_, index) => 
    borderColors[index % borderColors.length]
  );

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
              return `${label}: ${value.toLocaleString('es-ES')} (${percentage}%)`;
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

