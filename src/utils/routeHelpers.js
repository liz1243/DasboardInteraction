/**
 * Funciones helper para generar rutas
 */

/**
 * Genera la URL para la vista de cliente
 * @param {string} cliente - Nombre del cliente
 * @param {string|null} talento - Nombre del talento (opcional)
 * @returns {string} URL codificada
 */
export function getClientRoute(cliente, talento = null) {
  if (!cliente) return '/';
  
  // Codificar el cliente (reemplazar espacios con %20)
  const clienteEncoded = encodeURIComponent(cliente);
  
  // Si hay talento, agregarlo a la ruta
  if (talento) {
    const talentoEncoded = encodeURIComponent(talento);
    return `/client/${clienteEncoded}/${talentoEncoded}`;
  }
  
  return `/client/${clienteEncoded}`;
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

