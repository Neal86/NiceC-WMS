import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, Download, Info } from 'lucide-react';
import { outboundApi } from '../api';
const bulkImport = outboundApi.bulkImport;

interface ImportRow {
  orderNo: string;
  recipientName: string;
  address: string;
  phone: string;
  skuCode: string;
  qty: number;
  logisticsChannel: string;
}

interface ImportResult {
  successRows: { orderNo: string; orderId: string; skuCount: number }[];
  errors: { row: number; message: string }[];
}

export default function BulkImportModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = 'orderNo,recipientName,address,phone,skuCode,qty,logisticsChannel\n';
    const sample = 'OBS_TEST001,John Doe,"123 Main St, NY, USA",+1234567890,TS-V-NA-4,2,FedEx Ground\nOBS_TEST002,Jane Smith,"456 Oak Ave, LA, USA",+1987654321,PR-BL-USB-1,1,USPS Priority\nOBS_TEST002,Jane Smith,"456 Oak Ave, LA, USA",+1987654321,TS-V-NA-4,3,USPS Priority';
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wms_bulk_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null); setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) { setError('CSV must have a header row and at least one data row'); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsed: ImportRow[] = [];
    const parseErrors: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = vals[idx]?.trim() || ''; });
      if (!row.orderno) { parseErrors.push(`Row ${i}: missing orderNo`); continue; }
      if (!row.skucode) { parseErrors.push(`Row ${i}: missing skuCode`); continue; }
      if (!row.qty || isNaN(Number(row.qty))) { parseErrors.push(`Row ${i}: invalid qty`); continue; }
      parsed.push({
        orderNo: row.orderno,
        recipientName: row.recipientname || '',
        address: row.address || '',
        phone: row.phone || '',
        skuCode: row.skucode,
        qty: Number(row.qty),
        logisticsChannel: row.logisticschannel || '',
      });
    }
    if (parseErrors.length > 0) setError(parseErrors.join('; '));
    if (parsed.length === 0) { setError('No valid rows found in CSV'); return; }
    setRows(parsed);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true); setResult(null); setError('');
    try {
      const res = await bulkImport(rows);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Bulk Import Orders
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            <div className="space-y-4">
              {result.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 flex items-center gap-1 mb-2"><AlertTriangle className="w-4 h-4" />{result.errors.length} errors</h4>
                  <ul className="text-sm text-amber-700 space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>{e.message}</li>)}
                  </ul>
                </div>
              )}
              {result.successRows.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-medium text-emerald-800 flex items-center gap-1 mb-2"><CheckCircle2 className="w-4 h-4" />{result.successRows.length} orders created</h4>
                  <div className="max-h-60 overflow-y-auto text-sm space-y-1">
                    {result.successRows.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-emerald-700"><span className="font-mono">{r.orderNo}</span><span className="text-emerald-500">({r.skuCount} SKUs)</span></div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { setResult(null); setRows([]); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Import Another File</button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">CSV Import Format</p>
                  <p className="text-blue-600 mt-1">Upload a CSV with columns: <code className="bg-blue-100 px-1 rounded">orderNo, recipientName, address, phone, skuCode, qty, logisticsChannel</code></p>
                  <p className="text-blue-600">Rows with the same orderNo will be merged into one order with multiple line items.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                  <Download className="w-4 h-4" /> Download Template CSV
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-sm">
                  <FileSpreadsheet className="w-4 h-4" /> Select CSV File
                  <input ref={fileRef} type="file" accept=".csv,.tsv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}</div>}

              {rows.length > 0 && (
                <>
                  <h3 className="font-medium text-sm">{rows.length} rows parsed, {new Set(rows.map(r => r.orderNo)).size} unique orders</h3>
                  <div className="border rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Order No</th>
                          <th className="px-3 py-2 text-left">Recipient</th>
                          <th className="px-3 py-2 text-left">SKU</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-left">Channel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 font-mono">{r.orderNo}</td>
                            <td className="px-3 py-1.5 truncate max-w-[200px]">{r.recipientName}</td>
                            <td className="px-3 py-1.5 font-mono">{r.skuCode}</td>
                            <td className="px-3 py-1.5 text-right">{r.qty}</td>
                            <td className="px-3 py-1.5">{r.logisticsChannel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { setRows([]); setError(''); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Clear</button>
                    <button onClick={handleImport} disabled={importing} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2">
                      {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {importing ? `Importing ${rows.length} rows...` : `Import ${rows.length} rows`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = false;
      } else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(current); current = ''; }
      else current += ch;
    }
  }
  result.push(current);
  return result;
}
