export const SPREADSHEET_MAX_BYTES = 10 * 1024 * 1024;

export function spreadsheetFileError(file, { label = 'Spreadsheet', extensions = ['xlsx', 'xls', 'csv'] } = {}) {
  if (!file) return `${label} file is required`;
  const pattern = new RegExp(`\\.(${extensions.map(ext => ext.replace(/^\./, '')).join('|')})$`, 'i');
  if (!pattern.test(file.name || '')) {
    return `${label} must be a ${extensions.map(ext => `.${ext.replace(/^\./, '')}`).join(' or ')} file`;
  }
  if (file.size > SPREADSHEET_MAX_BYTES) {
    return `${label} must be 10 MB or smaller`;
  }
  return null;
}
