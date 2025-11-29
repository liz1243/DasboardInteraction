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
    searchQuery: '',
    dateStart: null,
    dateEnd: null
  });

  // Computed - Campañas filtradas
  const filteredCampaigns = computed(() => {
    return filterCampaigns(campaigns.value, filters.value);
  });

  // Filtrar campañas por plataforma seleccionada (también aplica filtro de fechas)
  const campaignsBySource = computed(() => {
    // Primero aplicar filtro de plataforma
    let filtered = campaigns.value;
    if (filters.value.source !== 'all') {
      filtered = filtered.filter(campaign => {
        const platform = getPlatformFromUrl(campaign.PlataformaTalento);
        return platform === filters.value.source;
      });
    }
    
    // Luego aplicar filtro de fechas si existe
    if (filters.value.dateStart || filters.value.dateEnd) {
      filtered = filtered.filter(campaign => {
        if (!campaign.entregables_fecha) return false;
        
        const campaignDateStr = campaign.entregables_fecha.toString().trim();
        const dateMatch = campaignDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        
        if (!dateMatch) return false;
        
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        const day = parseInt(dateMatch[3], 10);
        const campaignDate = new Date(year, month - 1, day);
        
        if (filters.value.dateStart) {
          const startDate = new Date(filters.value.dateStart);
          startDate.setHours(0, 0, 0, 0);
          if (campaignDate < startDate) return false;
        }
        
        if (filters.value.dateEnd) {
          const endDate = new Date(filters.value.dateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (campaignDate > endDate) return false;
        }
        
        return true;
      });
    }
    
    return filtered;
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
      searchQuery: '',
      dateStart: null,
      dateEnd: null
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

