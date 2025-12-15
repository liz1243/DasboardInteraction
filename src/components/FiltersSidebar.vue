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

        <!-- Botón Campaña -->
        <div class="filter-button-group">
          <button
            @click="toggleDropdown('campaign')"
            :class="['filter-btn', { 'filter-btn-active': localFilters.campaign !== 'all' }]"
            :disabled="localFilters.client === 'all'"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Campaign</span>
            <span v-if="localFilters.campaign !== 'all'" class="filter-badge">
              {{ localFilters.campaign }}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-if="activeDropdown === 'campaign'" class="dropdown-menu">
            <button
              @click="selectFilter('campaign', 'all')"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.campaign === 'all' }]"
              type="button"
            >
              All campaigns
            </button>
            <button
              v-for="campaign in availableCampaigns"
              :key="campaign"
              @click="selectFilter('campaign', campaign)"
              :class="['dropdown-item', { 'dropdown-item-active': localFilters.campaign === campaign }]"
              type="button"
            >
              {{ campaign }}
            </button>
          </div>
        </div>

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

        <!-- Botón Fecha -->
        <div class="filter-button-group">
          <button 
            @click="toggleDropdown('date')"
            :class="['filter-btn', { 'filter-btn-active': hasDateFilters }]"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Date Range</span>
            <span v-if="hasDateFilters" class="filter-badge">
              {{ formatDateRange() }}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div v-if="activeDropdown === 'date'" class="dropdown-menu dropdown-menu-large">
            <div class="dropdown-dates">
              <div class="date-input-group">
                <label for="date-start">Start Date</label>
                <div class="date-input-wrapper">
                  <svg class="calendar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <input
                    id="date-start"
                    type="date"
                    class="input-date"
                    :value="localFilters.dateStart || ''"
                    @change="updateDateFilter('dateStart', $event.target.value)"
                    placeholder="Select start date"
                  />
                </div>
              </div>
              <div class="date-input-group">
                <label for="date-end">End Date</label>
                <div class="date-input-wrapper">
                  <svg class="calendar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <input
                    id="date-end"
                    type="date"
                    class="input-date"
                    :value="localFilters.dateEnd || ''"
                    @change="updateDateFilter('dateEnd', $event.target.value)"
                    :min="localFilters.dateStart || ''"
                    placeholder="Select end date"
                  />
                </div>
              </div>
              <button
                v-if="hasDateFilters"
                @click="clearDateFilters"
                class="dropdown-item clear-dates-btn"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear dates
              </button>
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
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- Overlay para cerrar dropdowns -->
    <div v-if="activeDropdown" class="dropdown-overlay" @click="closeDropdown"></div>
  </div>
</template>

<script setup>
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
  availableCampaigns: {
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
const localFilters = ref({ 
  dateStart: null,
  dateEnd: null,
  ...props.filters 
});
const hasData = computed(() => {
  return props.availableClients.length > 0 || props.availableTalents.length > 0;
});

const hasActiveFilters = computed(() => {
  return localFilters.value.client !== 'all' ||
         localFilters.value.campaign !== 'all' ||
         localFilters.value.source !== 'all' ||
         localFilters.value.talent !== 'all' ||
         hasDateFilters.value;
});

const hasDateFilters = computed(() => {
  return !!(localFilters.value.dateStart || localFilters.value.dateEnd);
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
  localFilters.value = { 
    dateStart: null,
    dateEnd: null,
    ...newFilters 
  };
}, { deep: true });

// Si cambian los filtros o las listas disponibles, resetear filtros inválidos
watch(
  () => [props.availableTalents, props.availableCampaigns, localFilters.value.client, localFilters.value.campaign],
  (newVal, oldVal) => {
    if (!oldVal) return;

    const clientChanged = oldVal[2] !== newVal[2];
    const campaignChanged = oldVal[3] !== newVal[3];

    if (clientChanged) {
      // Si cambió el cliente, resetear campaign si no está en la nueva lista
      if (
        localFilters.value.campaign !== 'all' &&
        !props.availableCampaigns.includes(localFilters.value.campaign)
      ) {
        localFilters.value.campaign = 'all';
        updateFilters();
      }
    }

    if (campaignChanged) {
      // Si cambió la campaña, resetear talent si no está en la nueva lista
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

const selectFilter = async (key, value) => {
  localFilters.value[key] = value;

  // Cascada de filtros según el orden: Cliente -> Campaña -> Plataforma -> Talento
  if (key === 'client') {
    // Si se selecciona un cliente, resetear campaign, source y talent
    localFilters.value.campaign = 'all';
    localFilters.value.source = 'all';
    localFilters.value.talent = 'all';
    updateFilters();
    await nextTick();
  } else if (key === 'campaign') {
    // Si se selecciona una campaña, resetear source y talent
    localFilters.value.source = 'all';
    localFilters.value.talent = 'all';
    updateFilters();
    await nextTick();
  } else if (key === 'source') {
    // Si se selecciona una plataforma, resetear talent
    localFilters.value.talent = 'all';
    updateFilters();
    await nextTick();
  } else {
    updateFilters();
  }

  closeDropdown();
};

const updateFilters = () => {
  emit('update-filters', { ...localFilters.value });
};

const updateDateFilter = (key, value) => {
  localFilters.value[key] = value || null;
  
  // Validar que la fecha de fin sea mayor o igual a la de inicio
  if (key === 'dateStart' && localFilters.value.dateEnd) {
    if (localFilters.value.dateEnd < value) {
      localFilters.value.dateEnd = null;
    }
  }
  
  // Cerrar el dropdown después de actualizar
  closeDropdown();
  
  // Emitir actualización de filtros para refrescar todo
  updateFilters();
};

const clearDateFilters = () => {
  localFilters.value.dateStart = null;
  localFilters.value.dateEnd = null;
  updateFilters();
};

const formatDateRange = () => {
  if (!localFilters.value.dateStart && !localFilters.value.dateEnd) {
    return '';
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  if (localFilters.value.dateStart && localFilters.value.dateEnd) {
    return `${formatDate(localFilters.value.dateStart)} - ${formatDate(localFilters.value.dateEnd)}`;
  } else if (localFilters.value.dateStart) {
    return `Desde ${formatDate(localFilters.value.dateStart)}`;
  } else if (localFilters.value.dateEnd) {
    return `Hasta ${formatDate(localFilters.value.dateEnd)}`;
  }
  return '';
};

const clearAllFilters = () => {
  localFilters.value = {
    ...localFilters.value,
    client: 'all',
    campaign: 'all',
    source: 'all',
    talent: 'all',
    dateStart: null,
    dateEnd: null
  };
  emit('clear-filters');
  closeDropdown();
};

// Cerrar dropdowns al hacer clic fuera
const handleClickOutside = (event) => {
  // No cerrar si se hace clic dentro del dropdown de fechas o en los inputs
  if (event.target.closest('.dropdown-menu') || event.target.closest('.input-date')) {
    return;
  }
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

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.calendar-icon {
  position: absolute;
  left: var(--spacing-sm);
  color: var(--text-secondary);
  pointer-events: none;
  z-index: 1;
  transition: color var(--transition-fast);
}

.date-input-wrapper:hover .calendar-icon {
  color: var(--accent-primary);
}

.input-date,
.input-number {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 40px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.input-date:hover {
  border-color: var(--accent-primary);
  background: var(--bg-card);
}

.input-date:focus,
.input-number:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
  background: var(--bg-card);
}

.input-date::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.input-date::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.clear-dates-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  justify-content: center;
  margin-top: var(--spacing-xs);
  background: rgba(255, 107, 107, 0.1) !important;
  border: 1px solid rgba(255, 107, 107, 0.3) !important;
  color: #ff6b6b !important;
  font-weight: 500;
}

.clear-dates-btn:hover {
  background: rgba(255, 107, 107, 0.2) !important;
  border-color: #ff6b6b !important;
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

