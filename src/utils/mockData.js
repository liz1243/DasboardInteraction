/**
 * Datos mock para pruebas sin necesidad de Excel
 * Formato compatible con la estructura esperada del Excel
 */
export const mockCampaigns = [

];

/**
 * Función helper para cargar datos mock en el store
 * Útil para desarrollo y pruebas
 */
export function loadMockData(store) {
  store.setCampaigns(mockCampaigns);
}

