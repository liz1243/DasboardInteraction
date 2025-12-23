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
    client: 'all',
    campaign: 'all',
    source: 'all', // Plataforma: youtube, kick, twitch, all
    talent: 'all',
    searchQuery: '',
    dateStart: null,
    dateEnd: null
  });

  // Computed - Campañas filtradas
 const filteredCampaigns = computed(() => {
  let filtered = campaigns.value;

  // Filtrar por cliente
  if (filters.value.client && filters.value.client !== 'all') {
    filtered = filtered.filter(c => c.NombreCliente === filters.value.client);
  }

  // Filtrar por campaña
  if (filters.value.campaign && filters.value.campaign !== 'all') {
    filtered = filtered.filter(c => c.NombreCampana === filters.value.campaign);
  }

  // Filtrar por talento
  if (filters.value.talent && filters.value.talent !== 'all') {
    filtered = filtered.filter(c => c.NombreTalento === filters.value.talent);
  }

  // Filtrar por plataforma
  if (filters.value.source && filters.value.source !== 'all') {
    filtered = filtered.filter(c => getPlatformFromUrl(c.PlataformaTalento) === filters.value.source);
  }

  // Filtrar por fechas
  if (filters.value.dateStart || filters.value.dateEnd) {
    filtered = filtered.filter(c => {
      if (!c.entregables_fecha) return false;
      const [y, m, d] = c.entregables_fecha.split('-').map(Number);
      const campaignDate = new Date(y, m - 1, d);

      if (filters.value.dateStart) {
        const start = new Date(filters.value.dateStart);
        start.setHours(0, 0, 0, 0);
        if (campaignDate < start) return false;
      }
      if (filters.value.dateEnd) {
        const end = new Date(filters.value.dateEnd);
        end.setHours(23, 59, 59, 999);
        if (campaignDate > end) return false;
      }

      return true;
    });
  }

  return filtered;
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

  // Clientes disponibles (siempre muestra todos)
  const availableClients = computed(() => {
    const clientsSet = new Set();
    campaigns.value.forEach(campaign => {
      if (campaign.NombreCliente) {
        clientsSet.add(campaign.NombreCliente);
      }
    });
    return Array.from(clientsSet).sort();
  });

  // Campañas disponibles (filtradas por cliente)
  const availableCampaigns = computed(() => {
    let filtered = campaigns.value;

    if (filters.value.client && filters.value.client !== 'all') {
      filtered = filtered.filter(c => c.NombreCliente === filters.value.client);
    }

    return Array.from(new Set(filtered.map(c => c.NombreCampana))).sort();
  });

  // Plataformas disponibles (filtradas por cliente y campaña)
  const availablePlatforms = computed(() => {
    let filtered = campaigns.value;

    if (filters.value.client && filters.value.client !== 'all') {
      filtered = filtered.filter(c => c.NombreCliente === filters.value.client);
    }
    if (filters.value.campaign && filters.value.campaign !== 'all') {
      filtered = filtered.filter(c => c.NombreCampana === filters.value.campaign);
    }

    const platformsSet = new Set();
    filtered.forEach(campaign => {
      const platform = getPlatformFromUrl(campaign.PlataformaTalento);
      if (platform) {
        platformsSet.add(platform);
      }
    });
    return Array.from(platformsSet).sort();
  });

  // Talentos disponibles (filtrados por cliente, campaña y plataforma)
  const availableTalents = computed(() => {
    let filtered = campaigns.value;

    if (filters.value.client && filters.value.client !== 'all') {
      filtered = filtered.filter(c => c.NombreCliente === filters.value.client);
    }
    if (filters.value.campaign && filters.value.campaign !== 'all') {
      filtered = filtered.filter(c => c.NombreCampana === filters.value.campaign);
    }
    if (filters.value.source && filters.value.source !== 'all') {
      filtered = filtered.filter(c => getPlatformFromUrl(c.PlataformaTalento) === filters.value.source);
    }

    return Array.from(new Set(filtered.map(c => c.NombreTalento))).sort();
  });

  // Función para calcular duración en minutos
  const calculateDurationInMinutes = (campaign) => {
    if (!campaign.timestamp_inicio || !campaign.Timestamp_fin) {
      return 0;
    }

    const start = new Date(campaign.timestamp_inicio);
    const end = new Date(campaign.Timestamp_fin);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return 0;
    }

    return Math.round((end - start) / (1000 * 60));
  };

  const filteredCampaignsWithDuration = computed(() => {
    return filteredCampaigns.value.map(campaign => {
      const duration = calculateDurationInMinutes(campaign);

      return {
        ...campaign,
        duration
      };
    });
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
      campaign: 'all',
      source: 'all',
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
    filteredCampaignsWithDuration,
    loading,
    error,
    filters,
    // Computed
    availableClients,
    availableCampaigns,
    availablePlatforms,
    availableTalents,
    // Acciones
    setCampaigns,
    setFilters,
    resetFilters,
    setLoading,
    setError,
    clearData
  };
});

