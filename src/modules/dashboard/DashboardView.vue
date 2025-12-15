<template>
  <div class="dashboard-view" :key="refreshKey">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="dashboard-title">Analytics Dashboard</h1>
        </div>
      </div>
    </div>

    <!-- Filtros Fijos (siempre visibles) -->
    <div class="filters-section-sticky" v-if="dashboardStore.campaigns.length > 0">
      <FiltersSidebar
        :filters="dashboardStore.filters"
        :available-clients="dashboardStore.availableClients"
        :available-campaigns="dashboardStore.availableCampaigns"
        :available-talents="dashboardStore.availableTalents"
        @update-filters="handleUpdateFilters"
        @clear-filters="handleClearFilters"
      />
    </div>
    <!-- KPIs -->
    <div class="kpis-grid" v-if="dashboardStore.campaigns.length > 0" :key="`kpis-${kpisRefreshKey}`">
      <KpiCard
        v-if="ftdsData.totalFTDs > 0"
        title="Total FTDs"
        :value="ftdsData.totalFTDs"
        color="cyan"
        tooltip="First time depositors for iGaming, crypto and trading campaigns, first user play for gaming campaigns."
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        v-if="ftdsData.metaProgress > 0"
        title="CPA Target %"
        :value="ftdsData.metaProgress"
        format="percentage"
        color="green"
        tooltip="Percentage of budget invested: (Real investment / Budget objective) × 100. Shows how much you've invested vs your budget."
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        v-if="ftdsData.avgTBA > 0"
        title="Average CPA"
        :value="ftdsData.avgTBA"
        format="currency"
        color="pink"
        tooltip="Average cost per acquisition calculated from campaign budget and obtained FTDs."
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        v-if="ftdsData.topTalent && ftdsData.topTalent !== '-'"
        title="Top Talent"
        :value="ftdsData.topTalent"
        color="blue"
        tooltip="Talent with the highest number of first time depositors."
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        v-if="ftdsData.topPlatform && ftdsData.topPlatform !== 'N/A' && ftdsData.topPlatformFTDs > 0"
        title="Top Channel"
        :value="ftdsData.topPlatform"
        color="cyan"
        :subtitle="`${ftdsData.topPlatformFTDs} FTDs`"
        tooltip="Platform or channel with the highest number of first time depositors."
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        v-if="ftdsData.rng > 0"
        title="Revenue"
        :value="ftdsData.rng"
        color="pink"
        tooltip="Net gaming revenue generated from campaigns."
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        v-if="ftdsData.totalDeposits > 0"
        title="Deposits"
        :value="ftdsData.totalDeposits"
        format="currency"
        color="green"
        tooltip="Total deposits amount from first time depositors."
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="M7 15h0M2 9.5h20"></path>
          </svg>
        </template>
      </KpiCard>
    </div>

    

    <!-- Time Series Chart with Multiple Metrics -->
    <div class="chart-section" v-if="dashboardStore.campaigns.length > 0">
      <div class="chart-wrapper">
        <ChartTimeSeriesMultiMetrics 
          :data="dashboardStore.filteredCampaigns" 
          :selected-platform-from-store="dashboardStore.filters.source"
        />
      </div>
    </div>

    <!-- Tabla de campañas -->
    <div class="table-section">
      <TableCampaign
        :campaigns="dashboardStore.filteredCampaigns"
        :search-query="dashboardStore.filters.searchQuery"
        :date-start="dashboardStore.filters.dateStart"
        :date-end="dashboardStore.filters.dateEnd"
        @update-search="handleSearchUpdate"
      />
    </div>

    <!-- Botón Scroll to Top -->
    <button 
      v-if="showScrollTop"
      @click="scrollToTop"
      class="scroll-to-top"
      type="button"
      title="Go to top"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDashboardStore } from './dashboardStore.js';
import KpiCard from '@/components/KpiCard.vue';
import FiltersSidebar from '@/components/FiltersSidebar.vue';
import TableCampaign from '@/components/TableCampaign.vue';
import ChartTimeSeriesMultiMetrics from '@/components/ChartTimeSeriesMultiMetrics.vue';
// Opción 1: Usar API (fetch) - descomenta esta línea
import { fetchCampaigns } from '@/services/apiService.js';
// Opción 2: Usar JSON local (fallback) - descomenta esta línea si no tienes API
// import campaignsData from '@/data/campaigns.json';

const dashboardStore = useDashboardStore();
const showScrollTop = ref(false);

// Key reactivo para KPIs (solo cliente)
const kpisRefreshKey = computed(() => {
  return dashboardStore.filters.client;
});

// Key reactivo para forzar actualización cuando cambien los filtros
const refreshKey = computed(() => {
  const filters = dashboardStore.filters;
  return JSON.stringify({
    client: filters.client,
    campaign: filters.campaign,
    source: filters.source,
    talent: filters.talent,
    dateStart: filters.dateStart,
    dateEnd: filters.dateEnd,
    searchQuery: filters.searchQuery
  });
});

// Detectar scroll para mostrar botón de ir arriba
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300;
};

// Go to top of the page
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// Calcular datos de FTDs (solo filtrado por cliente)
const ftdsData = computed(() => {
  // Filtrar solo por cliente, ignorando otros filtros para los KPIs
  let campaigns = dashboardStore.campaigns;

  const selectedClient = dashboardStore.filters.client;
  if (selectedClient && selectedClient !== 'all') {
    campaigns = campaigns.filter(c => c.NombreCliente === selectedClient);
  }

  // Agrupar por campaña única (id) para evitar duplicados
  // Cada entregable tiene el mismo FTDObtenido de su campaña padre
  const uniqueCampaigns = new Map();
  campaigns.forEach(c => {
    if (c.id && !uniqueCampaigns.has(c.id)) {
      uniqueCampaigns.set(c.id, {
        FTDObtenido: parseInt(c.FTDObtenido) || 0,
        FTDs: parseInt(c.FTDs) || 0,
        NombreTalento: c.NombreTalento,
        PlataformaTalento: c.PlataformaTalento,
        CPA: parseFloat(c.CPA) || 0,
        Revenue: parseFloat(c.Revenue) || 0,
        Deposits: parseFloat(c.Deposits) || 0,
        PrecioVenta: parseFloat(c.PrecioVenta) || 0
      });
    }
  });

  // Total FTDs obtenidos (sin duplicados)
  const totalFTDs = Array.from(uniqueCampaigns.values()).reduce((sum, c) => sum + c.FTDObtenido, 0);

  // Meta total (suma de FTDs meta sin duplicados)
  const targetFTDs = Array.from(uniqueCampaigns.values()).reduce((sum, c) => sum + c.FTDs, 0);

  // Inversión real = Suma de (CPA × FTDs obtenidos) de cada campaña única
  const totalInversionReal = Array.from(uniqueCampaigns.values()).reduce((sum, c) => {
    return sum + (c.CPA * c.FTDObtenido);
  }, 0);

  // Presupuesto objetivo = Suma de precio_venta de cada campaña única
  const presupuestoObjetivo = Array.from(uniqueCampaigns.values()).reduce((sum, c) => {
    return sum + c.PrecioVenta;
  }, 0);

  // CPA Target % = (Inversión real / Presupuesto objetivo) * 100
  // Representa cuánto has invertido vs cuánto tenías presupuestado
  const metaProgress = presupuestoObjetivo > 0 ? (totalInversionReal / presupuestoObjetivo) * 100 : 0;
  
  // CPA promedio (de campañas únicas)
  const uniqueCampaignsArray = Array.from(uniqueCampaigns.values());
  const campaignsWithCPA = uniqueCampaignsArray.filter(c => c.CPA > 0);
  const avgTBA = campaignsWithCPA.length > 0
    ? campaignsWithCPA.reduce((sum, c) => sum + c.CPA, 0) / campaignsWithCPA.length
    : 0;

  // Top talento por FTDs (usando campañas únicas)
  const talentFTDs = {};
  uniqueCampaignsArray.forEach(c => {
    const talent = c.NombreTalento || 'Unknown';
    if (!talentFTDs[talent]) {
      talentFTDs[talent] = { count: 0, handle: c.PlataformaTalento || '' };
    }
    talentFTDs[talent].count += c.FTDObtenido;
  });

  const topTalentEntry = Object.entries(talentFTDs)
    .sort((a, b) => b[1].count - a[1].count)[0];
  const topTalent = topTalentEntry ? topTalentEntry[0].split(' ')[0] : '-';
  const topTalentHandle = topTalentEntry ? topTalentEntry[1].handle : '';

  // Plataforma top (extraer dominio de PlataformaTalento, usando campañas únicas)
  const platformCounts = {};
  uniqueCampaignsArray.forEach(c => {
    const platform = c.PlataformaTalento || '';
    const domain = platform.includes('kick.com') ? 'Kick' :
                   platform.includes('twitch') ? 'Twitch' :
                   platform.includes('youtube') ? 'YouTube' : 'Other';
    if (!platformCounts[domain]) {
      platformCounts[domain] = 0;
    }
    platformCounts[domain] += c.FTDObtenido;
  });

  const topPlatformEntry = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])[0];
  const topPlatform = topPlatformEntry ? topPlatformEntry[0] : 'N/A';
  const topPlatformFTDs = topPlatformEntry ? topPlatformEntry[1] : 0;

  // Revenue (suma de campañas únicas)
  const rng = uniqueCampaignsArray.reduce((sum, c) => sum + c.Revenue, 0);

  // Total Deposits (suma de campañas únicas)
  const totalDeposits = uniqueCampaignsArray.reduce((sum, c) => sum + c.Deposits, 0);

  return {
    totalFTDs,
    targetFTDs,
    metaProgress: Number(metaProgress.toFixed(1)),
    avgTBA,
    topTalent,
    topTalentHandle,
    topPlatform,
    topPlatformFTDs,
    rng,
    totalDeposits
  };
});

// Normalizar datos del JSON (agregar campos faltantes solo si son necesarios)
const normalizeCampaignData = (data) => {
  return data.map(campaign => {
    // Agregar campos faltantes con valores por defecto (0)
    const normalized = { ...campaign };
    
    // Validar y normalizar entregables_fecha
    if (normalized.entregables_fecha) {
      // Asegurar que la fecha esté en formato ISO (YYYY-MM-DD)
      const dateStr = normalized.entregables_fecha.toString().trim();

      // Si ya está en formato YYYY-MM-DD (o YYYY-M-D), mantenerla tal cual (parsear manualmente)
      const dateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (dateMatch) {
        // Normalizar a formato YYYY-MM-DD con ceros
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        const day = parseInt(dateMatch[3], 10);
        normalized.entregables_fecha = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      } else {
        // Para otros formatos, intentar parsear pero extraer componentes manualmente para evitar zona horaria
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          // Extraer componentes en zona horaria local
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth() + 1;
          const day = dateObj.getDate();
          normalized.entregables_fecha = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
    
    // Si no tiene Views, usar Peak Viewers como aproximación
    if (normalized.Views === undefined && normalized['Peak Viewers']) {
      normalized.Views = normalized['Peak Viewers'];
    } else if (normalized.Views === undefined) {
      normalized.Views = 0;
    }
    
    // Solo usar valores reales del JSON, si no existen poner 0
    if (normalized.Likes === undefined) {
      normalized.Likes = 0;
    }
    
    if (normalized.Comments === undefined) {
      normalized.Comments = 0;
    }
    
    return normalized;
  });
};

// Cargar datos desde API o JSON local
onMounted(async () => {
  if (dashboardStore.campaigns.length === 0) {
    try {
      dashboardStore.setLoading(true);
      
      // OPCIÓN 1: Cargar desde API (recomendado)
      let rawData;
      try {
        rawData = await fetchCampaigns();
      } catch (apiError) {
        console.warn('Error al cargar desde API, usando JSON local como fallback:', apiError);
        // OPCIÓN 2: Fallback a JSON local si la API falla
        const campaignsData = await import('@/data/campaigns.json');
        rawData = campaignsData.default || campaignsData;
      }
      
      // Normalizar y guardar datos
      const normalizedData = normalizeCampaignData(rawData);
      dashboardStore.setCampaigns(normalizedData);
    } catch (error) {
      dashboardStore.setError('Error loading campaign data: ' + error.message);
      console.error('Error completo:', error);
    } finally {
      dashboardStore.setLoading(false);
    }
  }
});

const handleUpdateFilters = (newFilters) => {
  dashboardStore.setFilters(newFilters);
  // Scroll al inicio para mostrar la actualización desde el título
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleClearFilters = () => {
  dashboardStore.resetFilters();
};

const handleSearchUpdate = (searchQuery) => {
  dashboardStore.setFilters({ searchQuery });
};
</script>

<style scoped>
.dashboard-view {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.header-title {
  flex: 1;
}

.dashboard-title {
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-pink) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-xs);
}

.dashboard-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-filters {
  display: flex;
  gap: var(--spacing-md);
}

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
  min-width: 140px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 234, 255, 0.1);
}

/* KPIs Grid */
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

@media (min-width: 1400px) {
  .kpis-grid {
    grid-template-columns: repeat(7, 1fr);
  }
}

@media (min-width: 1024px) and (max-width: 1399px) {
  .kpis-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .kpis-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Filtros Fijos (Sticky) */
.filters-section-sticky {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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

/* Chart Section */
.chart-section {
  margin-bottom: var(--spacing-2xl);
}

.chart-section .chart-wrapper {
  height: 500px;
  width: 100%;
  overflow: hidden;
}

/* Campaign Details Section */
.campaign-details-section {
  margin-bottom: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
  animation: slideDown 0.3s ease-out;
}

/* Deliverable Details Section */
.deliverable-details-section {
  margin-bottom: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
  animation: slideDown 0.3s ease-out;
}

/* Tabla Section */
.table-section {
  margin-top: var(--spacing-2xl);
}

/* Botón Scroll to Top */
.scroll-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  color: var(--color-black);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(var(--accent-primary-rgb), 0.4);
  transition: all var(--transition-base);
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.scroll-to-top:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(var(--accent-primary-rgb), 0.6);
  background: var(--accent-primary);
}

.scroll-to-top svg {
  stroke: var(--color-black);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .dashboard-view {
    padding: var(--spacing-lg);
  }

  .dashboard-title {
    font-size: 2rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-filters {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .kpis-grid {
    grid-template-columns: 1fr;
  }
}
</style>

