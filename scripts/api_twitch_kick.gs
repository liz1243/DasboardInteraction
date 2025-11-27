/**
 * API REST para exponer datos de Google Sheets
 * Con estructura agrupada por Cliente y Talento
 */

/**
 * Función GET - Endpoint principal de la API
 */
function doGet(e) {
  try {
    var params = e.parameter;
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Obtener el parámetro source
    var source = params.source;

    // Verificar si se solicita estructura agrupada o plana
    var grouped = params.grouped !== 'false'; // Por defecto true

    var datos;

    // Si no se especifica source, combinar ambas hojas
    if (!source || source === '') {
      var sheetKickTwitch = spreadsheet.getSheetByName('Kick Twitch');
      var sheetYoutube = spreadsheet.getSheetByName('Youtube');

      if (grouped) {
        // Obtener datos agrupados de ambas hojas
        var datosKickTwitch = sheetKickTwitch ? obtenerDatosAgrupados(sheetKickTwitch, params, 'Kick Twitch') : [];
        var datosYoutube = sheetYoutube ? obtenerDatosAgrupados(sheetYoutube, params, 'Youtube') : [];

        // Combinar los resultados
        datos = datosKickTwitch.concat(datosYoutube);
      } else {
        // Obtener datos planos de ambas hojas
        var datosKickTwitch = sheetKickTwitch ? obtenerDatosPlanos(sheetKickTwitch, 'Kick Twitch') : [];
        var datosYoutube = sheetYoutube ? obtenerDatosPlanos(sheetYoutube, 'Youtube') : [];

        // Combinar los resultados
        datos = datosKickTwitch.concat(datosYoutube);

        // Aplicar filtros para estructura plana
        if (params.campana) {
          datos = datos.filter(function(item) {
            return item.NombreCampana === params.campana;
          });
        }
        if (params.cliente) {
          datos = datos.filter(function(item) {
            return item.NombreCliente === params.cliente;
          });
        }
        if (params.talento) {
          datos = datos.filter(function(item) {
            return item.NombreTalento === params.talento;
          });
        }
      }

      // Aplicar límite si existe
      if (params.limit) {
        datos = datos.slice(0, parseInt(params.limit));
      }

      source = 'all'; // Indicar que se consultaron todas las hojas
    } else {
      // Seleccionar una hoja específica
      var sheet;

      if (source === 'youtube') {
        sheet = spreadsheet.getSheetByName('Youtube');
      } else if (source === 'kicktwitch') {
        sheet = spreadsheet.getSheetByName('Kick Twitch');
      }

      // Verificar que la hoja existe
      if (!sheet) {
        throw new Error('Hoja no encontrada: ' + source);
      }

      var sheetName = sheet.getName();

      if (grouped) {
        datos = obtenerDatosAgrupados(sheet, params, sheetName);
      } else {
        datos = obtenerDatosPlanos(sheet, sheetName);

        // Filtros para estructura plana
        if (params.campana) {
          datos = datos.filter(function(item) {
            return item.NombreCampana === params.campana;
          });
        }
        if (params.cliente) {
          datos = datos.filter(function(item) {
            return item.NombreCliente === params.cliente;
          });
        }
        if (params.talento) {
          datos = datos.filter(function(item) {
            return item.NombreTalento === params.talento;
          });
        }
        if (params.limit) {
          datos = datos.slice(0, parseInt(params.limit));
        }
      }
    }
    
    // Respuesta exitosa
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        total: Array.isArray(datos) ? datos.length : Object.keys(datos).length,
        data: datos,
        source: source,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtener valor de columna de manera segura
 * Retorna 0 si la columna no existe o está vacía
 */
function obtenerValorSeguro(fila, indice, valorPorDefecto) {
  if (indice < 0 || indice >= fila.length) {
    return valorPorDefecto !== undefined ? valorPorDefecto : 0;
  }
  var valor = fila[indice];
  if (valor === null || valor === undefined || valor === '') {
    return valorPorDefecto !== undefined ? valorPorDefecto : 0;
  }
  return valor;
}

/**
 * Obtener mapeo de columnas según la hoja
 */
function obtenerMapeoColumnas(sheetName) {
  if (sheetName === 'Youtube') {
    return {
      nombreCampana: 1,
      nombreCliente: 2,
      nombreTalento: 3,
      plataformaTalento: 4,
      entregablesURL: 5,
      entregablesFecha: 6,
      tituloEntregable: 7,
      ftds: -1,  // No existe en Youtube
      ftdObtenido: -1,  // No existe en Youtube
      time: -1,  // No existe en Youtube
      avgViewers: -1,  // No existe en Youtube
      peakViewers: -1,  // No existe en Youtube
      minutesWatched: -1,  // No existe en Youtube
      views: 8,  // Específico de Youtube
      likes: 9,  // Específico de Youtube
      comments: 10  // Específico de Youtube
    };
  } else {
    // Kick Twitch (por defecto)
    return {
      nombreCampana: 0,
      nombreCliente: 1,
      nombreTalento: 2,
      plataformaTalento: 3,
      entregablesURL: 4,
      tituloEntregable: 5,
      entregablesFecha: 6,
      ftds: 7,
      ftdObtenido: 8,
      time: 9,
      avgViewers: 10,
      peakViewers: 11,
      minutesWatched: 12,
      views: -1,  // No existe en Kick Twitch
      likes: -1,  // No existe en Kick Twitch
      comments: -1  // No existe en Kick Twitch
    };
  }
}

/**
 * Obtener datos agrupados por Cliente y Talento con filtros aplicados
 */
function obtenerDatosAgrupados(sheet, params, sheetName) {
  var datos = sheet.getDataRange().getValues();
  var grupos = {};
  var contadorGlobal = 1;

  // Obtener mapeo de columnas según la hoja
  var mapeo = obtenerMapeoColumnas(sheetName);

  // Procesar cada fila (empezando desde 1 para saltar encabezados)
  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];

    var nombreCampana = obtenerValorSeguro(fila, mapeo.nombreCampana, '');
    var nombreCliente = obtenerValorSeguro(fila, mapeo.nombreCliente, '');
    var nombreTalento = obtenerValorSeguro(fila, mapeo.nombreTalento, '');
    var plataformaTalento = obtenerValorSeguro(fila, mapeo.plataformaTalento, '');
    var ftds = obtenerValorSeguro(fila, mapeo.ftds, 0);
    var ftdObtenido = obtenerValorSeguro(fila, mapeo.ftdObtenido, 0);
    
    // Aplicar filtros antes de agregar
    if (params) {
      if (params.campana && nombreCampana !== params.campana) continue;
      if (params.cliente && nombreCliente !== params.cliente) continue;
      if (params.talento && nombreTalento !== params.talento) continue;
    }
    
    // Crear clave única para agrupar: Cliente + Talento
    var clave = nombreCliente + '|' + nombreTalento;
    
    // Si no existe el grupo, crearlo
    if (!grupos[clave]) {
      grupos[clave] = {
        "id": generarID(contadorGlobal),
        "NombreCampana": nombreCampana,
        "NombreCliente": nombreCliente,
        "NombreTalento": nombreTalento,
        "PlataformaTalento": plataformaTalento,
        "FTDs": ftds,
        "FTDObtenido": ftdObtenido,
        "entregables": []
      };
    }
    
    // Construir entregable base
    var entregable = {
      "entregable_id": "ent-" + contadorGlobal.toString().padStart(3, '0'),
      "entregables_URL": obtenerValorSeguro(fila, mapeo.entregablesURL, ''),
      "Tituloentregable": obtenerValorSeguro(fila, mapeo.tituloEntregable, ''),
      "entregables_fecha": formatearFecha(obtenerValorSeguro(fila, mapeo.entregablesFecha, ''))
    };

    // Agregar campos específicos según la hoja
    if (sheetName === 'Youtube') {
      entregable["Views"] = obtenerValorSeguro(fila, mapeo.views, 0);
      entregable["Likes"] = obtenerValorSeguro(fila, mapeo.likes, 0);
      entregable["Comments"] = obtenerValorSeguro(fila, mapeo.comments, 0);
    } else {
      // Kick Twitch
      entregable["Time"] = obtenerValorSeguro(fila, mapeo.time, 0);
      entregable["Avg Viewers"] = obtenerValorSeguro(fila, mapeo.avgViewers, 0);
      entregable["Peak Viewers"] = obtenerValorSeguro(fila, mapeo.peakViewers, 0);
      entregable["Minutes Watched"] = obtenerValorSeguro(fila, mapeo.minutesWatched, 0);
    }

    // Agregar entregable al grupo
    grupos[clave].entregables.push(entregable);
    
    contadorGlobal++;
  }
  
  // Convertir objeto a array
  var resultado = Object.values(grupos);
  
  // Aplicar límite si existe
  if (params && params.limit) {
    resultado = resultado.slice(0, parseInt(params.limit));
  }
  
  return resultado;
}

/**
 * Obtener datos en formato plano (original)
 */
function obtenerDatosPlanos(sheet, sheetName) {
  var datos = sheet.getDataRange().getValues();
  var resultado = [];

  // Obtener mapeo de columnas según la hoja
  var mapeo = obtenerMapeoColumnas(sheetName);

  for (var i = 1; i < datos.length; i++) {
    var fila = datos[i];
    var id = generarID(i);

    var objeto = {
      "id": id,
      "NombreCampana": obtenerValorSeguro(fila, mapeo.nombreCampana, ''),
      "NombreCliente": obtenerValorSeguro(fila, mapeo.nombreCliente, ''),
      "NombreTalento": obtenerValorSeguro(fila, mapeo.nombreTalento, ''),
      "PlataformaTalento": obtenerValorSeguro(fila, mapeo.plataformaTalento, ''),
      "entregables_URL": obtenerValorSeguro(fila, mapeo.entregablesURL, ''),
      "Tituloentregable": obtenerValorSeguro(fila, mapeo.tituloEntregable, ''),
      "entregables_fecha": formatearFecha(obtenerValorSeguro(fila, mapeo.entregablesFecha, '')),
      "FTDs": obtenerValorSeguro(fila, mapeo.ftds, 0),
      "FTDObtenido": obtenerValorSeguro(fila, mapeo.ftdObtenido, 0),
      "Time": obtenerValorSeguro(fila, mapeo.time, 0),
      "Avg Viewers": obtenerValorSeguro(fila, mapeo.avgViewers, 0),
      "Peak Viewers": obtenerValorSeguro(fila, mapeo.peakViewers, 0),
      "Minutes Watched": obtenerValorSeguro(fila, mapeo.minutesWatched, 0)
    };

    // Agregar campos específicos de Youtube si aplica
    if (sheetName === 'Youtube') {
      objeto["Views"] = obtenerValorSeguro(fila, mapeo.views, 0);
      objeto["Likes"] = obtenerValorSeguro(fila, mapeo.likes, 0);
      objeto["Comments"] = obtenerValorSeguro(fila, mapeo.comments, 0);
    }

    resultado.push(objeto);
  }

  return resultado;
}

/**
 * Generar ID único en formato cl-XXX
 */
function generarID(numeroFila) {
  var numero = numeroFila.toString().padStart(3, '0');
  return 'cl-' + numero;
}

/**
 * Formatear fecha a formato YYYY-MM-DD
 */
function formatearFecha(fecha) {
  if (fecha instanceof Date) {
    var year = fecha.getFullYear();
    var month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    var day = fecha.getDate().toString().padStart(2, '0');
    return year + '-' + month + '-' + day;
  }
  return fecha;
}

/**
 * Endpoint para obtener estadísticas
 */
function obtenerEstadisticas() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var sheetName = sheet.getName();
  var datos = obtenerDatosAgrupados(sheet, {}, sheetName);
  
  var totalEntregables = 0;
  var totalFTDs = 0;
  var totalFTDObtenido = 0;
  var totalMinutesWatched = 0;
  var talentos = new Set();
  var campanas = new Set();
  
  datos.forEach(function(grupo) {
    totalEntregables += grupo.entregables.length;
    totalFTDs += grupo.FTDs || 0;
    totalFTDObtenido += grupo.FTDObtenido || 0;
    talentos.add(grupo.NombreTalento);
    campanas.add(grupo.NombreCampana);
    
    grupo.entregables.forEach(function(ent) {
      totalMinutesWatched += ent['Minutes Watched'] || 0;
    });
  });
  
  return {
    totalGrupos: datos.length,
    totalEntregables: totalEntregables,
    totalFTDs: totalFTDs,
    totalFTDObtenido: totalFTDObtenido,
    totalMinutesWatched: totalMinutesWatched,
    cantidadTalentos: talentos.size,
    cantidadCampanas: campanas.size
  };
}

/**
 * Función de prueba
 */
function testAPI() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var sheetName = sheet.getName();
  var params = {
    cliente: 'GGBET Influencers',
    talento: 'Blackz'
  };
  var datos = obtenerDatosAgrupados(sheet, params, sheetName);
  Logger.log(JSON.stringify(datos, null, 2));
}