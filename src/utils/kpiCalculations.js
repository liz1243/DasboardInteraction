
/**
 * Helper para detectar plataforma desde PlataformaTalento
 */
export function getPlatformFromUrl(url) {
  if (!url) return null;
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube')) return 'youtube';
  if (urlLower.includes('kick.com') || urlLower.includes('kick')) return 'kick';
  if (urlLower.includes('twitch')) return 'twitch';
  return null;
}

/**
 * Filtra campañas según criterios
 */
export function filterCampaigns(campaigns, filters) {
  if (!campaigns || campaigns.length === 0) return [];
  
  let filtered = [...campaigns];

  // Filtro por Plataforma (Source)
  if (filters.source && filters.source !== 'all') {
    filtered = filtered.filter(campaign => {
      const platform = getPlatformFromUrl(campaign.PlataformaTalento);
      return platform === filters.source;
    });
  }

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

  // Filtro por rango de fechas (entregables_fecha)
  if (filters.dateStart || filters.dateEnd) {
    filtered = filtered.filter(campaign => {
      if (!campaign.entregables_fecha) return false;
      
      const campaignDateStr = campaign.entregables_fecha.toString().trim();
      const dateMatch = campaignDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      
      if (!dateMatch) return false;
      
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);
      const campaignDate = new Date(year, month - 1, day);
      
      if (filters.dateStart) {
        const startDate = new Date(filters.dateStart);
        startDate.setHours(0, 0, 0, 0);
        if (campaignDate < startDate) return false;
      }
      
      if (filters.dateEnd) {
        const endDate = new Date(filters.dateEnd);
        endDate.setHours(23, 59, 59, 999);
        if (campaignDate > endDate) return false;
      }
      
      return true;
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



