'use client';

import React, { useState } from 'react';
import { useInspection } from '@/context/InspectionContext';
import {
  History,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';

export function InspectionHistory() {
  const {
    reports,
    setActiveReportId,
    setActiveTab,
    removeReport,
    clearHistory,
  } = useInspection();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // Filtered reports
  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.drawing_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.metadata.examiner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || r.calculated_status === statusFilter;

    const matchesDate =
      dateFilter === 'ALL' || r.metadata.inspection_date.includes(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Unique dates in dataset
  const uniqueDates = Array.from(
    new Set(reports.map((r) => r.metadata.inspection_date).filter(Boolean))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-[#FF7A00]" />
            Inspection Archive & History (IndexedDB)
          </h2>
          <p className="text-xs text-[#8A94A0] mt-0.5">
            Locally persisted records with client-side zero-leakage security.
          </p>
        </div>

        {reports.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete all stored reports from browser memory?')) {
                clearHistory();
              }
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Archive</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A94A0] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by part number increment, drawing number, or examiner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141618] border border-[#2E343B] text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:border-[#FF7A00] focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141618] border border-[#2E343B] text-white text-xs rounded-lg px-3 py-2 focus:border-[#FF7A00] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OK">Calculated OK</option>
            <option value="NOT_OK">Calculated NOT OK</option>
            <option value="INCOMPLETE">Incomplete</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-[#141618] border border-[#2E343B] text-white text-xs rounded-lg px-3 py-2 focus:border-[#FF7A00] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Dates</option>
            {uniqueDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-[#8A94A0] mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Matching Records Found</h3>
          <p className="text-xs text-[#8A94A0]">
            Try adjusting your search terms or filters above.
          </p>
        </div>
      ) : (
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141618] text-[#8A94A0] uppercase text-[10px] font-mono border-b border-[#272B30]">
                <tr>
                  <th className="py-3 px-4">Part Number</th>
                  <th className="py-3 px-4">Drawing No.</th>
                  <th className="py-3 px-4">Inspection Date/Time</th>
                  <th className="py-3 px-4">Examiner</th>
                  <th className="py-3 px-4">ZEISS Status</th>
                  <th className="py-3 px-4">Calculated</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23272C] text-[#D1D9E0]">
                {filtered.map((r) => {
                  return (
                    <tr
                      key={r.report_id}
                      className="hover:bg-[#1E2227] transition-colors cursor-pointer"
                      onClick={() => {
                        setActiveReportId(r.report_id);
                        setActiveTab('results');
                      }}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-white flex items-center gap-1.5">
                        <span>{r.part_number}</span>
                        {r.is_manually_edited && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded">
                            edited
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8A94A0]">{r.drawing_number}</td>
                      <td className="py-3 px-4 font-mono text-[#8A94A0]">{r.inspection_datetime}</td>
                      <td className="py-3 px-4 font-mono text-gray-300">{r.metadata.examiner}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                          {r.original_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            r.calculated_status === 'OK'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {r.calculated_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8A94A0]">
                        {r.analysis.confidence_score}%
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveReportId(r.report_id);
                              setActiveTab('results');
                            }}
                            className="bg-[#272B30] hover:bg-[#FF7A00] hover:text-black text-gray-300 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete report for ${r.part_number}?`)) {
                                removeReport(r.report_id);
                              }
                            }}
                            className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

