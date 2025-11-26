<template>
  <div class="table-container glass-card">
    <div class="table-header">
      <h3 class="table-title">Active Campaigns</h3>
      <div class="table-actions">
        <div class="table-stats" v-if="paginatedCampaigns.length > 0">
          Showing {{ startIndex + 1 }}–{{ endIndex }} of {{ totalItems }} campaigns
        </div>
        <div class="export-buttons">
          <button @click="exportExcel" class="btn-export" type="button" title="Export to Excel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Excel
          </button>
          <button @click="exportCSV" class="btn-export" type="button" title="Export to CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            CSV
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Controls -->
    <div class="table-controls">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          v-model="localSearchQuery"
          @input="handleSearch"
          placeholder="Search by campaign, client, talent or URL..."
          class="search-input"
        />
      </div>

      <div class="sort-controls">
        <label class="sort-label">Sort by:</label>
        <select v-model="sortBy" @change="handleSort" class="select-modern">
          <option value="ftds">FTDs</option>
          <option value="progress">% Target</option>
          <option value="cpa">CPA</option>
          <option value="views">Views</option>
          <option value="fecha">Date</option>
        </select>
        <button @click="toggleSortOrder" class="btn-sort" type="button" :title="sortOrder === 'desc' ? 'Descending' : 'Ascending'">
          <svg v-if="sortOrder === 'desc'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="sortedCampaigns.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <p>No results found.</p>
    </div>

    <div v-else class="table-wrapper-scroll">
      <table class="table-modern">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Status</th>
            <th>Period</th>
            <th>Target</th>
            <th>FTDs</th>
            <th class="text-end">% Target</th>
            <th class="text-end">CPA</th>
            <th class="text-end">Views</th>
            <th class="text-end">Avg Viewers</th>
            <th class="text-end">Peak Viewers</th>
            <th class="text-end">Minutes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(campaign, index) in paginatedCampaigns" :key="`campaign-${campaign.entregables_URL || index}-${campaign.entregables_fecha || index}`">
          <tr>
            <td>
              <div class="campaign-name">{{ campaign.NombreCampana || '-' }}</div>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(campaign)]">
                {{ getStatus(campaign) }}
              </span>
            </td>
            <td>
              <span class="campaign-date">{{ formatDateRange(campaign.entregables_fecha) }}</span>
            </td>
            <td>
              <span class="metric-value">{{ formatNumber(campaign.FTDs || 0) }}</span>
            </td>
            <td>
              <span class="metric-value metric-ftds">{{ formatNumber(campaign.FTDObtenido || 0) }}</span>
            </td>
            <td class="text-end">
              <span :class="['progress-percent', getProgressClass(campaign)]">
                {{ calculateProgress(campaign) }}%
              </span>
            </td>
            <td class="text-end">
              <span class="metric-value metric-cpa">${{ calculateCPA(campaign) }}</span>
            </td>
            <td class="text-end">
              <span class="metric-value metric-views">{{ formatNumber(campaign.Views || 0) }}</span>
            </td>
            <td class="text-end">
              <span class="metric-value">{{ formatNumber(campaign['Avg Viewers'] || 0) }}</span>
            </td>
            <td class="text-end">
              <span class="metric-value">{{ formatNumber(campaign['Peak Viewers'] || 0) }}</span>
            </td>
            <td class="text-end">
              <span class="metric-value">{{ formatNumber(campaign['Minutes Watched'] || 0) }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  @click="handleViewCampaign(campaign)"
                  class="btn-details btn-campaign"
                  title="View campaign details"
                  type="button"
                >
                  View campaign →
                </button>
              </div>
            </td>
          </tr>
          <!-- Panel de detalles del entregable expandible -->
          <tr v-if="expandedIndex === index" class="details-row">
            <td colspan="12" class="details-cell">
              <DeliverableDetails 
                :deliverable="campaign" 
                :related-deliverables="getRelatedDeliverables(campaign)"
                @close="closeDetails" 
              />
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        @click="goToPage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="btn-pagination"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="goToPage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="btn-pagination"
      >
        Next
      </button>
      <select v-model.number="itemsPerPage" @change="handlePageSizeChange" class="select-modern select-page-size">
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50 </option>
        <option value="100">100 </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { exportToExcel, exportToCSV } from '@/utils/exportUtils.js';
import DeliverableDetails from './DeliverableDetails.vue';

const props = defineProps({
  campaigns: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update-search', 'view-campaign']);

const localSearchQuery = ref(props.searchQuery || '');
const sortBy = ref('ftds');
const sortOrder = ref('desc');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const expandedIndex = ref(null);

// Computed - Campañas filtradas por búsqueda
const filteredCampaigns = computed(() => {
  if (!localSearchQuery.value.trim()) {
    return props.campaigns;
  }
  
  const query = localSearchQuery.value.toLowerCase().trim();
  return props.campaigns.filter(campaign => {
    return (
      (campaign.NombreCampana && campaign.NombreCampana.toLowerCase().includes(query)) ||
      (campaign.NombreCliente && campaign.NombreCliente.toLowerCase().includes(query)) ||
      (campaign.NombreTalento && campaign.NombreTalento.toLowerCase().includes(query)) ||
      (campaign.entregables_URL && campaign.entregables_URL.toLowerCase().includes(query))
    );
  });
});

// Computed - Campañas ordenadas
const sortedCampaigns = computed(() => {
  const sorted = [...filteredCampaigns.value];
  
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy.value) {
      case 'ftds':
        aValue = parseInt(a.FTDObtenido) || 0;
        bValue = parseInt(b.FTDObtenido) || 0;
        break;
      case 'progress':
        const aTarget = parseInt(a.FTDs) || 0;
        const aObtained = parseInt(a.FTDObtenido) || 0;
        aValue = aTarget > 0 ? (aObtained / aTarget) * 100 : 0;
        
        const bTarget = parseInt(b.FTDs) || 0;
        const bObtained = parseInt(b.FTDObtenido) || 0;
        bValue = bTarget > 0 ? (bObtained / bTarget) * 100 : 0;
        break;
      case 'cpa':
        const aFtds = parseInt(a.FTDObtenido) || 0;
        const aBudget = (parseInt(a.FTDs) || 0) * 50;
        aValue = aFtds > 0 ? aBudget / aFtds : 0;
        
        const bFtds = parseInt(b.FTDObtenido) || 0;
        const bBudget = (parseInt(b.FTDs) || 0) * 50;
        bValue = bFtds > 0 ? bBudget / bFtds : 0;
        break;
      case 'views':
        aValue = parseInt(a.Views) || 0;
        bValue = parseInt(b.Views) || 0;
        break;
      case 'fecha':
        aValue = new Date(a.entregables_fecha || 0).getTime();
        bValue = new Date(b.entregables_fecha || 0).getTime();
        break;
      default:
        return 0;
    }
    
    if (sortOrder.value === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });
  
  return sorted;
});

// Computed - Paginación
const totalItems = computed(() => sortedCampaigns.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalItems.value));
const paginatedCampaigns = computed(() => {
  return sortedCampaigns.value.slice(startIndex.value, endIndex.value);
});

const formatNumber = (value) => {
  const num = parseInt(value) || 0;
  return num.toLocaleString('en-US');
};

const formatDate = (date) => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return date;
  }
};

const formatDateRange = (date) => {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return date;
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  } catch {
    return date;
  }
};

const getStatus = (campaign) => {
  // Determinar estado basado en fecha y progreso
  const progress = calculateProgress(campaign);
  if (progress >= 100) return 'Completed';
  const date = new Date(campaign.entregables_fecha);
  const now = new Date();
  if (date > now) return 'Active';
  return 'Paused';
};

const getStatusClass = (campaign) => {
  const status = getStatus(campaign);
  if (status === 'Completed') return 'status-completed';
  if (status === 'Active') return 'status-active';
  return 'status-paused';
};

const calculateProgress = (campaign) => {
  const target = parseInt(campaign.FTDs) || 0;
  const obtained = parseInt(campaign.FTDObtenido) || 0;
  if (target === 0) return 0;
  return Number(((obtained / target) * 100).toFixed(1));
};

const getProgressClass = (campaign) => {
  const progress = calculateProgress(campaign);
  if (progress >= 100) return 'progress-green';
  if (progress >= 70) return 'progress-yellow';
  return 'progress-red';
};

const calculateCPA = (campaign) => {
  const ftds = parseInt(campaign.FTDObtenido) || 0;
  // Asumiendo un presupuesto estimado basado en FTDs meta
  const estimatedBudget = (parseInt(campaign.FTDs) || 0) * 50; // $50 por FTD meta
  if (ftds === 0) return '0.00';
  return Number((estimatedBudget / ftds).toFixed(2));
};

const calculateEngagement = (campaign) => {
  const views = parseInt(campaign.Views) || 0;
  const likes = parseInt(campaign.Likes) || 0;
  const comments = parseInt(campaign.Comments) || 0;
  
  if (views === 0) return '0.00';
  
  const engagement = ((likes + comments) / views) * 100;
  return engagement.toFixed(2);
};

const truncateUrl = (url) => {
  if (!url) return '-';
  if (url.length > 40) {
    return url.substring(0, 37) + '...';
  }
  return url;
};

const handleSearch = () => {
  emit('update-search', localSearchQuery.value);
  currentPage.value = 1;
};

const handleSort = () => {
  currentPage.value = 1;
};

const setSort = (field) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  } else {
    sortBy.value = field;
    sortOrder.value = 'desc';
  }
  currentPage.value = 1;
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  currentPage.value = 1;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

const exportExcel = () => {
  exportToExcel(sortedCampaigns.value, 'campaigns');
};

const exportCSV = () => {
  exportToCSV(sortedCampaigns.value, 'campaigns');
};

watch(() => props.searchQuery, (newVal) => {
  localSearchQuery.value = newVal || '';
});

watch(() => props.campaigns, () => {
  currentPage.value = 1;
  expandedIndex.value = null;
});

const toggleDetails = (index) => {
  if (expandedIndex.value === index) {
    expandedIndex.value = null;
  } else {
    expandedIndex.value = index;
  }
};

const closeDetails = () => {
  expandedIndex.value = null;
};

const getRelatedDeliverables = (campaign) => {
  // Obtener entregables del mismo talento
  return props.campaigns.filter(c => 
    c.NombreTalento === campaign.NombreTalento &&
    c.NombreCliente === campaign.NombreCliente
  );
};

const getCampaignId = (campaign) => {
  // Generate unique key from campaign data
  return campaign.entregables_URL || `${campaign.NombreCampana}-${campaign.NombreCliente}-${campaign.entregables_fecha}`;
};

const handleViewCampaign = (campaign) => {
  emit('view-campaign', campaign);
};
</script>

<style scoped>
.table-container {
  padding: var(--spacing-xl);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.table-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.table-stats {
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding:  0.25rem 1rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
}

.export-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-export {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.25rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-export:hover {
  border-color: var(--accent-green);
  background: var(--bg-card);
  color: var(--accent-green);
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: var(--spacing-md);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 2.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 234, 255, 0.1);
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sort-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.select-modern {
  padding: var(--spacing-sm) var(--spacing-md);
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
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 234, 255, 0.1);
}

.btn-sort {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-sort:hover {
  border-color: var(--accent-cyan);
  background: var(--bg-card);
}

.empty-state {
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--text-muted);
}

.empty-state svg {
  color: var(--text-muted);
  opacity: 0.5;
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  font-size: 0.875rem;
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-lg);
}

.table-wrapper-scroll {
  max-height: 700px;
  overflow-y: auto;
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.table-wrapper-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper-scroll::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.table-wrapper-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: var(--radius-sm);
}

.table-wrapper-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan);
}

/* Ensure table content has 14px font size */
.table-modern,
.table-modern th,
.table-modern td {
  font-size: 14px;
}

.text-end {
  text-align: right;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 1.5rem !important;
}

.sortable:hover {
  background: var(--bg-tertiary);
}

.sort-indicator {
  position: absolute;
  right: var(--spacing-sm);
  color: var(--accent-cyan);
  font-weight: bold;
}

.campaign-name {
  font-weight: 500;
  color: var(--text-primary);
}

.campaign-client,
.campaign-talent {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.campaign-url {
  color: var(--accent-cyan);
  text-decoration: none;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.campaign-url:hover {
  text-decoration: underline;
  color: var(--accent-pink);
}

.campaign-date {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.metric-value {
  font-weight: 600;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.metric-views {
  color: var(--accent-cyan);
}

.metric-likes {
  color: var(--accent-pink);
}

.metric-comments {
  color: var(--accent-green);
}

.metric-engagement {
  font-weight: 600;
  color: var(--accent-green);
  font-variant-numeric: tabular-nums;
}

.metric-ftds {
  color: var(--accent-cyan);
  font-weight: 600;
}

.metric-cpa {
  color: var(--accent-pink);
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: rgba(77, 255, 145, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(77, 255, 145, 0.3);
}

.status-completed {
  background: rgba(91, 141, 239, 0.1);
  color: var(--accent-blue);
  border: 1px solid rgba(91, 141, 239, 0.3);
}

.status-paused {
  background: rgba(255, 123, 247, 0.1);
  color: var(--accent-pink);
  border: 1px solid rgba(255, 123, 247, 0.3);
}

.progress-percent {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.progress-green {
  color: var(--accent-green);
}

.progress-yellow {
  color: #ffd700;
}

.progress-red {
  color: #ff6b6b;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.btn-pagination {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-pagination:hover:not(:disabled) {
  border-color: var(--accent-cyan);
  background: var(--bg-card);
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.select-page-size {
  min-width: 140px;
}

@media (max-width: 768px) {
  .table-wrapper {
    font-size: 0.875rem;
  }

  .table-modern th,
  .table-modern td {
    padding: var(--spacing-sm);
  }

  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: 100%;
  }
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.btn-details {
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-md);
  color: var(--accent-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  text-decoration: none;
  display: inline-block;
}

.btn-details:hover {
  background: rgba(var(--accent-primary-rgb), 0.1);
  border-color: var(--accent-primary);
  transform: translateX(2px);
}

.btn-campaign {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.btn-campaign:hover {
  background: rgba(var(--accent-primary-rgb), 0.1);
  border-color: var(--accent-primary);
}

.details-row {
  background: var(--bg-tertiary);
}

.details-cell {
  padding: 0 !important;
  border-top: 2px solid var(--border-color);
}
</style>
