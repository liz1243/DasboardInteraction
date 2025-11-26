import * as XLSX from 'xlsx';

/**
 * Exporta datos a Excel
 */
const isYouTube = (url) => {
  return url && url.includes('youtube');
};

export function exportToExcel(campaigns, filename = 'campañas') {
  const data = campaigns.map(campaign => {
    const views = parseInt(campaign.Views) || 0;
    const likes = parseInt(campaign.Likes) || 0;
    const comments = parseInt(campaign.Comments) || 0;
    // Solo calcular engagement con likes/comments si es YouTube
    const engagement = views > 0 && isYouTube(campaign.PlataformaTalento) 
      ? ((likes + comments) / views) * 100 
      : 0;

    return {
      'Campaña': campaign.NombreCampana || '',
      'Cliente': campaign.NombreCliente || '',
      'Talento': campaign.NombreTalento || '',
      'URL': campaign.entregables_URL || '',
      'Fecha': campaign.entregables_fecha || '',
      'Views': views,
      'Likes': likes,
      'Comments': comments,
      'Engagement %': Number(engagement.toFixed(2))
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Campañas');

  // Ajustar ancho de columnas
  const colWidths = [
    { wch: 20 }, // Campaña
    { wch: 20 }, // Cliente
    { wch: 20 }, // Talento
    { wch: 50 }, // URL
    { wch: 12 }, // Fecha
    { wch: 10 }, // Views
    { wch: 10 }, // Likes
    { wch: 10 }, // Comments
    { wch: 12 }  // Engagement %
  ];
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporta datos a CSV
 */
export function exportToCSV(campaigns, filename = 'campañas') {
  const headers = ['Campaña', 'Cliente', 'Talento', 'URL', 'Fecha', 'Views', 'Likes', 'Comments', 'Engagement %'];
  
  const rows = campaigns.map(campaign => {
    const views = parseInt(campaign.Views) || 0;
    const likes = parseInt(campaign.Likes) || 0;
    const comments = parseInt(campaign.Comments) || 0;
    // Solo calcular engagement con likes/comments si es YouTube
    const engagement = views > 0 && isYouTube(campaign.PlataformaTalento) 
      ? ((likes + comments) / views) * 100 
      : 0;

    return [
      campaign.NombreCampana || '',
      campaign.NombreCliente || '',
      campaign.NombreTalento || '',
      campaign.entregables_URL || '',
      campaign.entregables_fecha || '',
      views,
      likes,
      comments,
      Number(engagement.toFixed(2))
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escapar comillas y envolver en comillas si contiene coma o comilla
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

