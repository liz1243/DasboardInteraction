import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  filterCampaigns,
  getAvailableTalents
} from '@/utils/kpiCalculations.js';

export const useDashboardStore = defineStore('dashboard', () => {
  // Estado
  const campaigns = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Filtros
  const filters = ref({
    client: 'all',
    talent: 'all',
    searchQuery: ''
  });

  // Computed - Campañas filtradas
  const filteredCampaigns = computed(() => {
    return filterCampaigns(campaigns.value, filters.value);
  });

  const availableTalents = computed(() => {
    // Filtrar talentos por cliente seleccionado si aplica
    const selectedClient = filters.value.client;
    const source = selectedClient && selectedClient !== 'all'
      ? campaigns.value.filter(c => c.NombreCliente === selectedClient)
      : campaigns.value;
    return getAvailableTalents(source);
  });

  const availableClients = computed(() => {
    const clientsSet = new Set();
    campaigns.value.forEach(campaign => {
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

