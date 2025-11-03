import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  calculateKPIs, 
  groupByDate, 
  calculateEngagementByDate,
  getClientPieData,
  getClientBarData,
  getEngagementByVideo,
  filterCampaigns,
  getAvailableMonths,
  getAvailableCampaigns,
  getAvailableTalents
} from '@/utils/kpiCalculations.js';

export const useDashboardStore = defineStore('dashboard', () => {
  // Estado
  const campaigns = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  // Filtros
  const filters = ref({
    month: 'all',
    campaign: 'all',
    client: 'all',
    talent: 'all',
    dateStart: '',
    dateEnd: '',
    viewsMin: '',
    viewsMax: '',
    likesMin: '',
    likesMax: '',
    commentsMin: '',
    commentsMax: '',
    engagementMin: '',
    searchQuery: ''
  });

  // Computed - Campañas filtradas
  const filteredCampaigns = computed(() => {
    return filterCampaigns(campaigns.value, filters.value);
  });

  // Computed - KPIs de campañas filtradas
  const kpis = computed(() => {
    return calculateKPIs(filteredCampaigns.value);
  });

  const chartDataViews = computed(() => {
    const grouped = groupByDate(filteredCampaigns.value);
    const dates = Object.keys(grouped).sort();
    
    return {
      labels: dates,
      views: dates.map(date => grouped[date].views),
      likes: dates.map(date => grouped[date].likes),
      comments: dates.map(date => grouped[date].comments)
    };
  });

  const chartDataEngagement = computed(() => {
    const engagementData = calculateEngagementByDate(filteredCampaigns.value);
    
    return {
      labels: engagementData.map(item => item.date),
      engagement: engagementData.map(item => item.engagement)
    };
  });

  // Datos por cliente
  const chartDataClientPie = computed(() => {
    return getClientPieData(filteredCampaigns.value);
  });

  const chartDataClientBar = computed(() => {
    return getClientBarData(filteredCampaigns.value);
  });

  // Engagement por video
  const engagementByVideo = computed(() => {
    return getEngagementByVideo(filteredCampaigns.value);
  });

  // Opciones de filtros
  const availableMonths = computed(() => {
    return getAvailableMonths(campaigns.value);
  });

  const availableCampaigns = computed(() => {
    return getAvailableCampaigns(campaigns.value);
  });

  const availableTalents = computed(() => {
    return getAvailableTalents(campaigns.value);
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
      month: 'all',
      campaign: 'all',
      client: 'all',
      talent: 'all',
      dateStart: '',
      dateEnd: '',
      viewsMin: '',
      viewsMax: '',
      likesMin: '',
      likesMax: '',
      commentsMin: '',
      commentsMax: '',
      engagementMin: '',
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
    kpis,
    chartDataViews,
    chartDataEngagement,
    chartDataClientPie,
    chartDataClientBar,
    engagementByVideo,
    availableMonths,
    availableCampaigns,
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

