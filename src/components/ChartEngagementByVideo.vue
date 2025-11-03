<template>
  <div class="chart-container glass-card">
    <div class="chart-header">
      <h3 class="chart-title">Engagement by Video</h3>
      <div class="chart-controls">
        <select v-model="topLimit" @change="updateChart" class="select-modern">
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="0">Todos</option>
        </select>
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
  videos: {
    type: Array,
    default: () => []
  }
});

const chartCanvas = ref(null);
const topLimit = ref(10);
let chartInstance = null;

const getLimitedVideos = () => {
  if (topLimit.value === 0) {
    return props.videos;
  }
  return props.videos.slice(0, parseInt(topLimit.value));
};

const createChart = () => {
  if (!chartCanvas.value) return;

  const limitedVideos = getLimitedVideos();
  
  if (!limitedVideos || limitedVideos.length === 0) {
    return;
  }

  const ctx = chartCanvas.value.getContext('2d');

  // Verificar y destruir gráfico existente en el canvas
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

  // Crear gradiente para las barras
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, `rgba(${accentRgb}, 0.8)`);
  gradient.addColorStop(1, `rgba(${accentRgb}, 0.1)`);

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      // Usar NombreCampana en el eje Y
      labels: limitedVideos.map(v => v.campaign || v.label || 'Untitled'),
      datasets: [
        {
          label: 'Engagement (%)',
          data: limitedVideos.map(v => v.engagement),
          backgroundColor: gradient,
          borderColor: accent,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      indexAxis: 'y',
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
            title: function(context) {
              const video = limitedVideos[context[0].dataIndex];
              const campaignName = video.campaign || video.label || 'Untitled';
              return campaignName.length > 50 ? 
                campaignName.substring(0, 50) + '...' : 
                campaignName;
            },
            label: function(context) {
              const video = limitedVideos[context.dataIndex];
              return [
                `Engagement: ${video.engagement}%`,
                `Views: ${video.views.toLocaleString('en-US')}`,
                `Likes: ${video.likes.toLocaleString('en-US')}`,
                `Comments: ${video.comments.toLocaleString('en-US')}`,
                video.fullLabel ? `URL: ${video.fullLabel}` : ''
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Engagement (%)',
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
            callback: function(value) {
              return value + '%';
            }
          },
          beginAtZero: true
        },
        y: {
          title: {
            display: true,
            text: 'Campaign',
            color: '#a8b0c1',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#a8b0c1',
            font: {
              size: 11
            },
            // Truncar nombres largos en el eje Y
            callback: function(value, index) {
              const video = limitedVideos[index];
              const campaignName = video.campaign || video.label || 'Untitled';
              if (campaignName.length > 30) {
                return campaignName.substring(0, 30) + '...';
              }
              return campaignName;
            }
          }
        }
      }
    }
  });
};

const updateChart = () => {
  createChart();
};

watch(
  () => props.videos,
  () => {
    setTimeout(() => {
      createChart();
    }, 50);
  },
  { deep: true, immediate: false }
);

watch(
  () => topLimit.value,
  () => {
    updateChart();
  }
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
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: var(--spacing-sm);
}

.select-modern {
  padding: 0.25rem 1rem;;
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
  border-color: var(--accent-green);
  box-shadow: 0 0 0 3px rgba(77, 255, 145, 0.1);
}

.chart-wrapper {
  flex: 1;
  position: relative;
  min-height: 400px;
}
</style>

