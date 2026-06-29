import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * exportToExcel
 * Converts an array of objects into a CSV and triggers the native sharing sheet.
 * @param {Array} data - The data to export
 * @param {String} fileName - Desired file name (without extension)
 */
export const exportToExcel = async (data, fileName = 'report') => {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  try {
    // 1. Generate CSV Headers
    const headers = Object.keys(data[0]);
    const csvHeader = headers.join(',') + '\n';

    // 2. Generate CSV Rows
    const csvRows = data.map(row => {
      return headers.map(fieldName => {
        let value = row[fieldName] || '';
        // Escape commas and quotes for CSV safety
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // 3. Save to temporary file
    const fileUri = `${FileSystem.documentDirectory}${fileName}_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: 'utf8',
    });

    // 4. Share the file (which can be opened in Excel/Sheets)
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Report',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    return true;
  } catch (error) {
    console.error('[ExportService] Error:', error);
    throw error;
  }
};
