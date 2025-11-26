
/**
 * Filtra campañas según criterios
 */
export function filterCampaigns(campaigns, filters) {
  if (!campaigns || campaigns.length === 0) return [];
  
  let filtered = [...campaigns];

  // Filtro por Talento
  if (filters.talent && filters.talent !== 'all') {
    filtered = filtered.filter(campaign => 
      campaign.NombreTalento === filters.talent
    );
  }

  // Filtro por Cliente
  if (filters.client && filters.client !== 'all') {
    filtered = filtered.filter(campaign => 
      campaign.NombreCliente === filters.client
    );
  }

  // Búsqueda global
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(campaign => {
      return (
        (campaign.NombreCampana && campaign.NombreCampana.toLowerCase().includes(query)) ||
        (campaign.NombreCliente && campaign.NombreCliente.toLowerCase().includes(query)) ||
        (campaign.NombreTalento && campaign.NombreTalento.toLowerCase().includes(query)) ||
        (campaign.entregables_URL && campaign.entregables_URL.toLowerCase().includes(query))
      );
    });
  }

  return filtered;
}


/**
 * Obtiene lista única de talentos
 */
export function getAvailableTalents(campaigns) {
  const talentsSet = new Set();
  
  campaigns.forEach(campaign => {
    if (campaign.NombreTalento) {
      talentsSet.add(campaign.NombreTalento);
    }
  });

  return Array.from(talentsSet).sort();
}



