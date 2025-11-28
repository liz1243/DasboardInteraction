<template>
  <div class="filters-row" v-if="hasData">
    <div class="filters-row-container">
      <div class="filters-buttons">
        <!-- Botón Plataforma (Source) -->
        <div v-if="!disablePlatformFilter" class="filter-button-group">
          <button 
            @click="toggleDropdown('source')"
            :class="['filter-btn', { 'filter-btn-active': localFilters.source !== 'all' }]"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span>Platform</span>
            <span v-if="localFilters.source !== 'all'" class="filter-badge">
              {{ getPlatformLabel(localFilters.source) }}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-if="activeDropdown === 'source'" class="dropdown-menu">
            <button 
              @click="selectFilter('source', 'all')"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.source === 'all' }]"
              type="button"
            >
              All platforms
            </button>
            <button
              @click="selectFilter('source', 'youtube')"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.source === 'youtube' }]"
              type="button"
            >
              YouTube
            </button>
            <button
              @click="selectFilter('source', 'kick')"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.source === 'kick' }]"
              type="button"
            >
              Kick
            </button>
            <button
              @click="selectFilter('source', 'twitch')"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.source === 'twitch' }]"
              type="button"
            >
              Twitch
            </button>
          </div>
        </div>

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
            <span>Client</span>
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
              All clients
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
            <span>Talent</span>
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
              All talents
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
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- Overlay para cerrar dropdowns -->
    <div v-if="activeDropdown" class="dropdown-overlay" @click="closeDropdown"></div>
  </div>
</template>

<script setup>
import { useDashboardStore } from '@/modules/dashboard/dashboardStore.js';
import { getClientRoute } from '@/utils/routeHelpers.js';
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

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
  },
  disablePlatformFilter: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update-filters', 'clear-filters']);

const activeDropdown = ref(null);
const localFilters = ref({ ...props.filters });
const hasData = computed(() => {
  return props.availableClients.length > 0 || props.availableTalents.length > 0;
});

const hasActiveFilters = computed(() => {
  return localFilters.value.source !== 'all' ||
         localFilters.value.client !== 'all' ||
         localFilters.value.talent !== 'all';
});

const getPlatformLabel = (source) => {
  const labels = {
    'youtube': 'YouTube',
    'kick': 'Kick',
    'twitch': 'Twitch'
  };
  return labels[source] || source;
};

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

// Si cambia la plataforma, cliente o la lista de talentos, resetear filtros si no son válidos
watch(
  () => [props.availableTalents, localFilters.value.client, localFilters.value.source],
  (newVal, oldVal) => {
    // Si cambió la plataforma, el cliente o la lista de talentos disponibles
    const sourceChanged = oldVal && oldVal[2] !== newVal[2];
    const clientChanged = oldVal && oldVal[1] !== newVal[1];
    const talentsChanged = oldVal && oldVal[0] !== newVal[0];
    
    if (sourceChanged) {
      // Si cambió la plataforma, resetear cliente y talento
      if (localFilters.value.client !== 'all') {
        localFilters.value.client = 'all';
      }
      if (localFilters.value.talent !== 'all') {
        localFilters.value.talent = 'all';
      }
      updateFilters();
    } else if (clientChanged || talentsChanged) {
      // Si hay un talento seleccionado que no está en la nueva lista, resetearlo
      if (
        localFilters.value.talent !== 'all' &&
        !props.availableTalents.includes(localFilters.value.talent)
      ) {
        localFilters.value.talent = 'all';
        updateFilters();
      }
    }
  },
  { deep: false }
);

const toggleDropdown = (dropdown) => {
  activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown;
};

const closeDropdown = () => {
  activeDropdown.value = null;
};

const dashboardStore = useDashboardStore();

const selectFilter = async (key, value) => {
  localFilters.value[key] = value;
  
  // Si se selecciona una plataforma, resetear cliente y talento
  if (key === 'source') {
    localFilters.value.client = 'all';
    localFilters.value.talent = 'all';
    updateFilters();
    await nextTick();
  }
  // Si se selecciona un cliente, resetear el talento si no es válido para ese cliente
  else if (key === 'client') {
    // Actualizar filtros primero para que availableTalents se actualice
    updateFilters();
    
    // Esperar a que availableTalents se actualice en el siguiente tick
    await nextTick();
    if (
      localFilters.value.talent !== 'all' &&
      !props.availableTalents.includes(localFilters.value.talent)
    ) {
      localFilters.value.talent = 'all';
      updateFilters();
    }
  } else {
    updateFilters();
  }
  
  closeDropdown();
};

const updateFilters = () => {
  emit('update-filters', { ...localFilters.value });
};

const clearAllFilters = () => {
  localFilters.value = {
    ...localFilters.value,
    source: 'all',
    client: 'all',
    talent: 'all'
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
  border-color: var(--accent-primary);
  color: var(--text-primary);
}

.filter-btn-active {
  background: rgba(var(--accent-primary-rgb), 0.1);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
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
  background: var(--accent-primary);
  color: var(--color-black);
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
  text-decoration: none;
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.dropdown-item-active {
  background: rgba(var(--accent-primary-rgb), 0.1);
  color: var(--accent-primary);
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
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
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

