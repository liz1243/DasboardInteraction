<template>
  <div class="filters-panel glass-card">
    <div class="filters-header">
      <h3 class="filters-title">Filters</h3>
      <button @click="clearFilters" class="btn-clear" type="button">
        Clear
      </button>
    </div>

    <div class="filters-content">
      <div class="row g-3">
        <!-- Month filter -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Month</label>
          <select 
            v-model="localFilters.month"
            @change="updateFilters"
            class="input-modern"
          >
            <option value="all">All months</option>
            <option 
              v-for="month in availableMonths" 
              :key="month.value"
              :value="month.value"
            >
              {{ month.label }}
            </option>
          </select>
        </div>

        <!-- Campaign filter -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Campaign</label>
          <select 
            v-model="localFilters.campaign"
            @change="updateFilters"
            class="input-modern"
          >
            <option value="all">All campaigns</option>
            <option 
              v-for="campaign in availableCampaigns" 
              :key="campaign"
              :value="campaign"
            >
              {{ campaign }}
            </option>
          </select>
        </div>

        <!-- Filtro Views Min -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Min Views</label>
          <input
            type="number"
            v-model.number="localFilters.viewsMin"
            @input="updateFilters"
            placeholder="e.g. 1000"
            class="input-modern"
          />
        </div>

        <!-- Filtro Views Max -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Max Views</label>
          <input
            type="number"
            v-model.number="localFilters.viewsMax"
            @input="updateFilters"
            placeholder="e.g. 50000"
            class="input-modern"
          />
        </div>

        <!-- Filtro Likes Min -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Min Likes</label>
          <input
            type="number"
            v-model.number="localFilters.likesMin"
            @input="updateFilters"
            placeholder="e.g. 50"
            class="input-modern"
          />
        </div>

        <!-- Filtro Likes Max -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Max Likes</label>
          <input
            type="number"
            v-model.number="localFilters.likesMax"
            @input="updateFilters"
            placeholder="e.g. 5000"
            class="input-modern"
          />
        </div>

        <!-- Filtro Comments Min -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Min Comments</label>
          <input
            type="number"
            v-model.number="localFilters.commentsMin"
            @input="updateFilters"
            placeholder="e.g. 10"
            class="input-modern"
          />
        </div>

        <!-- Filtro Comments Max -->
        <div class="col-md-6 col-lg-3">
          <label class="filter-label">Max Comments</label>
          <input
            type="number"
            v-model.number="localFilters.commentsMax"
            @input="updateFilters"
            placeholder="e.g. 1000"
            class="input-modern"
          />
        </div>
      </div>

      <!-- Results summary -->
      <div class="filters-summary" v-if="filteredCount !== totalCount">
        <span class="summary-text">Showing {{ filteredCount }} of {{ totalCount }} videos</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  availableMonths: {
    type: Array,
    default: () => []
  },
  availableCampaigns: {
    type: Array,
    default: () => []
  },
  filteredCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update-filters', 'clear-filters']);

const localFilters = ref({ ...props.filters });

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters };
}, { deep: true });

const updateFilters = () => {
  emit('update-filters', { ...localFilters.value });
};

const clearFilters = () => {
  localFilters.value = {
    month: 'all',
    campaign: 'all',
    viewsMin: '',
    viewsMax: '',
    likesMin: '',
    likesMax: '',
    commentsMin: '',
    commentsMax: ''
  };
  emit('clear-filters');
};
</script>

<style scoped>
.filters-panel {
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.filters-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-clear {
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-clear:hover {
  border-color: var(--accent-pink);
  color: var(--accent-pink);
  background: rgba(255, 123, 247, 0.1);
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.filter-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filters-summary {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--accent-cyan);
}

.summary-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .filters-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .btn-clear {
    width: 100%;
  }
}
</style>

