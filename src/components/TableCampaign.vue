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
            <th @click="setSort('campaign')" class="sortable">
              <span>Campaign</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'campaign'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th @click="setSort('cliente')" class="sortable">
              <span>Client</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'cliente'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th @click="setSort('fecha')" class="sortable">
              <span>Date</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'fecha'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th @click="setSort('target')" class="sortable">
              <span>Target</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'target'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th @click="setSort('ftds')" class="sortable">
              <span>FTDs</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'ftds'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th @click="setSort('progress')" class="sortable text-end">
              <span>% Target</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'progress'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th @click="setSort('tba')" class="sortable text-end">
              <span>TBA</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'tba'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <!-- Columnas de YouTube -->
            <th v-if="hasYouTubeCampaigns" @click="setSort('views')" class="sortable text-end">
              <span>Views</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'views'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th v-if="hasYouTubeCampaigns" @click="setSort('likes')" class="sortable text-end">
              <span>Likes</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'likes'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th v-if="hasYouTubeCampaigns" @click="setSort('comments')" class="sortable text-end">
              <span>Comments</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'comments'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <!-- Columnas de otras plataformas -->
            <th v-if="!hasYouTubeCampaigns" @click="setSort('avgViewers')" class="sortable text-end">
              <span>Avg Viewers</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'avgViewers'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th v-if="!hasYouTubeCampaigns" @click="setSort('peakViewers')" class="sortable text-end">
              <span>Peak Viewers</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'peakViewers'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th @click="setSort('time')" class="sortable text-end">
              <span>Time</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'time'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th v-if="!hasYouTubeCampaigns" @click="setSort('minutesWatched')" class="sortable text-end">
              <span>Minutes</span>
              <span class="sort-indicator">
                <span v-if="sortBy === 'minutesWatched'">{{ sortOrder === 'desc' ? '↓' : '↑' }}</span>
                <span v-else class="sort-indicator-inactive">↕</span>
              </span>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(campaign, index) in paginatedCampaigns" :key="`campaign-${campaign.entregables_URL || index}-${campaign.entregables_fecha || index}`">
          <tr :data-campaign-id="campaign.entregables_URL || campaign.id || index">
            <td>
              <div class="campaign-name">{{ campaign.NombreCampana || '-' }}</div>
            </td>
            <td>
              <div class="client-info">
                <div class="client-name">{{ campaign.NombreCliente || '-' }}</div>
                <div class="talent-name">{{ campaign.NombreTalento || '-' }}</div>
              </div>
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
              <span class="metric-value metric-tba">${{ calculateTBA(campaign) }}</span>
            </td>
            <!-- Columnas de YouTube -->
            <td v-if="hasYouTubeCampaigns" class="text-end">
              <span class="metric-value metric-views">{{ formatNumber(campaign.Views || 0) }}</span>
            </td>
            <td v-if="hasYouTubeCampaigns" class="text-end">
              <span class="metric-value metric-likes">{{ formatNumber(campaign.Likes || 0) }}</span>
            </td>
            <td v-if="hasYouTubeCampaigns" class="text-end">
              <span class="metric-value metric-comments">{{ formatNumber(campaign.Comments || 0) }}</span>
            </td>
            <!-- Columnas de otras plataformas -->
            <td v-if="!hasYouTubeCampaigns" class="text-end">
              <span class="metric-value">{{ formatNumber(campaign['Avg Viewers'] || 0) }}</span>
            </td>
            <td v-if="!hasYouTubeCampaigns" class="text-end">
              <span class="metric-value">{{ formatNumber(campaign['Peak Viewers'] || 0) }}</span>
            </td>
            <td class="text-end">
              <span class="metric-value">{{ formatNumber(campaign.Time || 0) }} min</span>
            </td>
            <td v-if="!hasYouTubeCampaigns" class="text-end">
              <span class="metric-value">{{ formatNumber(campaign['Minutes Watched'] || 0) }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  @click="toggleDetails(campaign)"
                  class="btn-details"
                  :class="{ active: selectedDeliverable === campaign }"
                  title="View delivery details"
                  type="button"
                >
                  {{ selectedDeliverable === campaign ? 'Hide' : 'View' }} delivery
                </button>
              </div>
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

    <!-- Delivery Details Section (outside table) -->
    <div v-if="selectedDeliverable" class="delivery-details-section" ref="deliveryDetailsRef">
      <DeliverableDetails
        :deliverable="selectedDeliverable"
        :related-deliverables="getRelatedDeliverables(selectedDeliverable)"
        @close="closeDetails"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
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

const emit = defineEmits(['update-search']);

const localSearchQuery = ref(props.searchQuery || '');
const sortBy = ref('ftds');
const sortOrder = ref('desc');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedDeliverable = ref(null);
const deliveryDetailsRef = ref(null);

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
      case 'campaign':
        aValue = (a.NombreCampana || '').toLowerCase();
        bValue = (b.NombreCampana || '').toLowerCase();
        // Para strings, usar localeCompare
        if (sortOrder.value === 'desc') {
          return bValue.localeCompare(aValue);
        } else {
          return aValue.localeCompare(bValue);
        }
      case 'cliente':
        // Ordenar por nombre de cliente, luego por talento
        const aCliente = (a.NombreCliente || '').toLowerCase();
        const bCliente = (b.NombreCliente || '').toLowerCase();
        const aTalento = (a.NombreTalento || '').toLowerCase();
        const bTalento = (b.NombreTalento || '').toLowerCase();
        if (aCliente !== bCliente) {
          return sortOrder.value === 'desc' 
            ? bCliente.localeCompare(aCliente)
            : aCliente.localeCompare(bCliente);
        }
        return sortOrder.value === 'desc'
          ? bTalento.localeCompare(aTalento)
          : aTalento.localeCompare(bTalento);
      case 'time':
        aValue = parseInt(a.Time) || 0;
        bValue = parseInt(b.Time) || 0;
        break;
      case 'target':
        aValue = parseInt(a.FTDs) || 0;
        bValue = parseInt(b.FTDs) || 0;
        break;
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
      case 'tba':
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
      case 'likes':
        aValue = parseInt(a.Likes) || 0;
        bValue = parseInt(b.Likes) || 0;
        break;
      case 'comments':
        aValue = parseInt(a.Comments) || 0;
        bValue = parseInt(b.Comments) || 0;
        break;
      case 'avgViewers':
        aValue = parseInt(a['Avg Viewers']) || 0;
        bValue = parseInt(b['Avg Viewers']) || 0;
        break;
      case 'peakViewers':
        aValue = parseInt(a['Peak Viewers']) || 0;
        bValue = parseInt(b['Peak Viewers']) || 0;
        break;
      case 'minutesWatched':
        aValue = parseInt(a['Minutes Watched']) || 0;
        bValue = parseInt(b['Minutes Watched']) || 0;
        break;
      case 'fecha':
        // Parsear fechas manualmente para evitar problemas de zona horaria
        const parseDate = (dateStr) => {
          if (!dateStr) return 0;
          const str = dateStr.toString().trim();

          // Manejo flexible de formato YYYY-MM-DD o YYYY-M-D
          const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const day = parseInt(match[3], 10);
            // Usar Date con año, mes, día directamente (sin zona horaria)
            return new Date(year, month - 1, day).getTime();
          }

          // Para otros formatos, extraer componentes manualmente
          const dateObj = new Date(str);
          if (!isNaN(dateObj.getTime())) {
            // Usar getFullYear, getMonth, getDate para evitar problemas de zona horaria
            return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
          }

          return 0;
        };
        aValue = parseDate(a.entregables_fecha);
        bValue = parseDate(b.entregables_fecha);
        break;
      default:
        return 0;
    }
    
    // Manejar comparación de números
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
    const dateStr = date.toString().trim();

    // Intentar parsear manualmente formato YYYY-MM-DD
    const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[month - 1]} ${day}, ${year}`;
    }

    // Fallback con Date object usando métodos locales
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return date;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();

    return `${monthNames[month]} ${day}, ${year}`;
  } catch {
    return date;
  }
};

const formatDateRange = (date) => {
  if (!date) return '-';
  try {
    const dateStr = date.toString().trim();

    // Regex más flexible para capturar YYYY-MM-DD o YYYY-M-D (con o sin ceros)
    const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);

      // Validar que los valores sean correctos
      if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn('[formatDateRange] Invalid date parts:', { dateStr, year, month, day });
        return dateStr;
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayStr = String(day).padStart(2, '0');
      const monthStr = monthNames[month - 1];

      const result = `${dayStr} ${monthStr}`;
      return result;
    }

    // For dates coming as Date object or complete ISO format
    // Parse manually to avoid timezone
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayStr = String(day).padStart(2, '0');
      const monthStr = monthNames[month - 1];

      return `${dayStr} ${monthStr}`;
    }

    // Last resort: use Date but forcing local timezone
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return date;

    // Use getDate(), getMonth() instead of toLocaleDateString to avoid problems
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const day = dateObj.getDate();
    const month = dateObj.getMonth();

    return `${String(day).padStart(2, '0')} ${monthNames[month]}`;
  } catch (e) {
    console.error('[formatDateRange] Error:', e, 'Input:', date);
    return date;
  }
};

const getStatus = (campaign) => {
  // Determinar estado basado en fecha y progreso
  const progress = calculateProgress(campaign);
  if (progress >= 100) return 'Completed';

  if (!campaign.entregables_fecha) return 'Paused';

  const dateStr = campaign.entregables_fecha.toString().trim();
  let date;

  // Parsear fecha manualmente para evitar problemas de zona horaria
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    // Crear fecha local (sin conversión UTC)
    date = new Date(year, month - 1, day);
  } else {
    const tempDate = new Date(dateStr);
    if (!isNaN(tempDate.getTime())) {
      // Extraer componentes para evitar zona horaria
      date = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());
    }
  }

  if (!date || isNaN(date.getTime())) return 'Paused';

  // Comparar solo fechas (sin hora) para determinar si está activa
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (date > today) return 'Active';
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

const calculateTBA = (campaign) => {
  const ftds = parseInt(campaign.FTDObtenido) || 0;
  // Asumiendo un presupuesto estimado basado en FTDs meta
  const estimatedBudget = (parseInt(campaign.FTDs) || 0) * 50; // $50 por FTD meta
  if (ftds === 0) return '0.00';
  return Number((estimatedBudget / ftds).toFixed(2));
};

// Función genérica para detectar plataforma desde URL
const getPlatformType = (url) => {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube')) return 'youtube';
  if (urlLower.includes('kick.com') || urlLower.includes('kick')) return 'streaming';
  if (urlLower.includes('twitch')) return 'streaming';
  return null;
};

// Detectar la plataforma principal (la que tiene más campañas)
const mainPlatform = computed(() => {
  if (!props.campaigns || props.campaigns.length === 0) return null;
  
  const platformCounts = {};
  props.campaigns.forEach(campaign => {
    const platform = getPlatformType(campaign.PlataformaTalento);
    if (platform) {
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    }
  });
  
  // Retornar la plataforma con más campañas
  const sorted = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
});

// Detectar si hay campañas de YouTube (para compatibilidad)
const isYouTube = (url) => {
  return url && url.toLowerCase().includes('youtube');
};

// Detectar si la plataforma principal es YouTube o streaming
const hasYouTubeCampaigns = computed(() => {
  return mainPlatform.value === 'youtube';
});

const calculateEngagement = (campaign) => {
  const views = parseInt(campaign.Views) || 0;
  
  if (views === 0) return '0.00';
  
  // Solo calcular engagement con likes/comments si es YouTube
  if (isYouTube(campaign.PlataformaTalento)) {
    const likes = parseInt(campaign.Likes) || 0;
    const comments = parseInt(campaign.Comments) || 0;
    const engagement = ((likes + comments) / views) * 100;
    return engagement.toFixed(2);
  }
  
  // Para otras plataformas, retornar 0
  return '0.00';
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
    // No hacer scroll, mantener la posición actual
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
  selectedDeliverable.value = null;
});

const toggleDetails = async (campaign) => {
  if (selectedDeliverable.value === campaign) {
    selectedDeliverable.value = null;
  } else {
    selectedDeliverable.value = campaign;
    // Esperar a que Vue renderice el componente
    await nextTick();
    // Scroll suave hacia la sección de detalles después de que se renderice
    setTimeout(() => {
      if (deliveryDetailsRef.value) {
        deliveryDetailsRef.value.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        // Ajuste adicional para que quede bien visible con un pequeño offset
        setTimeout(() => {
          const offset = 30; // Offset para mejor visualización
          const elementPosition = deliveryDetailsRef.value.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 200);
      }
    }, 200);
  }
};

const closeDetails = () => {
  selectedDeliverable.value = null;
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
  font-size: 1rem;
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
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.btn-sort:hover {
  border-color: var(--accent-cyan);
  background: var(--bg-card);
}

.sort-order-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

/* Tabla con fuente más pequeña y formato mejorado */
.table-modern {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.table-modern th {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.table-modern td {
  font-size: 0.75rem;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
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
  font-weight: bold;
  display: inline-flex;
  align-items: center;
}

.sort-indicator > span {
  color: var(--accent-primary);
}

.sort-indicator-inactive {
  opacity: 0.3;
  color: var(--text-muted);
}

.campaign-name {
  font-weight: 500;
  font-size: 0.75rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.client-name {
  font-weight: 500;
  font-size: 0.75rem;
  color: var(--text-primary);
  line-height: 1.3;
}

.talent-name {
  font-size: 0.7rem;
  color: var(--text-secondary);
  line-height: 1.3;
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
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

.metric-value {
  font-weight: 600;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
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

.metric-tba {
  color: var(--accent-pink);
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.3;
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
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
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
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.7rem;
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
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  color: var(--accent-primary);
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
  text-decoration: none;
  display: inline-block;
  line-height: 1.4;
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

/* Delivery Details Section (below table) */
.delivery-details-section {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
