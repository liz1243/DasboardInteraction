<template>
  <div class="kpi-card fade-in">
    <div class="kpi-header">
      <div class="kpi-title-container">
        <h3 class="kpi-title">{{ title }}</h3>
        <div 
          v-if="tooltip" 
          class="kpi-info-icon" 
          @mouseenter="showTooltip = true"
          @mouseleave="showTooltip = false"
          @mousemove="updateTooltipPosition"
          ref="infoIconRef"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <Teleport to="body">
            <div v-if="showTooltip" class="kpi-tooltip" :style="tooltipStyle">{{ tooltip }}</div>
          </Teleport>
        </div>
      </div>
    </div>
    <div class="kpi-value-container">
      <div class="kpi-value" :class="valueClass">
        {{ formattedValue }}
      </div>
      <div class="kpi-subtitle">
        {{ subtitle }}
      </div>
    </div>
    <div class="kpi-icon" :class="iconClass">
      <slot name="icon"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  format: {
    type: String,
    default: 'number', // 'number', 'percentage', 'currency'
    validator: (value) => ['number', 'percentage', 'currency'].includes(value)
  },
  color: {
    type: String,
    default: 'cyan', // 'cyan', 'pink', 'green', 'blue'
    validator: (value) => ['cyan', 'pink', 'green', 'blue'].includes(value)
  },
  tooltip: {
    type: String,
    default: ''
  }
});

const iconClass = computed(() => `icon-${props.color}`);
const valueClass = computed(() => `value-${props.color}`);

const showTooltip = ref(false);
const tooltipStyle = ref({});
const infoIconRef = ref(null);

const updateTooltipPosition = () => {
  if (!infoIconRef.value) return;
  
  const rect = infoIconRef.value.getBoundingClientRect();
  const tooltipWidth = 220;
  const tooltipHeight = 100; // Estimado
  
  let left = rect.right + 8;
  let top = rect.top - tooltipHeight - 8;
  
  // Ajustar si se sale por la derecha
  if (rect.right + tooltipWidth + 20 > window.innerWidth) {
    left = rect.left - tooltipWidth - 8;
  }
  
  // Ajustar si se sale por arriba
  if (rect.top < tooltipHeight + 20) {
    top = rect.bottom + 8;
  }
  
  // Asegurar que no se salga por la izquierda
  if (left < 8) {
    left = 8;
  }
  
  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    position: 'fixed',
    zIndex: '10001'
  };
};

onMounted(() => {
  window.addEventListener('scroll', updateTooltipPosition, true);
  window.addEventListener('resize', updateTooltipPosition);
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateTooltipPosition, true);
  window.removeEventListener('resize', updateTooltipPosition);
});

const formattedValue = computed(() => {
  // Si el valor es un string y no es un número válido, retornarlo tal cual
  if (typeof props.value === 'string') {
    const numValue = parseFloat(props.value);
    if (isNaN(numValue)) {
      return props.value; // Retornar el string original (ej: 'N/A', nombre de talento)
    }
    // Si es un número válido como string, continuar con el formateo
    return formatNumber(numValue);
  }
  
  // Si es un número, formatearlo
  return formatNumber(props.value);
});

const formatNumber = (numValue) => {
  if (isNaN(numValue)) return '0';
  
  switch (props.format) {
    case 'percentage':
      return `${numValue.toLocaleString('en-US')}%`;
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numValue);
    default:
      return numValue.toLocaleString('en-US');
  }
};
</script>

<style scoped>
.kpi-card {
  height: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
}

.kpi-header {
  min-height: 2.4em;
  position: relative;
  z-index: 10;
  overflow: visible;
}

.kpi-title-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-xs);
  position: relative;
  overflow: visible;
}

.kpi-title {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0;
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.kpi-info-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  cursor: help;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-top: 2px;
  z-index: 20;
}

.kpi-info-icon:hover {
  color: var(--text-secondary);
}

.kpi-info-icon svg {
  width: 14px;
  height: 14px;
}

.kpi-tooltip {
  padding: 8px 12px;
  background: rgba(22, 24, 29, 0.98);
  color: var(--text-primary);
  font-size: 0.75rem;
  line-height: 1.4;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  white-space: normal;
  width: 220px;
  max-width: calc(100vw - 40px);
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
  word-wrap: break-word;
  pointer-events: none;
}

.kpi-icon {
  position: absolute;
  bottom: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  flex-shrink: 0;
  z-index: 1;
}

.kpi-icon svg {
  width: 14px;
  height: 14px;
}

/* Colores primarios: #fdc600, #bfbfbf, #ffd54d */
.icon-cyan {
  background: rgba(253, 198, 0, 0.1); /* #fdc600 con opacidad */
  color: #fdc600;
}

.icon-pink {
  background: rgba(191, 191, 191, 0.1); /* #bfbfbf con opacidad */
  color: #bfbfbf;
}

.icon-green {
  background: rgba(255, 213, 77, 0.1); /* #ffd54d con opacidad */
  color: #ffd54d;
}

.icon-blue {
  background: rgba(253, 198, 0, 0.1); /* #fdc600 con opacidad (repetir primer color) */
  color: #fdc600;
}

.kpi-value-container {
  display: flex;
  flex-direction: column;
  min-height: 2rem;
  justify-content: flex-end;
  padding-right: 28px; /* Espacio para el icono */
}

.kpi-value {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.value-cyan {
  color: var(--accent-cyan);
  text-shadow: 0 0 20px rgba(0, 234, 255, 0.3);
}

.value-pink {
  color: var(--accent-pink);
  text-shadow: 0 0 20px rgba(255, 123, 247, 0.3);
}

.value-green {
  color: var(--accent-green);
  text-shadow: 0 0 20px rgba(77, 255, 145, 0.3);
}

.value-blue {
  color: var(--accent-blue);
  text-shadow: 0 0 20px rgba(91, 141, 239, 0.3);
}

.kpi-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
  line-height: 1.3;
}
</style>

