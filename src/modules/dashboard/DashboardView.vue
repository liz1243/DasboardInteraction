<template>
  <div class="dashboard-view">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="dashboard-title">Campaigns Dashboard</h1>
          <p class="dashboard-subtitle">{{ currentMonth }}</p>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpis-grid" v-if="dashboardStore.campaigns.length > 0">
      <KpiCard
        title="Total FTDs"
        :value="ftdsData.totalFTDs"
        color="cyan"
        :subtitle="`of ${ftdsData.targetFTDs} target`"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        title="Target Achieved %"
        :value="ftdsData.metaProgress"
        format="percentage"
        color="green"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        title="Average CPA"
        :value="ftdsData.avgCPA"
        format="currency"
        color="pink"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        title="Top Talent"
        :value="ftdsData.topTalent"
        color="blue"
        :subtitle="ftdsData.topTalentHandle"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </template>
      </KpiCard>
      <KpiCard
        title="Top Platform"
        :value="ftdsData.topPlatform"
        color="cyan"
        :subtitle="`${ftdsData.topPlatformFTDs} FTDs`"
      >
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </template>
      </KpiCard>
    </div>

    <!-- Filtros Fijos (siempre visibles) -->
    <div class="filters-section-sticky" v-if="dashboardStore.campaigns.length > 0">
      <FiltersSidebar
        :filters="dashboardStore.filters"
        :available-clients="dashboardStore.availableClients"
        :available-talents="dashboardStore.availableTalents"
        @update-filters="handleUpdateFilters"
        @clear-filters="handleClearFilters"
      />
    </div>

    <!-- Gráfico de Barras - Timeline FTDs vs Entregables -->
    <div class="chart-section" v-if="dashboardStore.campaigns.length > 0">
      <div class="chart-wrapper">
        <ChartFTDsTimeline :data="dashboardStore.filteredCampaigns" />
      </div>
    </div>

    <!-- Tabla de campañas -->
    <div class="table-section">
      <TableCampaign 
        :campaigns="dashboardStore.filteredCampaigns"
        :search-query="dashboardStore.filters.searchQuery"
        @update-search="handleSearchUpdate"
        @view-campaign="handleViewCampaign"
      />
    </div>

    <!-- Panel de Detalles de Campaña (debajo de la tabla) -->
    <div v-if="selectedCampaign" class="campaign-details-section">
      <CampaignDetails 
        :campaign="selectedCampaign" 
        @close="selectedCampaign = null"
        @view-deliverable="handleViewDeliverable"
      />
    </div>

    <!-- Panel de Detalles de Entregable (debajo del panel de campaña) -->
    <div v-if="selectedDeliverable" class="deliverable-details-section">
      <DeliverableDetails 
        :deliverable="selectedDeliverable" 
        :related-deliverables="getRelatedDeliverablesForSelected()"
        @close="selectedDeliverable = null" 
      />
    </div>

    <!-- Botón Scroll to Top -->
    <button 
      v-if="showScrollTop"
      @click="scrollToTop"
      class="scroll-to-top"
      type="button"
      title="Ir al principio"
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
import ChartFTDsTimeline from '@/components/ChartFTDsTimeline.vue';
import CampaignDetails from '@/components/CampaignDetails.vue';
import DeliverableDetails from '@/components/DeliverableDetails.vue';
// Opción 1: Usar API (fetch) - descomenta esta línea
import { fetchCampaigns } from '@/services/apiService.js';
// Opción 2: Usar JSON local (fallback) - descomenta esta línea si no tienes API
// import campaignsData from '@/data/campaigns.json';

const dashboardStore = useDashboardStore();
const selectedCampaign = ref(null);
const selectedDeliverable = ref(null);
const showScrollTop = ref(false);

// Detectar scroll para mostrar botón de ir arriba
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300;
};

// Ir al principio de la página
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

// Calcular mes actual
const currentMonth = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
});

// Calcular datos de FTDs
const ftdsData = computed(() => {
  const campaigns = dashboardStore.filteredCampaigns;
  
  // Total FTDs obtenidos
  const totalFTDs = campaigns.reduce((sum, c) => sum + (parseInt(c.FTDObtenido) || 0), 0);
  
  // Meta total (suma de FTDs meta)
  const targetFTDs = campaigns.reduce((sum, c) => sum + (parseInt(c.FTDs) || 0), 0);
  
  // % Meta alcanzada
  const metaProgress = targetFTDs > 0 ? (totalFTDs / targetFTDs) * 100 : 0;
  
  // CPA promedio (asumiendo un presupuesto estimado)
  const avgCPA = totalFTDs > 0 ? 50 : 0; // Placeholder - ajustar según datos reales
  
  // Top talento por FTDs
  const talentFTDs = {};
  campaigns.forEach(c => {
    const talent = c.NombreTalento || 'Unknown';
    if (!talentFTDs[talent]) {
      talentFTDs[talent] = { count: 0, handle: c.PlataformaTalento || '' };
    }
    talentFTDs[talent].count += parseInt(c.FTDObtenido) || 0;
  });
  
  const topTalentEntry = Object.entries(talentFTDs)
    .sort((a, b) => b[1].count - a[1].count)[0];
  const topTalent = topTalentEntry ? topTalentEntry[0].split(' ')[0] : 'N/A';
  const topTalentHandle = topTalentEntry ? topTalentEntry[1].handle : '';
  
  // Plataforma top (extraer dominio de PlataformaTalento)
  const platformCounts = {};
  campaigns.forEach(c => {
    const platform = c.PlataformaTalento || '';
    const domain = platform.includes('kick.com') ? 'Kick' : 
                   platform.includes('twitch') ? 'Twitch' :
                   platform.includes('youtube') ? 'YouTube' : 'Other';
    if (!platformCounts[domain]) {
      platformCounts[domain] = 0;
    }
    platformCounts[domain] += parseInt(c.FTDObtenido) || 0;
  });
  
  const topPlatformEntry = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])[0];
  const topPlatform = topPlatformEntry ? topPlatformEntry[0] : 'N/A';
  const topPlatformFTDs = topPlatformEntry ? topPlatformEntry[1] : 0;
  
  return {
    totalFTDs,
    targetFTDs,
    metaProgress: Number(metaProgress.toFixed(1)),
    avgCPA,
    topTalent,
    topTalentHandle,
    topPlatform,
    topPlatformFTDs
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
      const dateStr = normalized.entregables_fecha.toString();
      // Si es una fecha válida, mantenerla; si no, intentar parsearla
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        // Formatear a ISO si no está ya en ese formato
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        normalized.entregables_fecha = `${year}-${month}-${day}`;
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
};

const handleClearFilters = () => {
  dashboardStore.resetFilters();
};

const handleSearchUpdate = (searchQuery) => {
  dashboardStore.setFilters({ searchQuery });
};

const handleViewCampaign = (campaign) => {
  selectedCampaign.value = campaign;
  selectedDeliverable.value = null; // Cerrar entregable si está abierto
  // Scroll suave hacia el panel de detalles
  setTimeout(() => {
    const element = document.querySelector('.campaign-details-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleViewDeliverable = (deliverable) => {
  selectedDeliverable.value = deliverable;
  // Scroll suave hacia el panel de detalles del entregable
  setTimeout(() => {
    const element = document.querySelector('.deliverable-details-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const getRelatedDeliverablesForSelected = () => {
  if (!selectedDeliverable.value || !selectedCampaign.value) return [];
  // Obtener entregables del mismo talento y cliente
  return dashboardStore.campaigns.filter(c => 
    c.NombreTalento === selectedDeliverable.value.NombreTalento &&
    c.NombreCliente === selectedDeliverable.value.NombreCliente
  );
};
</script>

<style scoped>
.dashboard-view {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: var(--spacing-2xl);
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
  font-size: 2.5rem;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-2xl);
}

@media (min-width: 1200px) {
  .kpis-grid {
    grid-template-columns: repeat(5, 1fr);
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

.chart-wrapper {
  height: 400px;
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

