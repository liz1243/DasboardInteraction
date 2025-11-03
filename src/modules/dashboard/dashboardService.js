import { parseExcelFile, validateExcelColumns } from '@/services/excelParser.js';

/**
 * Servicio para manejar la lógica de negocio del dashboard
 */
export class DashboardService {
  /**
   * Procesa un archivo Excel y retorna los datos validados
   */
  static async processExcelFile(file) {
    try {
      // Validar tipo de archivo
      if (!file) {
        throw new Error('No file selected');
      }

      const validExtensions = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];

      if (!validExtensions.includes(file.type) && !/\.(xlsx|xls|csv)$/i.test(file.name || '')) {
        throw new Error('The file must be an Excel (.xlsx, .xls) or CSV');
      }

      // Parsear archivo
      const data = await parseExcelFile(file);

      // Validar columnas
      const validation = validateExcelColumns(data);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

