<template>
  <div class="filters-row" v-if="hasData">
    <div class="filters-row-container">
      <div class="filters-buttons">
        <!-- Botón Cliente -->
        <div class="filter-button-group">
          <button 
            @click="toggleDropdown('client')"
            :class="['filter-btn', { 'filter-btn-active': localFilters.client !== 'all' }]"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Cliente</span>
            <span v-if="localFilters.client !== 'all'" class="filter-badge">
              {{ localFilters.client }}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-if="activeDropdown === 'client'" class="dropdown-menu">
            <button 
              @click="selectFilter('client', 'all')"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.client === 'all' }]"
              type="button"
            >
              Todos los clientes
            </button>
            <button 
              v-for="client in availableClients" 
              :key="client"
              @click="selectFilter('client', client)"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.client === client }]"
              type="button"
            >
              {{ client }}
            </button>
          </div>
        </div>

        <!-- Botón Talento -->
        <div class="filter-button-group">
          <button 
            @click="toggleDropdown('talent')"
            :class="['filter-btn', { 'filter-btn-active': localFilters.talent !== 'all' }]"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Talento</span>
            <span v-if="localFilters.talent !== 'all'" class="filter-badge">
              {{ localFilters.talent }}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-if="activeDropdown === 'talent'" class="dropdown-menu">
            <button 
              @click="selectFilter('talent', 'all')"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.talent === 'all' }]"
              type="button"
            >
              Todos los talentos
            </button>
            <button 
              v-for="talent in availableTalents" 
              :key="talent"
              @click="selectFilter('talent', talent)"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.talent === talent }]"
              type="button"
            >
              {{ talent }}
            </button>
          </div>
        </div>

        <!-- Botón Fechas -->
        <div class="filter-button-group">
          <button 
            @click="toggleDropdown('dates')"
            :class="['filter-btn', { 'filter-btn-active': hasDateFilter }]"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Fechas</span>
            <span v-if="hasDateFilter" class="filter-badge">Filtrado</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-if="activeDropdown === 'dates'" class="dropdown-menu dropdown-menu-large">
            <div class="dropdown-dates">
              <div class="date-input-group">
                <label>Desde</label>
                <input
                  type="date"
                  v-model="localFilters.dateStart"
                  @change="updateFilters"
                  class="input-date"
                />
              </div>
              <div class="date-input-group">
                <label>Hasta</label>
                <input
                  type="date"
                  v-model="localFilters.dateEnd"
                  @change="updateFilters"
                  class="input-date"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Botón Métricas -->
        <div class="filter-button-group">
          <button 
            @click="toggleDropdown('metrics')"
            :class="['filter-btn', { 'filter-btn-active': hasMetricsFilter }]"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Métricas</span>
            <span v-if="hasMetricsFilter" class="filter-badge">Filtrado</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-if="activeDropdown === 'metrics'" class="dropdown-menu dropdown-menu-large">
            <div class="dropdown-metrics">
              <div class="metric-input-group">
                <label>Views Mín.</label>
                <input
                  type="number"
                  v-model.number="localFilters.viewsMin"
                  @input="updateFilters"
                  placeholder="Ej: 1000"
                  class="input-number"
                />
              </div>
              <div class="metric-input-group">
                <label>Likes Mín.</label>
                <input
                  type="number"
                  v-model.number="localFilters.likesMin"
                  @input="updateFilters"
                  placeholder="Ej: 50"
                  class="input-number"
                />
              </div>
              <div class="metric-input-group">
                <label>Engagement Mín. (%)</label>
                <input
                  type="number"
                  v-model.number="localFilters.engagementMin"
                  @input="updateFilters"
                  placeholder="Ej: 5"
                  step="0.1"
                  class="input-number"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Botón Limpiar -->
        <button 
          @click="clearAllFilters"
          class="filter-btn filter-btn-clear"
          type="button"
          :disabled="!hasActiveFilters"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Limpiar</span>
        </button>
      </div>
    </div>

    <!-- Overlay para cerrar dropdowns -->
    <div v-if="activeDropdown" class="dropdown-overlay" @click="closeDropdown"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  availableClients: {
    type: Array,
    default: () => []
  },
  availableTalents: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update-filters', 'clear-filters']);

const activeDropdown = ref(null);
const localFilters = ref({ ...props.filters });
const hasData = computed(() => {
  return props.availableClients.length > 0 || props.availableTalents.length > 0;
});

const hasDateFilter = computed(() => {
  return localFilters.value.dateStart || localFilters.value.dateEnd;
});

const hasMetricsFilter = computed(() => {
  return localFilters.value.viewsMin || localFilters.value.likesMin || localFilters.value.engagementMin;
});

const hasActiveFilters = computed(() => {
  return localFilters.value.client !== 'all' ||
         localFilters.value.talent !== 'all' ||
         hasDateFilter.value ||
         hasMetricsFilter.value;
});

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

const toggleDropdown = (dropdown) => {
  activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown;
};

const closeDropdown = () => {
  activeDropdown.value = null;
};

const selectFilter = (key, value) => {
  localFilters.value[key] = value;
  updateFilters();
  closeDropdown();
};

const updateFilters = () => {
  emit('update-filters', { ...localFilters.value });
};

const clearAllFilters = () => {
  localFilters.value = {
    ...localFilters.value,
    client: 'all',
    talent: 'all',
    dateStart: '',
    dateEnd: '',
    viewsMin: '',
    likesMin: '',
    engagementMin: ''
  };
  emit('clear-filters');
  closeDropdown();
};

// Cerrar dropdowns al hacer clic fuera
const handleClickOutside = (event) => {
  if (!event.target.closest('.filter-button-group')) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.filters-row {
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.filters-row-container {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.filters-buttons {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  align-items: center;
}

.filter-button-group {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.filter-btn:hover:not(:disabled) {
  background: var(--bg-card);
  border-color: var(--accent-cyan);
  color: var(--text-primary);
}

.filter-btn-active {
  background: rgba(0, 234, 255, 0.1);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.filter-btn svg:first-child {
  flex-shrink: 0;
}

.filter-btn svg:last-child {
  margin-left: var(--spacing-xs);
  transition: transform var(--transition-fast);
}

.filter-button-group:has(.dropdown-menu) .filter-btn svg:last-child {
  transform: rotate(180deg);
}

.filter-badge {
  padding: 2px 6px;
  background: var(--accent-cyan);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-btn-clear {
  background: rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
}

.filter-btn-clear:hover:not(:disabled) {
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
}

.filter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  left: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  min-width: 200px;
  max-width: 300px;
  max-height: 300px;
  overflow-y: auto;
  padding: var(--spacing-xs);
  animation: dropdownSlide 0.2s ease-out;
}

.dropdown-menu-large {
  min-width: 300px;
  max-width: 400px;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.dropdown-item-active {
  background: rgba(0, 234, 255, 0.1);
  color: var(--accent-cyan);
  font-weight: 600;
}

.dropdown-dates,
.dropdown-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
}

.date-input-group,
.metric-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.date-input-group label,
.metric-input-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-date,
.input-number {
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.input-date:focus,
.input-number:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 234, 255, 0.1);
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
  background: transparent;
}

/* Scrollbar personalizado */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--radius-sm);
}

@media (max-width: 768px) {
  .filters-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-btn {
    width: 100%;
    justify-content: space-between;
  }

  .dropdown-menu {
    position: fixed;
    left: var(--spacing-md);
    right: var(--spacing-md);
    max-width: none;
  }

  .dropdown-menu-large {
    left: var(--spacing-md);
    right: var(--spacing-md);
  }
}
</style>

