<template>
  <div class="dashboard-view">
    <!-- Sidebar de Filtros Avanzados -->

    <div class="dashboard-header">
      <nav class="navbar">
        <div class="navbar-brand">
          <h1 class="dashboard-title">Engagement Dashboard</h1>
          <p class="dashboard-subtitle">Campaign metrics and engagement analysis</p>
        </div>
        <div class="navbar-actions">
          <button 
            @click="showUploadModal = true" 
            class="btn-upload-navbar"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload Excel</span>
          </button>
        </div>
      </nav>
    </div>

    <!-- Modal de carga de Excel -->
    <Modal 
      v-model:show="showUploadModal" 
      title="Upload Campaign Data"
      @close="handleModalClose"
    >
      <UploadExcel 
        ref="uploadComponent"
        @upload="handleFileUpload" 
      />
    </Modal>

    <!-- Panel de Filtros -->
    <div class="row mb-4" v-if="dashboardStore.campaigns.length > 0">
      <div class="col-12">
        <FiltersSidebar
          :filters="dashboardStore.filters"
          :available-clients="dashboardStore.availableClients"
          :available-talents="dashboardStore.availableTalents"
          @update-filters="handleUpdateFilters"
          @clear-filters="handleClearFilters"
        />
      </div>
    </div>

    <!-- KPIs -->
    <div class="row mb-4 kpis-container" v-if="dashboardStore.kpis.totalViews > 0">
      <div class="col-kpi">
        <KpiCard
          title="Total Views"
          :value="dashboardStore.kpis.totalViews"
          color="cyan"
        >
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </template>
        </KpiCard>
      </div>
      <div class="col-kpi">
        <KpiCard
          title="Total Likes"
          :value="dashboardStore.kpis.totalLikes"
          color="pink"
        >
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </template>
        </KpiCard>
      </div>
      <div class="col-kpi">
        <KpiCard
          title="Total Comments"
          :value="dashboardStore.kpis.totalComments"
          color="green"
        >
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </template>
        </KpiCard>
      </div>
      <div class="col-kpi">
        <KpiCard
          title="Engagement Rate"
          :value="dashboardStore.kpis.engagementRate"
          format="percentage"
          color="blue"
        >
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </template>
        </KpiCard>
      </div>
      <div class="col-kpi">
        <KpiCard
          title="Number of Videos"
          :value="dashboardStore.kpis.totalVideos"
          color="cyan"
        >
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </template>
        </KpiCard>
      </div>
    </div>

    <!-- Gráficas por Cliente -->
    <div class="row mb-4" v-if="dashboardStore.kpis.totalViews > 0 && dashboardStore.chartDataClientPie.labels.length > 0">
      <div class="col-lg-6 mb-3">
        <div style="height: 450px;">
          <ChartPieClient
            :labels="dashboardStore.chartDataClientPie.labels"
            :data="dashboardStore.chartDataClientPie.data"
          />
        </div>
      </div>
      <div class="col-lg-6 mb-3">
        <div style="height: 450px;">
          <ChartBarClient
            :labels="dashboardStore.chartDataClientBar.labels"
            :views="dashboardStore.chartDataClientBar.views"
            :likes="dashboardStore.chartDataClientBar.likes"
            :comments="dashboardStore.chartDataClientBar.comments"
          />
        </div>
      </div>
    </div>

    <!-- Gráficas por Fecha -->
    <div class="row mb-4" v-if="dashboardStore.kpis.totalViews > 0">
      <div class="col-lg-8 mb-3">
        <div style="height: 400px;">
          <ChartViews
            :campaigns="dashboardStore.filteredCampaigns"
          />
        </div>
      </div>
      <div class="col-lg-4 mb-3">
        <div style="height: 400px;">
          <ChartEngagement
            :labels="dashboardStore.chartDataEngagement.labels"
            :engagement="dashboardStore.chartDataEngagement.engagement"
          />
        </div>
      </div>
    </div>

    <!-- Engagement por Video -->
    <div class="row mb-4" v-if="dashboardStore.kpis.totalViews > 0 && dashboardStore.engagementByVideo.length > 0">
      <div class="col-12">
        <div style="height: 500px;">
          <ChartEngagementByVideo
            :videos="dashboardStore.engagementByVideo"
          />
        </div>
      </div>
    </div>

    <!-- Tabla de campañas -->
    <div class="row">
      <div class="col-12">
        <TableCampaign 
          :campaigns="dashboardStore.filteredCampaigns"
          :search-query="dashboardStore.filters.searchQuery"
          @update-search="handleSearchUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDashboardStore } from './dashboardStore.js';
import { DashboardService } from './dashboardService.js';
import { loadMockData } from '@/utils/mockData.js';
import UploadExcel from '@/components/UploadExcel.vue';
import Modal from '@/components/Modal.vue';
import KpiCard from '@/components/KpiCard.vue';
import ChartViews from '@/components/ChartViews.vue';
import ChartEngagement from '@/components/ChartEngagement.vue';
import ChartPieClient from '@/components/ChartPieClient.vue';
import ChartBarClient from '@/components/ChartBarClient.vue';
import ChartEngagementByVideo from '@/components/ChartEngagementByVideo.vue';
import FiltersPanel from '@/components/FiltersPanel.vue';
import FiltersSidebar from '@/components/FiltersSidebar.vue';
import TableCampaign from '@/components/TableCampaign.vue';

const dashboardStore = useDashboardStore();
const uploadComponent = ref(null);
const showUploadModal = ref(false);

// Cargar datos mock al iniciar si no hay datos
onMounted(() => {
  if (dashboardStore.campaigns.length === 0) {
    loadMockData(dashboardStore);
  }
});

const handleFileUpload = async (file) => {
  dashboardStore.setLoading(true);
  
  const result = await DashboardService.processExcelFile(file);
  
  if (result.success) {
    dashboardStore.setCampaigns(result.data);
    if (uploadComponent.value) {
      uploadComponent.value.clearFile();
    }
  } else {
    dashboardStore.setError(result.error);
    if (uploadComponent.value) {
      uploadComponent.value.setError(result.error);
    }
  }
  
  dashboardStore.setLoading(false);
};

const handleUpdateFilters = (newFilters) => {
  dashboardStore.setFilters(newFilters);
};

const handleClearFilters = () => {
  dashboardStore.resetFilters();
};

const handleSearchUpdate = (searchQuery) => {
  dashboardStore.setFilters({ searchQuery });
};

const handleModalClose = () => {
  if (uploadComponent.value) {
    uploadComponent.value.clearFile();
  }
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
  text-align: center;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-pink) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-sm);
}

.dashboard-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .dashboard-view {
    padding: var(--spacing-lg);
  }

  .dashboard-title {
    font-size: 2rem;
  }
}

.navbar {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.navbar-brand {
  flex: 1;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.btn-upload-navbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-pink) 100%);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 2px 8px rgba(0, 234, 255, 0.3);
}

.btn-upload-navbar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 234, 255, 0.4);
}

/* KPIs Container - 5 columnas sin espacios */
.kpis-container {
  display: flex;
  margin-left: 0;
  margin-right: 0;
  gap: 0;
}

.kpis-container .col-kpi {
  flex: 1 1 20%;
  max-width: 20%;
  padding-left: calc(var(--spacing-xs) / 2);
  padding-right: calc(var(--spacing-xs) / 2);
  margin-bottom: 0;
}

.kpis-container .col-kpi:first-child {
  padding-left: 0;
}

.kpis-container .col-kpi:last-child {
  padding-right: 0;
}

/* Responsive para tablets */
@media (max-width: 991px) {
  .kpis-container .col-kpi {
    flex: 1 1 33.333%;
    max-width: 33.333%;
  }
  
  .kpis-container .col-kpi:nth-child(4) {
    flex: 1 1 50%;
    max-width: 50%;
  }
  
  .kpis-container .col-kpi:nth-child(5) {
    flex: 1 1 50%;
    max-width: 50%;
  }
}

/* Responsive para móviles */
@media (max-width: 767px) {
  .kpis-container {
    flex-wrap: wrap;
  }
  
  .kpis-container .col-kpi {
    flex: 1 1 50%;
    max-width: 50%;
    padding-left: calc(var(--spacing-xs) / 2);
    padding-right: calc(var(--spacing-xs) / 2);
    margin-bottom: var(--spacing-sm);
  }
  
  .kpis-container .col-kpi:nth-child(5) {
    flex: 1 1 100%;
    max-width: 100%;
  }
}

@media (max-width: 575px) {
  .kpis-container .col-kpi {
    flex: 1 1 100%;
    max-width: 100%;
    padding-left: 0;
    padding-right: 0;
  }
}
</style>

