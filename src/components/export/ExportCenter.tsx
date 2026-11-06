'use client';

import React, { useState } from 'react';
import { useInspection } from '@/context/InspectionContext';
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  FileCheck2,
  Calendar,
  Layers,
} from 'lucide-react';
import { exportReportsToCsv, downloadCsv } from '@/lib/export/csvExport';
import { exportReportsToExcel } from '@/lib/export/excelExport';
import { exportReportToPdf } from '@/lib/export/pdfExport';

export function ExportCenter() {
  const { reports, activeReport } = useInspection();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    reports.map((r) => r.report_id)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(reports.map((r) => r.report_id));
  const clearSelection = () => setSelectedIds([]);

  const reportsToExport = reports.filter((r) => selectedIds.includes(r.report_id));

  const handleExportCsv = () => {
    if (reportsToExport.length === 0) return;
    const csv = exportReportsToCsv(reportsToExport);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsv(`MechReport_Inspection_Export_${dateStr}.csv`, csv);
  };

  const handleExportExcel = () => {
    if (reportsToExport.length === 0) return;
    const dateStr = new Date().toISOString().split('T')[0];
    exportReportsToExcel(reportsToExport, `MechReport_Inspection_Export_${dateStr}.xlsx`);
  };

  const handleExportSinglePdf = (reportId: string) => {
    const report = reports.find((r) => r.report_id === reportId);
    if (report) exportReportToPdf(report);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Export Center & Quality Audit Generation
        </h2>
        <p className="text-xs text-[#8A94A0] mt-0.5">
          Generate structured Excel workbooks, CSV datasets, and executive PDF audit certificates.
        </p>
      </div>

      {/* Main Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Excel XLSX */}
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Excel Workbook (.xlsx)</h3>
            <p className="text-xs text-[#8A94A0]">
              Full multi-sheet workbook including master summary, 16-column matrix, and violation logs.
            </p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={reportsToExport.length === 0}
            className="w-full bg-[#272B30] hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#3A4048] disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export {reportsToExport.length} Reports (XLSX)</span>
          </button>
        </div>

        {/* CSV Generation */}
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">CSV Dataset (.csv)</h3>
            <p className="text-xs text-[#8A94A0]">
              Flat tabular structure compatible with SQL databases, Python pandas, and quality SPC tools.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={reportsToExport.length === 0}
            className="w-full bg-[#272B30] hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#3A4048] disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export {reportsToExport.length} Reports (CSV)</span>
          </button>
        </div>

        {/* PDF Certificate */}
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FF7A00]/10 text-[#FF7A00] flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Audit Certificate (PDF)</h3>
            <p className="text-xs text-[#8A94A0]">
              Executive inspection certificate with status badge, gear params, reconstructed table, and findings.
            </p>
          </div>
          <button
            onClick={() => activeReport && handleExportSinglePdf(activeReport.report_id)}
            disabled={!activeReport}
            className="w-full bg-[#FF7A00] hover:bg-[#E66E00] text-black text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#FF7A00]/20 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export Active Part PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selection Checkbox Table */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#272B30] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Select Reports to Include in Batch Export
            </h3>
            <span className="text-[10px] bg-[#22262B] text-[#8A94A0] px-2 py-0.5 rounded-full font-mono">
              {reportsToExport.length} of {reports.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-[#FF7A00] hover:text-[#FFA347] font-medium transition-colors cursor-pointer"
            >
              Select All
            </button>
            <span className="text-[#606A75]">•</span>
            <button
              onClick={clearSelection}
              className="text-xs text-[#8A94A0] hover:text-white font-medium transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141618] text-[#8A94A0] uppercase text-[10px] border-b border-[#272B30]">
              <tr>
                <th className="py-3 px-4 w-10">Select</th>
                <th className="py-3 px-4">Part Number</th>
                <th className="py-3 px-4">Drawing No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Violations</th>
                <th className="py-3 px-4 text-right">Individual PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23272C] text-[#D1D9E0]">
              {reports.map((r) => {
                const isSelected = selectedIds.includes(r.report_id);
                return (
                  <tr
                    key={r.report_id}
                    className="hover:bg-[#1E2227] transition-colors cursor-pointer"
                    onClick={() => toggleSelect(r.report_id)}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(r.report_id)}
                        className="cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#FF7A00]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#606A75]" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-white">{r.part_number}</td>
                    <td className="py-3 px-4 font-mono text-[#8A94A0]">{r.drawing_number}</td>
                    <td className="py-3 px-4 font-mono text-[#8A94A0]">{r.metadata.inspection_date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          r.calculated_status === 'OK'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {r.calculated_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-red-400 font-semibold">
                      {r.analysis.violations.length}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleExportSinglePdf(r.report_id)}
                        className="bg-[#24282D] hover:bg-[#FF7A00] hover:text-black text-gray-300 text-xs px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

