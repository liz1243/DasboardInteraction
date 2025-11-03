/**
 * Calcula los KPIs basados en los datos de campañas
 */

export function calculateKPIs(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      engagementRate: 0,
      totalVideos: 0
    };
  }

  const totalViews = campaigns.reduce((sum, campaign) => {
    return sum + (parseInt(campaign.Views) || 0);
  }, 0);

  const totalLikes = campaigns.reduce((sum, campaign) => {
    return sum + (parseInt(campaign.Likes) || 0);
  }, 0);

  const totalComments = campaigns.reduce((sum, campaign) => {
    return sum + (parseInt(campaign.Comments) || 0);
  }, 0);

  const engagementRate = totalViews > 0
    ? ((totalLikes + totalComments) / totalViews) * 100
    : 0;

  const totalVideos = campaigns.length;

  return {
    totalViews,
    totalLikes,
    totalComments,
    engagementRate: Number(engagementRate.toFixed(2)),
    totalVideos
  };
}

/**
 * Agrupa datos por fecha para gráficas
 */
export function groupByDate(campaigns) {
  const grouped = {};

  campaigns.forEach(campaign => {
    const date = campaign.entregables_fecha || 'No date';
    
    if (!grouped[date]) {
      grouped[date] = {
        views: 0,
        likes: 0,
        comments: 0
      };
    }

    grouped[date].views += parseInt(campaign.Views) || 0;
    grouped[date].likes += parseInt(campaign.Likes) || 0;
    grouped[date].comments += parseInt(campaign.Comments) || 0;
  });

  return grouped;
}

/**
 * Calcula engagement por fecha
 */
export function calculateEngagementByDate(campaigns) {
  const grouped = groupByDate(campaigns);
  const result = [];

  Object.keys(grouped).forEach(date => {
    const data = grouped[date];
    const engagement = data.views > 0
      ? ((data.likes + data.comments) / data.views) * 100
      : 0;

    result.push({
      date,
      engagement: Number(engagement.toFixed(2)),
      views: data.views,
      likes: data.likes,
      comments: data.comments
    });
  });

  return result.sort((a, b) => {
    // Ordenar por fecha
    return new Date(a.date) - new Date(b.date);
  });
}

/**
 * Agrupa datos por cliente
 */
export function groupByClient(campaigns) {
  const grouped = {};

  campaigns.forEach(campaign => {
    const client = campaign.NombreCliente || 'No client';
    
    if (!grouped[client]) {
      grouped[client] = {
        views: 0,
        likes: 0,
        comments: 0,
        videos: 0,
        campaigns: new Set()
      };
    }

    grouped[client].views += parseInt(campaign.Views) || 0;
    grouped[client].likes += parseInt(campaign.Likes) || 0;
    grouped[client].comments += parseInt(campaign.Comments) || 0;
    grouped[client].videos += 1;
    if (campaign.NombreCampana) {
      grouped[client].campaigns.add(campaign.NombreCampana);
    }
  });

  // Convertir Set a número de campañas únicas
  Object.keys(grouped).forEach(client => {
    grouped[client].campaigns = grouped[client].campaigns.size;
  });

  return grouped;
}

/**
 * Obtiene datos para gráfica de torta por cliente (por views)
 */
export function getClientPieData(campaigns) {
  const grouped = groupByClient(campaigns);
  const clients = Object.keys(grouped).sort((a, b) => 
    grouped[b].views - grouped[a].views
  );

  return {
    labels: clients,
    data: clients.map(client => grouped[client].views)
  };
}

/**
 * Obtiene datos para gráfica de barras por cliente
 */
export function getClientBarData(campaigns) {
  const grouped = groupByClient(campaigns);
  const clients = Object.keys(grouped).sort((a, b) => 
    grouped[b].views - grouped[a].views
  );

  return {
    labels: clients,
    views: clients.map(client => grouped[client].views),
    likes: clients.map(client => grouped[client].likes),
    comments: clients.map(client => grouped[client].comments),
    videos: clients.map(client => grouped[client].videos),
    campaigns: clients.map(client => grouped[client].campaigns)
  };
}

/**
 * Filtra campañas según criterios
 */
export function filterCampaigns(campaigns, filters) {
  if (!campaigns || campaigns.length === 0) return [];
  
  let filtered = [...campaigns];

  // Filtro por mes
  if (filters.month && filters.month !== 'all') {
    filtered = filtered.filter(campaign => {
      try {
        const date = new Date(campaign.entregables_fecha);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const yearMonth = `${date.getFullYear()}-${month}`;
        return yearMonth === filters.month;
      } catch {
        return false;
      }
    });
  }

  // Filtro por campaña
  if (filters.campaign && filters.campaign !== 'all') {
    filtered = filtered.filter(campaign => 
      campaign.NombreCampana === filters.campaign
    );
  }

  // Filtro por Views (rango)
  if (filters.viewsMin !== null && filters.viewsMin !== undefined && filters.viewsMin !== '') {
    filtered = filtered.filter(campaign => {
      const views = parseInt(campaign.Views) || 0;
      return views >= parseInt(filters.viewsMin);
    });
  }

  if (filters.viewsMax !== null && filters.viewsMax !== undefined && filters.viewsMax !== '') {
    filtered = filtered.filter(campaign => {
      const views = parseInt(campaign.Views) || 0;
      return views <= parseInt(filters.viewsMax);
    });
  }

  // Filtro por Likes (rango)
  if (filters.likesMin !== null && filters.likesMin !== undefined && filters.likesMin !== '') {
    filtered = filtered.filter(campaign => {
      const likes = parseInt(campaign.Likes) || 0;
      return likes >= parseInt(filters.likesMin);
    });
  }

  if (filters.likesMax !== null && filters.likesMax !== undefined && filters.likesMax !== '') {
    filtered = filtered.filter(campaign => {
      const likes = parseInt(campaign.Likes) || 0;
      return likes <= parseInt(filters.likesMax);
    });
  }

  // Filtro por Comments (rango)
  if (filters.commentsMin !== null && filters.commentsMin !== undefined && filters.commentsMin !== '') {
    filtered = filtered.filter(campaign => {
      const comments = parseInt(campaign.Comments) || 0;
      return comments >= parseInt(filters.commentsMin);
    });
  }

  if (filters.commentsMax !== null && filters.commentsMax !== undefined && filters.commentsMax !== '') {
    filtered = filtered.filter(campaign => {
      const comments = parseInt(campaign.Comments) || 0;
      return comments <= parseInt(filters.commentsMax);
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

  // Filtro por rango de fechas
  if (filters.dateStart || filters.dateEnd) {
    filtered = filterByDateRange(filtered, filters.dateStart, filters.dateEnd);
  }

  // Filtro por engagement mínimo
  if (filters.engagementMin !== null && filters.engagementMin !== undefined && filters.engagementMin !== '') {
    filtered = filtered.filter(campaign => {
      const views = parseInt(campaign.Views) || 0;
      const likes = parseInt(campaign.Likes) || 0;
      const comments = parseInt(campaign.Comments) || 0;
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
      return engagement >= parseFloat(filters.engagementMin);
    });
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
 * Obtiene lista única de meses disponibles
 */
export function getAvailableMonths(campaigns) {
  const monthsSet = new Set();
  
  campaigns.forEach(campaign => {
    try {
      const date = new Date(campaign.entregables_fecha);
      if (!isNaN(date.getTime())) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const yearMonth = `${date.getFullYear()}-${month}`;
        const monthLabel = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        monthsSet.add(JSON.stringify({ value: yearMonth, label: monthLabel }));
      }
    } catch {
      // Ignorar fechas inválidas
    }
  });

  return Array.from(monthsSet)
    .map(m => JSON.parse(m))
    .sort((a, b) => b.value.localeCompare(a.value));
}

/**
 * Obtiene lista única de campañas
 */
export function getAvailableCampaigns(campaigns) {
  const campaignsSet = new Set();
  
  campaigns.forEach(campaign => {
    if (campaign.NombreCampana) {
      campaignsSet.add(campaign.NombreCampana);
    }
  });

  return Array.from(campaignsSet).sort();
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

/**
 * Obtiene datos para gráfica de engagement por video
 */
export function getEngagementByVideo(campaigns) {
  const videos = campaigns.map(campaign => {
    const views = parseInt(campaign.Views) || 0;
    const likes = parseInt(campaign.Likes) || 0;
    const comments = parseInt(campaign.Comments) || 0;
    const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

    return {
      label: campaign.entregables_URL ? 
        campaign.entregables_URL.substring(campaign.entregables_URL.length - 11) : 
        campaign.NombreCampana || 'Untitled',
      fullLabel: campaign.entregables_URL || campaign.NombreCampana || 'Untitled',
      views,
      likes,
      comments,
      engagement: Number(engagement.toFixed(2)),
      campaign: campaign.NombreCampana,
      cliente: campaign.NombreCliente,
      talento: campaign.NombreTalento,
      fecha: campaign.entregables_fecha
    };
  });

  // Ordenar por engagement descendente
  return videos.sort((a, b) => b.engagement - a.engagement);
}

/**
 * Filtra por rango de fechas
 */
function filterByDateRange(campaigns, startDate, endDate) {
  if (!startDate && !endDate) return campaigns;

  return campaigns.filter(campaign => {
    try {
      const campaignDate = new Date(campaign.entregables_fecha);
      if (isNaN(campaignDate.getTime())) return false;

      if (startDate && campaignDate < new Date(startDate)) return false;
      if (endDate && campaignDate > new Date(endDate)) return false;

      return true;
    } catch {
      return false;
    }
  });
}

