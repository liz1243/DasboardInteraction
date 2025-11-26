<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Timeline de FTDs vs Entregables</h3>
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
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

// Preparar datos agrupados por semana/fecha
const chartData = computed(() => {
  if (!props.data || props.data.length === 0) {
    return { labels: [], ftds: [], deliverables: [] };
  }

  // Agrupar por semana basado en la fecha
  const grouped = {};
  
  props.data.forEach(campaign => {
    const date = new Date(campaign.entregables_fecha);
    if (isNaN(date.getTime())) return;
    
    // Obtener semana del año
    const week = getWeekNumber(date);
    const weekKey = `Sem ${week}`;
    
    if (!grouped[weekKey]) {
      grouped[weekKey] = {
        ftds: 0,
        deliverables: 0
      };
    }
    
    grouped[weekKey].ftds += parseInt(campaign.FTDObtenido) || 0;
    grouped[weekKey].deliverables += 1; // Cada campaña es un entregable
  });

  const labels = Object.keys(grouped).sort();
  const ftds = labels.map(label => grouped[label].ftds);
  const deliverables = labels.map(label => grouped[label].deliverables);

  return { labels, ftds, deliverables };
});

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const createChart = () => {
  if (!chartCanvas.value) return;

  const data = chartData.value;
  
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
  const yellow = styles.getPropertyValue('--accent-primary').trim() || '#fdc600';
  const yellowRgb = styles.getPropertyValue('--accent-primary-rgb').trim() || '253, 198, 0';
  const secondary = styles.getPropertyValue('--chart-secondary').trim() || '#bfbfbf';
  const secondaryRgb = styles.getPropertyValue('--chart-secondary-rgb').trim() || '191, 191, 191';
  const silver = styles.getPropertyValue('--metallic-silver').trim() || '#c0c0c0';
  const silverRgb = styles.getPropertyValue('--metallic-silver-rgb').trim() || '192, 192, 192';
  const textColor = styles.getPropertyValue('--text-primary').trim() || '#dfe3ec';

  // Crear gradiente para barras (amarillo)
  const deliverablesGradient = ctx.createLinearGradient(0, 0, 0, 400);
  deliverablesGradient.addColorStop(0, `rgba(${yellowRgb}, 0.8)`);
  deliverablesGradient.addColorStop(1, `rgba(${yellowRgb}, 0.1)`);

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          type: 'bar',
          label: 'Entregables',
          data: data.deliverables,
          backgroundColor: deliverablesGradient,
          borderColor: silver,
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'FTDs',
          data: data.ftds,
          borderColor: yellow,
          backgroundColor: `rgba(${yellowRgb}, 0.1)`,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: yellow,
          pointBorderColor: yellow,
          pointHoverRadius: 6,
          yAxisID: 'y1'
        }
      ]
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
            font: {
              size: 12
            },
            usePointStyle: true,
            padding: 15
          }
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
              return `${context.dataset.label}: ${context.parsed.y.toLocaleString('en-US')}`;
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
            color: textColor,
            font: {
              size: 11
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: `rgba(${silverRgb}, 0.1)`,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: {
              size: 11
            },
            callback: function(value) {
              return value.toLocaleString('en-US');
            }
          },
          beginAtZero: true
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: {
              size: 11
            },
            callback: function(value) {
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
  () => props.data,
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
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.chart-header {
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.chart-wrapper {
  flex: 1;
  position: relative;
  min-height: 300px;
}

@media (max-width: 768px) {
  .chart-container {
    padding: var(--spacing-md);
  }
  
  .chart-wrapper {
    min-height: 250px;
  }
}
</style>


