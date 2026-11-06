'use client';

import React, { useState, useEffect } from 'react';
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
  Sliders,
  AlertTriangle,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { exportReportsToCsv, downloadCsv } from '@/lib/export/csvExport';
import {
  downloadJobWiseExcel,
  extractJobWiseData,
  JobWiseRow,
  JOB_WISE_HEADERS,
  MeasurementRowType,
  MEASUREMENT_TYPE_LABELS,
  exportReportsToExcel,
} from '@/lib/export/excelExport';
import { toNumericMeasurement } from '@/lib/extractor/tableExtractor';
import { exportReportToPdf } from '@/lib/export/pdfExport';

export function ExportCenter() {
  const { reports, activeReport } = useInspection();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedMeasurementType, setSelectedMeasurementType] =
    useState<MeasurementRowType>('fHbeta');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tableData, setTableData] = useState<JobWiseRow[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync selected reports with loaded reports
  useEffect(() => {
    setSelectedIds(reports.map((r) => r.report_id));
  }, [reports]);

  // Extract Job-wise data whenever selection or measurement type changes
  useEffect(() => {
    const selectedReports = reports.filter((r) => selectedIds.includes(r.report_id));
    const extracted = extractJobWiseData(selectedReports, selectedMeasurementType);
    setTableData(extracted);
    setIsEditing(false);
  }, [reports, selectedIds, selectedMeasurementType]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(reports.map((r) => r.report_id));
  const clearSelection = () => setSelectedIds([]);

  const handleCellEdit = (
    index: number,
    field: keyof JobWiseRow,
    value: string
  ) => {
    setTableData((prev) => {
      const copy = [...prev];
      const target = { ...copy[index] };

      if (field === 'jobNumber') {
        target.jobNumber = value.trim();
      } else {
        const num = toNumericMeasurement(value);
        (target as any)[field] = num;
      }

      copy[index] = target;
      return copy;
    });
  };

  const handleResetToExtracted = () => {
    const selectedReports = reports.filter((r) => selectedIds.includes(r.report_id));
    const extracted = extractJobWiseData(selectedReports, selectedMeasurementType);
    setTableData(extracted);
    setIsEditing(false);
  };

  const handleDownloadJobWise = async () => {
    if (tableData.length === 0) return;
    setIsExporting(true);
    try {
      await downloadJobWiseExcel(
        tableData,
        'Job_Wise_Measurement_Report.xlsx'
      );
    } catch (err) {
      console.error('Failed to export job-wise Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Secondary exports
  const handleExportFullExcel = () => {
    const selectedReports = reports.filter((r) => selectedIds.includes(r.report_id));
    if (selectedReports.length === 0) return;
    const dateStr = new Date().toISOString().split('T')[0];
    exportReportsToExcel(selectedReports, `MechReport_Inspection_Summary_${dateStr}.xlsx`);
  };

  const handleExportCsv = () => {
    const selectedReports = reports.filter((r) => selectedIds.includes(r.report_id));
    if (selectedReports.length === 0) return;
    const csv = exportReportsToCsv(selectedReports);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsv(`MechReport_Inspection_Export_${dateStr}.csv`, csv);
  };

  const handleExportSinglePdf = (reportId: string) => {
    const report = reports.find((r) => r.report_id === reportId);
    if (report) exportReportToPdf(report);
  };

  // Validation metrics
  const missingCount = tableData.filter((r) => r.hasMissingValues).length;
  const duplicateCount = tableData.filter((r) => r.isDuplicate).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#FF7A00]" />
            Job-Wise Measurement Report (Excel Export)
          </h2>
          <p className="text-xs text-[#8A94A0] mt-0.5">
            Standard 11-column compact matrix with 1 row per inspected job, centered data cells, and thin borders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJobWise}
            disabled={tableData.length === 0 || isExporting}
            className="bg-[#FF7A00] hover:bg-[#E66E00] text-black font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 shadow-md shadow-[#FF7A00]/20 transition-all cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Download Job_Wise_Measurement_Report.xlsx</span>
          </button>
        </div>
      </div>

      {/* Measurement Row Selector Card */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Select Measurement Row to Export
            </h3>
            <p className="text-[11px] text-[#8A94A0]">
              Extracts actual individual measurement values from the selected row without combining rows.
            </p>
          </div>

          {/* Row Selector Pills */}
          <div className="flex items-center gap-1.5 bg-[#141618] p-1.5 rounded-lg border border-[#272B30] text-xs font-mono">
            {(['fHbeta', 'ffp', 'Fp', 'vfHbeta'] as MeasurementRowType[]).map((type) => {
              const info = MEASUREMENT_TYPE_LABELS[type];
              const isSelected = selectedMeasurementType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedMeasurementType(type)}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#FF7A00] text-black font-bold shadow-sm'
                      : 'text-[#8A94A0] hover:text-white hover:bg-[#1E2227]'
                  }`}
                >
                  <span>{info.name}</span>
                  <span className="text-[10px] opacity-75">({info.unit})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#141618] px-3 py-2 rounded-lg border border-[#272B30]">
          <Info className="w-4 h-4 text-[#FF7A00] shrink-0" />
          <span>
            Active Selection:{' '}
            <strong className="text-white">
              {MEASUREMENT_TYPE_LABELS[selectedMeasurementType].name}
            </strong>{' '}
            — {MEASUREMENT_TYPE_LABELS[selectedMeasurementType].desc} (Unit:{' '}
            {MEASUREMENT_TYPE_LABELS[selectedMeasurementType].unit})
          </span>
        </div>
      </div>

      {/* Validation Warnings (Missing values or Duplicate Job Nos) */}
      {(missingCount > 0 || duplicateCount > 0) && (
        <div className="space-y-2">
          {duplicateCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Duplicate Job Numbers detected across {duplicateCount} report(s). Please review before exporting.
              </span>
            </div>
          )}
          {missingCount > 0 && selectedMeasurementType !== 'vfHbeta' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {missingCount} report(s) contain unpopulated measurement positions (left as blank in the export).
              </span>
            </div>
          )}
        </div>
      )}

      {/* Live Excel Table Preview */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl overflow-hidden space-y-3 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#272B30] pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#FF7A00]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Worksheet Preview: &quot;Measurement Report&quot; ({tableData.length} Jobs)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#24282D] hover:bg-[#2F343A] text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-[#3A4048]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FF7A00]" />
                <span>Manual Correction</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToExtracted}
                  className="bg-[#24282D] hover:bg-[#2F343A] text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-[#FF7A00] hover:bg-[#E66E00] text-black font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Done Editing</span>
                </button>
              </div>
            )}

            <button
              onClick={handleDownloadJobWise}
              disabled={tableData.length === 0 || isExporting}
              className="bg-[#FF7A00] hover:bg-[#E66E00] text-black font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* The Exact 11-Column Table Grid (Styled to reflect the Excel reference) */}
        {tableData.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No inspection reports selected. Please select at least one report below.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#2E343B] rounded-lg">
            <table className="w-full text-center text-xs font-mono border-collapse bg-white text-black">
              <thead>
                <tr className="bg-white border-b-2 border-black text-black font-bold">
                  {JOB_WISE_HEADERS.map((header, idx) => (
                    <th
                      key={idx}
                      className="py-2.5 px-3 border border-black text-center font-bold text-xs bg-white text-black"
                      style={{ width: idx === 0 ? '200px' : '75px' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rIdx) => {
                  const renderCell = (
                    field: keyof JobWiseRow,
                    rawVal: any
                  ) => {
                    const val = toNumericMeasurement(rawVal);
                    if (isEditing) {
                      return (
                        <input
                          type="number"
                          value={val ?? ''}
                          onChange={(e) =>
                            handleCellEdit(rIdx, field, e.target.value)
                          }
                          className="w-14 bg-gray-100 border border-gray-400 rounded px-1 py-0.5 text-center text-xs text-black font-mono focus:border-blue-600 focus:outline-none"
                        />
                      );
                    }

                    return (
                      <span
                        className={`${
                          val !== null && val < 0
                            ? 'text-red-700 font-semibold'
                            : 'text-black'
                        }`}
                      >
                        {val !== null ? val : ''}
                      </span>
                    );
                  };

                  return (
                    <tr
                      key={row.reportId}
                      className="hover:bg-gray-50 transition-colors border-b border-black"
                    >
                      {/* Column 1: Job No */}
                      <td className="py-2 px-3 border border-black font-mono text-center font-medium bg-white text-black">
                        {isEditing ? (
                          <input
                            type="text"
                            value={row.jobNumber}
                            onChange={(e) =>
                              handleCellEdit(rIdx, 'jobNumber', e.target.value)
                            }
                            className="w-full bg-gray-100 border border-gray-400 rounded px-1.5 py-0.5 text-center text-xs text-black font-mono focus:border-blue-600 focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{row.jobNumber}</span>
                            {row.isDuplicate && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-sans">
                                Duplicate
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Columns 2-6: Left Flank [Ø, 33, 23, 12, 1] */}
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('leftAvg', row.leftAvg)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('leftT33', row.leftT33)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('leftT23', row.leftT23)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('leftT12', row.leftT12)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('leftT1', row.leftT1)}
                      </td>

                      {/* Columns 7-11: Right Flank [1, 12, 23, 33, Ø] */}
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('rightT1', row.rightT1)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('rightT12', row.rightT12)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('rightT23', row.rightT23)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('rightT33', row.rightT33)}
                      </td>
                      <td className="py-2 px-2 border border-black text-center">
                        {renderCell('rightAvg', row.rightAvg)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Ingestion & Report Selection */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#272B30] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Batch Report Selection
            </h3>
            <span className="text-[10px] bg-[#22262B] text-[#8A94A0] px-2 py-0.5 rounded-full font-mono">
              {selectedIds.length} of {reports.length} jobs included
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
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#141618] text-[#8A94A0] uppercase text-[10px] border-b border-[#272B30]">
              <tr>
                <th className="py-3 px-4 w-10">Select</th>
                <th className="py-3 px-4">Job No (Part Number)</th>
                <th className="py-3 px-4">Drawing No.</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">ZEISS Status</th>
                <th className="py-3 px-4">Calculated</th>
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
                    <td className="py-3 px-4 font-bold text-white">{r.part_number}</td>
                    <td className="py-3 px-4 text-[#8A94A0]">{r.drawing_number}</td>
                    <td className="py-3 px-4 text-[#8A94A0]">{r.inspection_datetime}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/30">
                        {r.original_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          r.calculated_status === 'OK'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {r.calculated_status}
                      </span>
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

      {/* Optional Secondary Exports Section */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Additional Export Formats
          </h3>
          <p className="text-[11px] text-[#8A94A0]">
            Export comprehensive multi-sheet workbooks, raw flat CSVs, or PDF certificates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Multi-Sheet Excel */}
          <div className="bg-[#141618] border border-[#272B30] rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Full Inspection Summary (.xlsx)</h4>
                <p className="text-[11px] text-[#8A94A0]">
                  Multi-sheet workbook with all 4 measurement rows & tolerance check
                </p>
              </div>
            </div>
            <button
              onClick={handleExportFullExcel}
              disabled={selectedIds.length === 0}
              className="bg-[#272B30] hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-[#3A4048] disabled:opacity-40"
            >
              Export
            </button>
          </div>

          {/* Flat CSV */}
          <div className="bg-[#141618] border border-[#272B30] rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Flat CSV Dataset (.csv)</h4>
                <p className="text-[11px] text-[#8A94A0]">
                  Row-level CSV format for quality SPC tools and database import
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={selectedIds.length === 0}
              className="bg-[#272B30] hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-[#3A4048] disabled:opacity-40"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
