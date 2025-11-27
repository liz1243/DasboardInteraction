import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  filterCampaigns,
  getAvailableTalents,
  getPlatformFromUrl
} from '@/utils/kpiCalculations.js';

export const useDashboardStore = defineStore('dashboard', () => {
  // Estado
  const campaigns = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Filtros
  const filters = ref({
    source: 'all', // Plataforma: youtube, kick, twitch, all
    client: 'all',
    talent: 'all',
    searchQuery: ''
  });

  // Computed - Campañas filtradas
  const filteredCampaigns = computed(() => {
    return filterCampaigns(campaigns.value, filters.value);
  });

  // Filtrar campañas por plataforma seleccionada
  const campaignsBySource = computed(() => {
    if (filters.value.source === 'all') return campaigns.value;
    return campaigns.value.filter(campaign => {
      const platform = getPlatformFromUrl(campaign.PlataformaTalento);
      return platform === filters.value.source;
    });
  });

  const availableTalents = computed(() => {
    // Primero filtrar por plataforma (source)
    let filteredCampaigns = campaignsBySource.value;
    
    // Luego filtrar por cliente seleccionado si aplica
    const selectedClient = filters.value.client;
    if (selectedClient && selectedClient !== 'all') {
      filteredCampaigns = filteredCampaigns.filter(c => c.NombreCliente === selectedClient);
    }
    
    return getAvailableTalents(filteredCampaigns);
  });

  const availableClients = computed(() => {
    // Filtrar clientes por plataforma seleccionada
    const clientsSet = new Set();
    campaignsBySource.value.forEach(campaign => {
      if (campaign.NombreCliente) {
        clientsSet.add(campaign.NombreCliente);
      }
    });
    return Array.from(clientsSet).sort();
  });

  // Acciones
  function setCampaigns(newCampaigns) {
    campaigns.value = newCampaigns;
    error.value = null;
    // Resetear filtros al cargar nuevos datos
    resetFilters();
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      source: 'all',
      client: 'all',
      talent: 'all',
      searchQuery: ''
    };
  }

  function setLoading(value) {
    loading.value = value;
  }

  function setError(errorMessage) {
    error.value = errorMessage;
    loading.value = false;
  }

  function clearData() {
    campaigns.value = [];
    error.value = null;
    resetFilters();
  }

  return {
    // Estado
    campaigns,
    filteredCampaigns,
    loading,
    error,
    filters,
    // Computed
    availableTalents,
    availableClients,
    // Acciones
    setCampaigns,
    setFilters,
    resetFilters,
    setLoading,
    setError,
    clearData
  };
});

