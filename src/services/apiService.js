/**
 * Servicio para hacer peticiones HTTP a la API
 * Usa fetch (nativo del navegador)
 */

// URL de la API de Google Apps Script
const GOOGLE_APPS_SCRIPT_URL ='https://script.google.com/macros/s/AKfycbwvdZbqqTaaP-zi9nHkrd_jckMuRWC0QkZFxO9ayfaEZDszqLOWEIFm6WWjdf2TXPE/exec'; 
//'https://script.google.com/macros/s/AKfycbzFvwGG2SylsmfsqaFiSn6wKwIvZOudgjbFFJDXmgOvh863vTQEqCJLEV5mH7KobpUAXQ/exec';

/**
 * Transforma los datos de la API (formato anidado) al formato plano esperado
 * La API devuelve: { success, total, data: [{ id, ..., entregables: [...] }] }
 * Transforma a: [{ id, ..., entregables_URL, Tituloentregable, ... }] (un objeto por entregable)
 */
const transformApiData = (apiResponse) => {
  if (!apiResponse.success || !apiResponse.data) {
    throw new Error('Respuesta de API inválida');
  }

  const flatCampaigns = [];

  apiResponse.data.forEach(campaign => {
    // Si tiene entregables, crear un objeto por cada entregable
    if (campaign.entregables && Array.isArray(campaign.entregables) && campaign.entregables.length > 0) {
      campaign.entregables.forEach(entregable => {
        flatCampaigns.push({
          id: campaign.id,
          NombreCampana: campaign.NombreCampana,
          NombreCliente: campaign.NombreCliente,
          NombreTalento: campaign.NombreTalento,
          PlataformaTalento: campaign.PlataformaTalento,
          FTDs: campaign.FTDs || 0,
          FTDObtenido: campaign.FTDObtenido || 0,
          // Datos del entregable
          entregables_URL: entregable.entregables_URL || '',
          Tituloentregable: entregable.Tituloentregable || '',
          entregables_fecha: entregable.entregables_fecha || '',
          Time: entregable.Time || 0,
          'Avg Viewers': entregable['Avg Viewers'] || 0,
          'Peak Viewers': entregable['Peak Viewers'] || 0,
          'Minutes Watched': entregable['Minutes Watched'] || 0,
          // Views, Likes, Comments (si no vienen, se normalizarán después)
          Views: entregable.Views || entregable['Peak Viewers'] || 0,
          Likes: entregable.Likes || 0,
          Comments: entregable.Comments || 0,
          // Nuevos campos de monetización del entregable
          CPA: entregable.cpa || entregable.CPAObtenido || entregable.CPAobtenido || 0,
          Revenue: entregable.NRG || 0,
          Deposits: entregable.Deposito_timestamp || entregable.Deposito || 0,
          FTDActual: entregable.FTDActual || 0,
          Presupuesto: entregable.Presupuesto || 0,
          PrecioVenta: entregable.precio_venta || 0,
          PrecioVentaEntregable: entregable.PrecioVentaxEntegable || 0,
          FTDobjetivo: entregable.FTDobjetivo || 0,
          // Campos de conversión
          Registros: entregable.Registro_timestamp || 0,
          Clicks: entregable.FTD_timestamp || 0
        });
      });
    } else {
      // Si no tiene entregables, crear un objeto con los datos de la campaña
      flatCampaigns.push({
        id: campaign.id,
        NombreCampana: campaign.NombreCampana,
        NombreCliente: campaign.NombreCliente,
        NombreTalento: campaign.NombreTalento,
        PlataformaTalento: campaign.PlataformaTalento,
        FTDs: campaign.FTDs || 0,
        FTDObtenido: campaign.FTDObtenido || 0,
        entregables_URL: '',
        Tituloentregable: '',
        entregables_fecha: '',
        Time: 0,
        'Avg Viewers': 0,
        'Peak Viewers': 0,
        'Minutes Watched': 0,
        Views: 0,
        Likes: 0,
        Comments: 0,
        // Nuevos campos de monetización
        CPA: 0,
        Revenue: 0,
        Deposits: 0,
        FTDActual: 0,
        Presupuesto: 0,
        FTDobjetivo: 0
      });
    }
  });

  return flatCampaigns;
};

/**
 * Construye la URL con parámetros de consulta
 */
const buildApiUrl = (params = {}) => {
  // Si no hay parámetros, devolver la URL base
  if (!params.cliente && !params.talento && !params.source) {
    return GOOGLE_APPS_SCRIPT_URL;
  }
  
  // Construir URL con parámetros
  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  if (params.cliente) {
    url.searchParams.append('cliente', params.cliente);
  }
  if (params.talento) {
    url.searchParams.append('talento', params.talento);
  }
  if (params.source) {
    url.searchParams.append('source', params.source);
  }
  
  return url.toString();
};

// Opción 1: Usando FETCH (nativo, no requiere instalación)
export const fetchCampaigns = async (filters = {}) => {
  try {
    // Construir URL con parámetros opcionales
    const API_URL = buildApiUrl(filters);
    
    const response = await fetch(API_URL)
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    // Parsear JSON
    const apiResponse = await response.json();
    
    // Transformar datos del formato API al formato esperado
    const transformedData = transformApiData(apiResponse);
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

// Opción 2: Usando FETCH con manejo de errores mejorado y reintentos
export const fetchCampaignsWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const API_URL = GOOGLE_APPS_SCRIPT_URL;
      
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const apiResponse = await response.json();
      const transformedData = transformApiData(apiResponse);
      return transformedData;
    } catch (error) {
      if (i === retries - 1) throw error; // Último intento
      console.warn(`Intento ${i + 1} fallido, reintentando...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Esperar antes de reintentar
    }
  }
};

// Función para obtener una campaña específica por ID
export const fetchCampaignById = async (campaignId) => {
  try {
    // Obtener todas las campañas y filtrar por ID
    const allCampaigns = await fetchCampaigns();
    const campaign = allCampaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
      throw new Error(`Campaña con ID ${campaignId} no encontrada`);
    }
    
    return campaign;
  } catch (error) {
    console.error('Error fetching campaign by ID:', error);
    throw error;
  }
};

// Función para obtener campañas por cliente (usa parámetros de la API)
export const fetchCampaignsByClient = async (clientName, talentName = null, source = null) => {
  try {
    // Usar los parámetros de la API para filtrar directamente en el servidor
    const filters = { cliente: clientName };
    if (talentName) {
      filters.talento = talentName;
    }
    if (source) {
      filters.source = source;
    }
    
    const filtered = await fetchCampaigns(filters);
    return filtered;
  } catch (error) {
    console.error('Error fetching campaigns by client:', error);
    throw error;
  }
};

