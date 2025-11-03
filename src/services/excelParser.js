import * as XLSX from 'xlsx';

/**
 * Convierte un número serial de Excel a una fecha JavaScript
 * O valida y retorna una fecha string si ya está en formato correcto
 */
function excelSerialToDate(serial) {
  // Si es undefined o null, retornar tal cual
  if (serial === undefined || serial === null) {
    return serial;
  }
  
  // Si es un número, podría ser un serial de Excel
  if (typeof serial === 'number') {
    // Los números seriales de Excel son típicamente > 1 (desde 1900)
    // Si es un número grande (> 1000), probablemente es un serial de Excel
    if (serial > 1000) {
      // Convertir número serial de Excel a fecha
      // Excel cuenta desde el 1 de enero de 1900
      // Excel tiene un bug: cuenta el 1900 como año bisiesto (no lo es)
      // Usamos 30 de diciembre de 1899 como referencia
      const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
      const date = new Date(excelEpoch.getTime() + (serial - 1) * 86400 * 1000);
      return date.toISOString().split('T')[0]; // Retorna en formato YYYY-MM-DD
    }
    // Si es un número pequeño, puede ser parte de una fecha o un error
    return serial;
  }
  
  // Si es una cadena, verificar si es una fecha válida o un número serial en string
  if (typeof serial === 'string') {
    // Intentar parsear como número primero
    const numSerial = parseFloat(serial);
    
    // Si puede parsearse como número y es > 1000, probablemente es un serial
    if (!isNaN(numSerial) && numSerial > 1000) {
      return excelSerialToDate(numSerial);
    }
    
    // Verificar si ya es una fecha válida en formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(serial.trim())) {
      // Validar que la fecha sea real
      const dateObj = new Date(serial + 'T00:00:00');
      if (!isNaN(dateObj.getTime())) {
        return serial.trim(); // Retornar la fecha tal cual si es válida
      }
    }
    
    // Si es otro formato de fecha, intentar parsearla
    const dateObj = new Date(serial);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    
    // Si no es nada reconocible, retornar tal cual
    return serial;
  }
  
  // Si es un objeto Date, convertirlo a string
  if (serial instanceof Date) {
    return serial.toISOString().split('T')[0];
  }
  
  return serial;
}

/**
 * Parsea un archivo Excel y retorna los datos como array de objetos
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // Leer el Excel sin forzar conversión de fechas
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: false, // No forzar conversión, manejamos nosotros
          cellNF: false,
          cellText: false
        });
        
        // Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON - usar raw: true para obtener valores originales
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: true, // Usar valores raw para preservar strings
          defval: null // Valor por defecto para celdas vacías
        });
        
        // Normalizar nombres de columnas y convertir fechas
        const normalizedData = normalizeData(jsonData);
        
        resolve(normalizedData);
      } catch (error) {
        reject(new Error('Error al procesar el archivo Excel: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Normaliza los nombres de columnas del Excel a formato estándar
 */
function normalizeData(data) {
  return data.map(row => {
    const normalized = { ...row };
    
    // Normalizar nombres de columnas según el formato del Excel
    if (row.NombreCampa !== undefined) {
      normalized.NombreCampana = row.NombreCampa;
      delete normalized.NombreCampa;
    }
    
    // Manejar entregables_fecha (puede venir como entregables_fe)
    let fechaValue = row.entregables_fecha || row.entregables_fe;
    
    if (fechaValue !== undefined && fechaValue !== null && fechaValue !== '') {
      // Convertir número serial de Excel a fecha si es necesario
      // O validar y mantener si ya es una fecha string válida
      normalized.entregables_fecha = excelSerialToDate(fechaValue);
    } else {
      // Si no hay fecha, mantener undefined
      normalized.entregables_fecha = undefined;
    }
    
    // Limpiar campos duplicados
    if (row.entregables_fe !== undefined) {
      delete normalized.entregables_fe;
    }
    
    return normalized;
  });
}

/**
 * Valida que el Excel tenga las columnas requeridas
 */
export function validateExcelColumns(data) {
  if (!data || data.length === 0) {
    return { valid: false, message: 'El archivo Excel está vacío' };
  }

  const firstRow = data[0];
  
  // Aceptar ambos formatos de nombres de columnas
  const requiredColumns = [
    ['NombreCampana', 'NombreCampa'], // Acepta cualquiera de los dos
    'NombreCliente',
    'NombreTalento',
    'entregables_URL',
    ['entregables_fecha', 'entregables_fe'], // Acepta cualquiera de los dos
    'Views',
    'Likes',
    'Comments'
  ];

  const missingColumns = [];
  
  requiredColumns.forEach(col => {
    if (Array.isArray(col)) {
      // Si es un array, verificar que al menos una de las variantes exista
      const hasAny = col.some(variant => firstRow.hasOwnProperty(variant));
      if (!hasAny) {
        missingColumns.push(col[0]); // Agregar el nombre principal
      }
    } else {
      // Si es un string, verificar que exista
      if (!firstRow.hasOwnProperty(col)) {
        missingColumns.push(col);
      }
    }
  });

  if (missingColumns.length > 0) {
    return {
      valid: false,
      message: `Faltan las siguientes columnas: ${missingColumns.join(', ')}`
    };
  }

  return { valid: true };
}

