import { showToast } from './toast.js';

/**
 * Exports transaction list to a CSV file.
 * @param {Array} transactions - List of transactions.
 */
export function exportToCSV(transactions) {
  if (transactions.length === 0) {
    showToast('No transactions to export.', 'error');
    return;
  }

  const headers = ['Description', 'Amount', 'Type', 'Category', 'Date'];
  const rows = transactions.map(t => [
    `"${t.description.replace(/"/g, '""')}"`, // escape quotes
    t.amount.toFixed(2),
    t.type,
    t.category,
    t.date ?? ''
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];

  anchor.href = url;
  anchor.download = `fintrack-${today}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);

  showToast('CSV exported! ⬇', 'success');
}

/**
 * Parses raw CSV text into an array of string arrays.
 * Handles double-quoted fields containing commas correctly.
 * @param {string} text - Raw CSV content.
 * @returns {Array<Array<string>>} List of parsed rows.
 */
export function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = [];
    let insideQuote = false;
    let entry = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        insideQuote = !insideQuote;
        // If we see double double-quotes inside quotes, treat as escaped quote
        if (insideQuote && line[j + 1] === '"') {
          entry += '"';
          j++; // skip next quote
          insideQuote = true; // remain inside quote
        }
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    result.push(row);
  }

  return result;
}
