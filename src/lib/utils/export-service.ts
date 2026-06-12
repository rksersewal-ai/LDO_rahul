import * as XLSX from "xlsx";

/**
 * Multi-format export service supporting Excel, Word, PDF (print), and CSV.
 * Follows the pattern from LDO-2-local ExportImportService.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTableHtml(
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  subtitle?: string,
): string {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Segoe UI, Arial, sans-serif; padding: 28px; color: #0f172a; }
      h1 { margin: 0 0 6px; font-size: 22px; }
      p { margin: 0 0 18px; color: #475569; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #e2e8f0; font-weight: 700; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </body>
</html>`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function getDateSuffix(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Export data to Excel (.xlsx) format and trigger download.
 */
export function exportToExcel(
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  filenamePrefix: string,
): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((header) => ({
    wch: Math.max(16, Math.min(42, header.length + 8)),
  }));
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31) || "Sheet1");
  XLSX.writeFile(wb, `${filenamePrefix}-${getDateSuffix()}.xlsx`);
}

/**
 * Export data to Word (.doc) format using HTML blob with BOM prefix.
 */
export function exportToWord(
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  filenamePrefix: string,
  subtitle?: string,
): void {
  const html = buildTableHtml(title, headers, rows, subtitle);
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  downloadBlob(blob, `${filenamePrefix}-${getDateSuffix()}.doc`);
}

/**
 * Export data to PDF by opening a print window with styled HTML table.
 */
export function exportToPdf(
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  subtitle?: string,
): void {
  const html = buildTableHtml(title, headers, rows, subtitle);
  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Export data to CSV format using xlsx library and trigger download.
 */
export function exportToCSV(
  headers: string[],
  rows: Array<Array<string | number>>,
  filenamePrefix: string,
): void {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filenamePrefix}-${getDateSuffix()}.csv`);
}
