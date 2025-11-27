/**
 * Funciones helper para generar rutas
 */

/**
 * Genera la URL para la vista de cliente
 * @param {string} cliente - Nombre del cliente
 * @param {string|null} talento - Nombre del talento (opcional)
 * @param {string|null} source - Plataforma/source (youtube, kick, twitch) (opcional)
 * @returns {string} URL codificada
 */
export function getClientRoute(cliente, talento = null, source = null) {
  if (!cliente) return '/';
  
  // Codificar el cliente (reemplazar espacios con %20)
  const clienteEncoded = encodeURIComponent(cliente);
  
  // Construir la ruta con los parámetros opcionales
  let route = `/client/${clienteEncoded}`;
  
  if (talento) {
    const talentoEncoded = encodeURIComponent(talento);
    route += `/${talentoEncoded}`;
    
    if (source) {
      const sourceEncoded = encodeURIComponent(source);
      route += `/${sourceEncoded}`;
    }
  } else if (source) {
    // Si hay source pero no talento, necesitamos un placeholder o saltar talento
    // Por ahora, solo agregamos source si también hay talento
    // Si necesitas source sin talento, podrías usar: route += `/_/${sourceEncoded}`
  }
  
  return route;
}

/**
 * Decodifica los parámetros de la ruta
 * @param {string} param - Parámetro codificado
 * @returns {string} Parámetro decodificado
 */
export function decodeRouteParam(param) {
  if (!param) return null;
  return decodeURIComponent(param);
}


