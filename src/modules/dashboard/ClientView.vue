<template>
  <div class="client-view" :key="refreshKey">
    <div v-if="loading" class="loading-state">
      <p>Loading...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="handleBackToDashboard" class="btn-back">Back to Dashboard</button>
    </div>
    
    <div v-else-if="clientName" class="client-content">
      <!-- Header with client name -->
      <div class="client-header">
        <button @click="handleBackToDashboard" class="btn-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Dashboard
        </button>
        <div class="client-title-section">
          <h1 class="client-title">{{ clientName }}</h1>
        </div>
      </div>
      <div class="filters-section-sticky" v-if="filteredCampaigns.length > 0">
        <FiltersSidebar
          :filters="dashboardStore.filters"
          :available-clients="dashboardStore.availableClients"
          :available-talents="dashboardStore.availableTalents"
          :disable-platform-filter="true"
          @update-filters="handleUpdateFilters"
          @clear-filters="handleClearFilters"
        />
      </div>
      <!-- KPIs -->
      <div class="kpis-grid" v-if="filteredCampaigns.length > 0" :key="`kpis-${refreshKey}`">
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
          tooltip="Percentage of cost per acquisition target achieved based on paid amount and target FTDs."
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

      <!-- Filtros Fijos (siempre visibles) -->
    

      <!-- Time Series Chart with Multiple Metrics -->
      <div class="chart-section" v-if="filteredCampaigns.length > 0">
        <div class="chart-wrapper">
          <ChartTimeSeriesMultiMetrics 
            :data="filteredCampaigns" 
            :selected-platform-from-store="dashboardStore.filters.source"
            :static-platform="clientSource || (dashboardStore.filters.source !== 'all' ? dashboardStore.filters.source : null)"
          />
        </div>
      </div>

      <!-- Tabla de campañas -->
      <div class="table-section">
        <TableCampaign 
          :campaigns="filteredCampaigns"
          :search-query="dashboardStore.filters.searchQuery"
          @update-search="handleSearchUpdate"
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
      title="Go to top"
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
import ChartTimeSeriesMultiMetrics from '@/components/ChartTimeSeriesMultiMetrics.vue';
import { decodeRouteParam } from '@/utils/routeHelpers.js';
import { fetchCampaigns } from '@/services/apiService.js';

const route = useRoute();
const router = useRouter();
const dashboardStore = useDashboardStore();

// Key reactivo para forzar actualización cuando cambien los filtros
const refreshKey = computed(() => {
  const filters = dashboardStore.filters;
  return JSON.stringify({
    source: filters.source,
    client: filters.client,
    talent: filters.talent,
    dateStart: filters.dateStart,
    dateEnd: filters.dateEnd,
    searchQuery: filters.searchQuery
  });
});

const clientName = ref(null);
const clientSource = ref(null); // Plataforma desde la URL
const loading = ref(true);
const error = ref(null);
const showScrollTop = ref(false);

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

// Campaigns filtered by client - usar filteredCampaigns del store para aplicar todos los filtros incluyendo fechas
const filteredCampaigns = computed(() => {
  if (!clientName.value) return [];
  // Usar filteredCampaigns del store que ya aplica todos los filtros (incluyendo fechas)
  // y luego filtrar por cliente si es necesario (aunque el filtro de cliente ya está en el store)
  return dashboardStore.filteredCampaigns.filter(c => 
    c.NombreCliente === clientName.value
  );
});

// Calculate current month
const currentMonth = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
});

// Calcular datos de FTDs
const ftdsData = computed(() => {
  const campaigns = filteredCampaigns.value;
  const filters = dashboardStore.filters;
  
  // Total FTDs obtained (del cliente)
  const totalFTDs = campaigns.reduce((sum, c) => sum + (parseInt(c.FTDObtenido) || 0), 0);
  
  // Total target (sum of target FTDs)
  const targetFTDs = campaigns.reduce((sum, c) => sum + (parseInt(c.FTDs) || 0), 0);
  
  // CPA Target % = (Monto pagado por la campaña / FTDs objetivo) / CPA objetivo * 100
  // Monto pagado = TBA real * FTDs obtenidos
  // TBA real = Presupuesto estimado / FTDs obtenidos = (FTDs objetivo * 50) / FTDs obtenidos
  // Monto pagado real = TBA real * FTDs obtenidos = (FTDs objetivo * 50) / FTDs obtenidos * FTDs obtenidos = FTDs objetivo * 50
  // Pero esto siempre da lo mismo. Necesitamos usar el costo real basado en FTDs obtenidos.
  // Alternativa: Monto pagado = TBA promedio * FTDs obtenidos totales
  let metaProgress = 0;
  
  const totalFTDsObjetivo = campaigns.reduce((sum, c) => {
    return sum + (Number(c.FTDs) || 0);
  }, 0);
  
  const totalFTDsObtenidos = campaigns.reduce((sum, c) => {
    return sum + (Number(c.FTDObtenido) || 0);
  }, 0);

  // Calcular monto total pagado usando el CPA real de cada campaña
  // Presupuesto Real = Suma de (CPA real × FTDs obtenidos) por cada campaña
  const totalMontoPagado = campaigns.reduce((sum, c) => {
    const cpa = parseFloat(c.CPA) || 0;
    const ftdsObtenidos = Number(c.FTDObtenido) || 0;
    return sum + (cpa * ftdsObtenidos);
  }, 0);

  // CPA Target = Monto pagado / FTDs objetivo
  const cpaTarget = totalFTDsObjetivo > 0 ? (totalMontoPagado / totalFTDsObjetivo) : 0;
  
  // CPA objetivo = $50 por FTD objetivo
  const cpaObjetivo = 50;
  
  // CPA Target % = (CPA Target / CPA objetivo) * 100
  metaProgress = cpaObjetivo > 0 ? (cpaTarget / cpaObjetivo) * 100 : 0;
  
  // Debug: mostrar valores calculados
  console.log('CPA Target % Calculation (ClientView):', {
    totalMontoPagado: totalMontoPagado.toFixed(2),
    totalFTDsObjetivo,
    totalFTDsObtenidos,
    cpaTarget: cpaTarget.toFixed(2),
    cpaObjetivo,
    metaProgress: metaProgress.toFixed(2) + '%',
    expected: cpaObjetivo > 0 ? `(${cpaTarget.toFixed(2)} / ${cpaObjetivo}) * 100 = ${metaProgress.toFixed(2)}%` : 'N/A',
    totalCampaigns: campaigns.length
  });
  
  // CPA promedio (calculado del campo CPA real de la API)
  const totalCPA = campaigns.reduce((sum, c) => sum + (parseFloat(c.CPA) || 0), 0);
  const campaignsWithCPA = campaigns.filter(c => (parseFloat(c.CPA) || 0) > 0).length;
  const avgTBA = campaignsWithCPA > 0 ? totalCPA / campaignsWithCPA : 0;
  
  // Top talent by FTDs
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
  
  // Top platform (extract domain from PlataformaTalento)
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

  // Revenue (suma real del campo Revenue/NRG del API)
  const rng = campaigns.reduce((sum, c) => sum + (parseFloat(c.Revenue) || 0), 0);

  // Total Deposits (suma real del campo Deposits del API)
  const totalDeposits = campaigns.reduce((sum, c) => sum + (parseFloat(c.Deposits) || 0), 0);
  
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

// Load client based on route parameters
const loadClient = async () => {
  // Read route parameters from URL
  const clienteParam = route.params.cliente;
  const talentoParam = route.params.talento;
  const sourceParam = route.params.source;
  
  if (!clienteParam) {
    error.value = 'Parameter "client" not provided in URL';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Decode client and talent names (may come encoded)
    const decodedClientName = decodeRouteParam(clienteParam);
    const decodedTalentName = talentoParam ? decodeRouteParam(talentoParam) : null;
    const decodedSource = sourceParam ? decodeRouteParam(sourceParam) : null;
    
    // Save client name and source in refs
    clientName.value = decodedClientName;
    clientSource.value = decodedSource; // Guardar la plataforma de la URL
    
    try {
      const { fetchCampaignsByClient } = await import('@/services/apiService.js');
      
      // Load filtered data by client (and talent and source if present) from API
      const filteredData = await fetchCampaignsByClient(decodedClientName, decodedTalentName, decodedSource);
      
      // Normalize data
      const normalizedData = filteredData.map(campaign => {
        const normalized = { ...campaign };
        
        // Validate and normalize entregables_fecha
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
      
      // Save filtered data in store
      dashboardStore.setCampaigns(normalizedData);
      
      // Apply client filter automatically
      dashboardStore.setFilters({ client: decodedClientName });
      if (decodedTalentName) {
        dashboardStore.setFilters({ talent: decodedTalentName });
      }
      
    } catch (apiError) {
      console.warn('Error loading filtered data from API, using fallback:', apiError);
      
      // Fallback: load all data and filter locally
      try {
        const { fetchCampaigns } = await import('@/services/apiService.js');
        const allData = await fetchCampaigns();
        
        // Normalize and filter locally
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
        error.value = 'Error loading data: ' + fallbackError.message;
        loading.value = false;
        return;
      }
    }
  } catch (err) {
    error.value = 'Error loading client: ' + err.message;
    console.error('Error en loadClient:', err);
  } finally {
    loading.value = false;
  }
};

const handleUpdateFilters = (newFilters) => {
  dashboardStore.setFilters(newFilters);
  // Scroll al inicio para mostrar la actualización desde el título
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleClearFilters = () => {
  dashboardStore.resetFilters();
  // Keep client filter
  if (clientName.value) {
    dashboardStore.setFilters({ client: clientName.value });
  }
};

const handleSearchUpdate = (searchQuery) => {
  dashboardStore.setFilters({ searchQuery });
};

// Función para normalizar datos (similar a DashboardView)
const normalizeCampaignData = (data) => {
  return data.map(campaign => {
    const normalized = { ...campaign };
    
    // Validar y normalizar entregables_fecha
    if (normalized.entregables_fecha) {
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

// Manejar navegación de vuelta al dashboard y recargar datos
const handleBackToDashboard = async () => {
  try {
    dashboardStore.setLoading(true);
    
    // Recargar todos los datos desde la API
    let rawData;
    try {
      rawData = await fetchCampaigns();
    } catch (apiError) {
      console.warn('Error loading from API, using local JSON as fallback:', apiError);
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
    console.error('Error reloading data:', error);
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

// Reload when route parameters change (client, talent or source)
watch(() => [route.params.cliente, route.params.talento, route.params.source], () => {
  loadClient();
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
  flex-wrap: wrap;
}

.client-title-section {
  flex: 1;
}

.client-title {
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

.chart-section {
  margin-bottom: var(--spacing-2xl);
}

.chart-section .chart-wrapper {
  height: 500px;
  width: 100%;
  overflow: hidden;
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

