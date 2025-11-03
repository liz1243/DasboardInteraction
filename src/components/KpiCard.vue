<template>
  <div class="kpi-card fade-in">
    <div class="kpi-header">
      <h3 class="kpi-title">{{ title }}</h3>
      <div class="kpi-icon" :class="iconClass">
        <slot name="icon"></slot>
      </div>
    </div>
    <div class="kpi-value" :class="valueClass">
      {{ formattedValue }}
    </div>
    <div class="kpi-subtitle" v-if="subtitle">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
  }
});

const iconClass = computed(() => `icon-${props.color}`);
const valueClass = computed(() => `value-${props.color}`);

const formattedValue = computed(() => {
  const numValue = typeof props.value === 'string' ? parseFloat(props.value) : props.value;
  
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
});
</script>

<style scoped>
.kpi-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.kpi-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.icon-cyan {
  background: rgba(0, 234, 255, 0.1);
  color: var(--accent-cyan);
}

.icon-pink {
  background: rgba(255, 123, 247, 0.1);
  color: var(--accent-pink);
}

.icon-green {
  background: rgba(77, 255, 145, 0.1);
  color: var(--accent-green);
}

.icon-blue {
  background: rgba(91, 141, 239, 0.1);
  color: var(--accent-blue);
}

.kpi-value {
  font-size: 2.0rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: var(--spacing-sm);
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
}
</style>

