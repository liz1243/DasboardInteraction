<template>
  <div class="client-view">
    <div v-if="loading" class="loading-state">
      <p>Loading...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="handleBackToDashboard" class="btn-back">Volver al Dashboard</button>
    </div>
    
    <div v-else-if="clientName" class="client-content">
      <!-- Header con nombre del cliente -->
      <div class="client-header">
        <button @click="handleBackToDashboard" class="btn-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Dashboard
        </button>
        <div class="client-title-section">
          <h1 class="client-title">{{ clientName }}</h1>
          <p class="client-subtitle">{{ currentMonth }}</p>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpis-grid" v-if="filteredCampaigns.length > 0">
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
          title="TBA Promedio"
          :value="ftdsData.avgTBA"
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
      <div class="filters-section-sticky" v-if="filteredCampaigns.length > 0">
        <FiltersSidebar
          :filters="dashboardStore.filters"
          :available-clients="dashboardStore.availableClients"
          :available-talents="dashboardStore.availableTalents"
          @update-filters="handleUpdateFilters"
          @clear-filters="handleClearFilters"
        />
      </div>

      <!-- Gráfico de Barras - Timeline FTDs vs Entregables -->
      <div class="chart-section" v-if="filteredCampaigns.length > 0">
        <div class="chart-wrapper">
          <ChartFTDsTimeline :data="filteredCampaigns" />
        </div>
      </div>

      <!-- Tabla de campañas -->
      <div class="table-section">
        <TableCampaign 
          :campaigns="filteredCampaigns"
          :search-query="dashboardStore.filters.searchQuery"
          @update-search="handleSearchUpdate"
          @view-campaign="handleViewCampaign"
        />
      </div>

      <!-- Panel de Detalles de Campaña (debajo de la tabla) -->
      <div v-if="selectedCampaign" class="campaign-details-section">
        <CampaignDetails 
          :campaign="selectedCampaign" 
          :source="route.params.source"
          @close="selectedCampaign = null"
          @view-deliverable="handleViewDeliverable"
        />
      </div>

      <!-- Panel de Detalles de Entregable (debajo del panel de campaña) -->
      <div v-if="selectedDeliverable" class="deliverable-details-section">
        <DeliverableDetails 
          :deliverable="selectedDeliverable" 
          :related-deliverables="getRelatedDeliverablesForSelected()"
          :source="route.params.source"
          @close="selectedDeliverable = null" 
        />
      </div>
    </div>
    
    <div v-else class="not-found-state">
      <p>Client not found</p>
      <button @click="handleBackToDashboard" class="btn-back">Back to Dashboard</button>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDashboardStore } from './dashboardStore.js';
import KpiCard from '@/components/KpiCard.vue';
import FiltersSidebar from '@/components/FiltersSidebar.vue';
import TableCampaign from '@/components/TableCampaign.vue';
import ChartFTDsTimeline from '@/components/ChartFTDsTimeline.vue';
import CampaignDetails from '@/components/CampaignDetails.vue';
import DeliverableDetails from '@/components/DeliverableDetails.vue';
import { decodeRouteParam } from '@/utils/routeHelpers.js';
import { fetchCampaigns } from '@/services/apiService.js';

const route = useRoute();
const router = useRouter();
const dashboardStore = useDashboardStore();

const clientName = ref(null);
const loading = ref(true);
const error = ref(null);
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

// Campañas filtradas por cliente
const filteredCampaigns = computed(() => {
  if (!clientName.value) return [];
  return dashboardStore.campaigns.filter(c => 
    c.NombreCliente === clientName.value
  );
});

// Calcular mes actual
const currentMonth = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
});

// Calcular datos de FTDs
const ftdsData = computed(() => {
  const campaigns = filteredCampaigns.value;
  
  // Total FTDs obtenidos
  const totalFTDs = campaigns.reduce((sum, c) => sum + (parseInt(c.FTDObtenido) || 0), 0);
  
  // Meta total (suma de FTDs meta)
  const targetFTDs = campaigns.reduce((sum, c) => sum + (parseInt(c.FTDs) || 0), 0);
  
  // % Meta alcanzada
  const metaProgress = targetFTDs > 0 ? (totalFTDs / targetFTDs) * 100 : 0;
  
  // TBA promedio (asumiendo un presupuesto estimado)
  const avgTBA = totalFTDs > 0 ? 50 : 0; // Placeholder - ajustar según datos reales
  
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
  const topTalent = topTalentEntry ? topTalentEntry[0].split(' ')[0] : '-';
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
    avgTBA,
    topTalent,
    topTalentHandle,
    topPlatform,
    topPlatformFTDs
  };
});

// Cargar cliente basado en los parámetros de ruta
const loadClient = async () => {
  // Leer parámetros de ruta de la URL
  const clienteParam = route.params.cliente;
  const talentoParam = route.params.talento;
  const sourceParam = route.params.source;
  
  if (!clienteParam) {
    error.value = 'Parámetro "cliente" no proporcionado en la URL';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Decodificar el nombre del cliente y talento (pueden venir codificados)
    const decodedClientName = decodeRouteParam(clienteParam);
    const decodedTalentName = talentoParam ? decodeRouteParam(talentoParam) : null;
    const decodedSource = sourceParam ? decodeRouteParam(sourceParam) : null;
    
    // Guardar el nombre del cliente en el ref
    clientName.value = decodedClientName;
    
    try {
      const { fetchCampaignsByClient } = await import('@/services/apiService.js');
      
      // Cargar datos filtrados por cliente (y talento y source si están presentes) desde la API
      const filteredData = await fetchCampaignsByClient(decodedClientName, decodedTalentName, decodedSource);
      
      // Normalizar datos
      const normalizedData = filteredData.map(campaign => {
        const normalized = { ...campaign };
        
        // Validar y normalizar entregables_fecha
        if (normalized.entregables_fecha) {
          const dateStr = normalized.entregables_fecha.toString();
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
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
      
      // Guardar datos filtrados en el store
      dashboardStore.setCampaigns(normalizedData);
      
      // Aplicar filtro de cliente automáticamente
      dashboardStore.setFilters({ client: decodedClientName });
      if (decodedTalentName) {
        dashboardStore.setFilters({ talent: decodedTalentName });
      }
      
      console.log(`✅ Datos del cliente "${decodedClientName}"${decodedTalentName ? ` y talento "${decodedTalentName}"` : ''}${decodedSource ? ` y source "${decodedSource}"` : ''} cargados: ${normalizedData.length} entregables`);
    } catch (apiError) {
      console.warn('Error al cargar datos filtrados desde API, usando fallback:', apiError);
      
      // Fallback: cargar todos los datos y filtrar localmente
      try {
        const { fetchCampaigns } = await import('@/services/apiService.js');
        const allData = await fetchCampaigns();
        
        // Normalizar y filtrar localmente
        const normalizedData = allData
          .filter(c => c.NombreCliente && c.NombreCliente === decodedClientName)
          .map(campaign => {
            const normalized = { ...campaign };
            
            if (normalized.entregables_fecha) {
              const dateStr = normalized.entregables_fecha.toString();
              const dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                normalized.entregables_fecha = `${year}-${month}-${day}`;
              }
            }
            
            if (normalized.Views === undefined && normalized['Peak Viewers']) {
              normalized.Views = normalized['Peak Viewers'];
            } else if (normalized.Views === undefined) {
              normalized.Views = 0;
            }
            
            if (normalized.Likes === undefined) {
              normalized.Likes = 0;
            }
            
            if (normalized.Comments === undefined) {
              normalized.Comments = 0;
            }
            
            return normalized;
          });
        
        dashboardStore.setCampaigns(normalizedData);
        dashboardStore.setFilters({ client: decodedClientName });
        if (decodedTalentName) {
          dashboardStore.setFilters({ talent: decodedTalentName });
        }
      } catch (fallbackError) {
        error.value = 'Error al cargar los datos: ' + fallbackError.message;
        loading.value = false;
        return;
      }
    }
  } catch (err) {
    error.value = 'Error al cargar el cliente: ' + err.message;
    console.error('Error en loadClient:', err);
  } finally {
    loading.value = false;
  }
};

const handleUpdateFilters = (newFilters) => {
  dashboardStore.setFilters(newFilters);
};

const handleClearFilters = () => {
  dashboardStore.resetFilters();
  // Mantener el filtro de cliente
  if (clientName.value) {
    dashboardStore.setFilters({ client: clientName.value });
  }
};

const handleSearchUpdate = (searchQuery) => {
  dashboardStore.setFilters({ searchQuery });
};

const handleViewCampaign = (campaign) => {
  selectedCampaign.value = campaign;
  selectedDeliverable.value = null;
  setTimeout(() => {
    const element = document.querySelector('.campaign-details-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleViewDeliverable = (deliverable) => {
  selectedDeliverable.value = deliverable;
  setTimeout(() => {
    const element = document.querySelector('.deliverable-details-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const getRelatedDeliverablesForSelected = () => {
  if (!selectedDeliverable.value || !selectedCampaign.value) return [];
  return dashboardStore.campaigns.filter(c => 
    c.NombreTalento === selectedDeliverable.value.NombreTalento &&
    c.NombreCliente === selectedDeliverable.value.NombreCliente
  );
};

// Función para normalizar datos (similar a DashboardView)
const normalizeCampaignData = (data) => {
  return data.map(campaign => {
    const normalized = { ...campaign };
    
    // Validar y normalizar entregables_fecha
    if (normalized.entregables_fecha) {
      const dateStr = normalized.entregables_fecha.toString();
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
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

// Manejar navegación de vuelta al dashboard y recargar datos
const handleBackToDashboard = async () => {
  try {
    dashboardStore.setLoading(true);
    
    // Recargar todos los datos desde la API
    let rawData;
    try {
      rawData = await fetchCampaigns();
    } catch (apiError) {
      console.warn('Error al cargar desde API, usando JSON local como fallback:', apiError);
      // Fallback a JSON local si la API falla
      const campaignsData = await import('@/data/campaigns.json');
      rawData = campaignsData.default || campaignsData;
    }
    
    // Normalizar y guardar datos
    const normalizedData = normalizeCampaignData(rawData);
    dashboardStore.setCampaigns(normalizedData);
    
    // Limpiar filtros
    dashboardStore.resetFilters();
    
    // Navegar al dashboard
    router.push('/');
  } catch (error) {
    console.error('Error al recargar datos:', error);
    // Navegar de todas formas
    router.push('/');
  } finally {
    dashboardStore.setLoading(false);
  }
};

// Cargar cuando se monta el componente
onMounted(() => {
  loadClient();
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// Recargar cuando cambian los parámetros de ruta (cliente, talento o source)
watch(() => [route.params.cliente, route.params.talento, route.params.source], () => {
  loadClient();
  selectedCampaign.value = null;
  selectedDeliverable.value = null;
});
</script>

<style scoped>
.client-view {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.client-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
  flex-wrap: wrap;
}

.client-title-section {
  flex: 1;
}

.client-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-pink) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--spacing-xs) 0;
}

.client-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
}

.btn-back:hover {
  background: var(--bg-card);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.loading-state,
.error-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--spacing-lg);
  text-align: center;
}

.error-state p,
.not-found-state p {
  color: var(--text-secondary);
  font-size: 1.125rem;
}

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

.chart-section {
  margin-bottom: var(--spacing-2xl);
}

.chart-wrapper {
  height: 400px;
}

.table-section {
  margin-top: var(--spacing-2xl);
}

.campaign-details-section {
  margin-bottom: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
  animation: slideDown 0.3s ease-out;
}

.deliverable-details-section {
  margin-bottom: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
  animation: slideDown 0.3s ease-out;
}

@media (max-width: 768px) {
  .client-view {
    padding: var(--spacing-lg);
  }

  .client-title {
    font-size: 2rem;
  }

  .client-header {
    flex-direction: column;
  }

  .kpis-grid {
    grid-template-columns: 1fr;
  }
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
</style>

