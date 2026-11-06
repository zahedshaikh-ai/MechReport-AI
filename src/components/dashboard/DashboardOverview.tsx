'use client';

import React from 'react';
import { useInspection } from '@/context/InspectionContext';
import {
  FileCheck2,
  AlertOctagon,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export function DashboardOverview() {
  const {
    reports,
    setActiveTab,
    setActiveReportId,
    loadReferenceReportsDemo,
    isLoading,
  } = useInspection();

  // Aggregate metrics
  const totalReports = reports.length;
  const okCount = reports.filter((r) => r.calculated_status === 'OK').length;
  const notOkCount = reports.filter((r) => r.calculated_status === 'NOT_OK').length;
  const incompleteCount = reports.filter((r) => r.calculated_status === 'INCOMPLETE').length;
  const reviewCount = reports.filter((r) => r.calculated_status === 'REVIEW_REQUIRED').length;

  const avgConfidence = totalReports > 0
    ? Math.round(reports.reduce((acc, r) => acc + r.analysis.confidence_score, 0) / totalReports)
    : 0;

  // Chart 1: Status Distribution
  const pieData = [
    { name: 'OK', value: okCount, color: '#10B981' },
    { name: 'NOT OK', value: notOkCount, color: '#EF4444' },
    { name: 'Incomplete', value: incompleteCount, color: '#F59E0B' },
    { name: 'Review Req.', value: reviewCount, color: '#3B82F6' },
  ].filter((d) => d.value > 0);

  // Chart 2: Part-wise Fp Average Comparison
  const barData = reports.slice(0, 8).map((r) => {
    const fp = r.measurements.rows.find((x) => x.name === 'Fp');
    return {
      part: r.part_number.replace('2607', '..'),
      fullPart: r.part_number,
      leftAvg: fp?.left.avg ?? 0,
      rightAvg: fp?.right.avg ?? 0,
      status: r.calculated_status,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome & Quick Demo Banner */}
      <div className="bg-gradient-to-r from-[#1E2227] via-[#1C1F23] to-[#16181B] border border-[#2E343B] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#FF7A00]/10 text-[#FF7A00] font-mono text-[11px] font-bold border border-[#FF7A00]/30">
              ZEISS GEAR PRO 2023 SP1
            </span>
            <span className="text-xs text-[#8A94A0]">• Involute Lead Inspection Suite</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Automated Mechanical Inspection & Quality Analytics
          </h2>
          <p className="text-xs text-[#8A94A0] max-w-2xl">
            Coordinate-based extraction engine for gear lead deviations (Fβ, ffβ, fHβ, vfHβ),
            tolerance limit verification, multi-report trends, and automated export.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => loadReferenceReportsDemo()}
            disabled={isLoading}
            className="bg-[#FF7A00] hover:bg-[#E66E00] text-black font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center gap-2 shadow-md shadow-[#FF7A00]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load 8 Reference Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className="bg-[#272B30] hover:bg-[#32373E] text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer border border-[#3A4048]"
          >
            Upload Custom PDF
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8A94A0]">
            <span className="text-xs font-medium">Processed</span>
            <Layers className="w-4 h-4 text-[#8A94A0]" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{totalReports}</p>
          <p className="text-[10px] text-[#8A94A0]">PDF inspection files</p>
        </div>

        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8A94A0]">
            <span className="text-xs font-medium">Original Not OK</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400 font-mono">
            {reports.filter((r) => r.original_status.toLowerCase() === 'not ok').length}
          </p>
          <p className="text-[10px] text-[#8A94A0]">Source ZEISS stamp</p>
        </div>

        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8A94A0]">
            <span className="text-xs font-medium">Calculated NOT OK</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-500 font-mono">{notOkCount}</p>
          <p className="text-[10px] text-[#8A94A0]">Tolerance rule breach</p>
        </div>

        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8A94A0]">
            <span className="text-xs font-medium">Calculated OK</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{okCount}</p>
          <p className="text-[10px] text-[#8A94A0]">Within all limits</p>
        </div>

        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8A94A0]">
            <span className="text-xs font-medium">Incomplete</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{incompleteCount}</p>
          <p className="text-[10px] text-[#8A94A0]">Missing values</p>
        </div>

        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8A94A0]">
            <span className="text-xs font-medium">Avg Confidence</span>
            <TrendingUp className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <p className="text-2xl font-bold text-[#FF7A00] font-mono">{avgConfidence}%</p>
          <p className="text-[10px] text-[#8A94A0]">Extraction certainty</p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      {totalReports > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown Pie */}
          <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Inspection Status Distribution
              </h3>
              <p className="text-[11px] text-[#8A94A0]">
                Calculated compliance based on DIN 3962 / ISO 1328 tolerances
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#202428',
                      borderColor: '#2E343B',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#272B30]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-[#8A94A0]">NOT OK ({notOkCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-[#8A94A0]">OK ({okCount})</span>
              </div>
            </div>
          </div>

          {/* Part-wise Lead Average Comparison Bar Chart */}
          <div className="lg:col-span-2 bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Total Lead Deviation (Fβ / Fp Average) by Part
                </h3>
                <p className="text-[11px] text-[#8A94A0]">
                  Left flank vs Right flank average deviation across inspected gear parts
                </p>
              </div>
              <button
                onClick={() => setActiveTab('comparison')}
                className="text-xs text-[#FF7A00] hover:text-[#FFA347] flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <span>Full Comparison</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252A30" />
                  <XAxis dataKey="part" stroke="#606A75" fontSize={10} />
                  <YAxis stroke="#606A75" fontSize={10} unit="µm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#202428',
                      borderColor: '#2E343B',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="leftAvg" name="Left Flank Avg (µm)" fill="#FF7A00" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rightAvg" name="Right Flank Avg (µm)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#24282D] text-[#8A94A0] mx-auto flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">No Inspection Reports Loaded</h3>
            <p className="text-xs text-[#8A94A0] mt-1 max-w-sm mx-auto">
              Upload your ZEISS GEAR PRO 2023 SP1 Involute reports or instantly load the 8 reference samples to test.
            </p>
          </div>
          <button
            onClick={() => loadReferenceReportsDemo()}
            className="bg-[#FF7A00] hover:bg-[#E66E00] text-black font-semibold text-xs py-2 px-4 rounded-lg inline-flex items-center gap-2 cursor-pointer shadow-sm shadow-[#FF7A00]/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load 8 Reference Reports</span>
          </button>
        </div>
      )}

      {/* Recent Inspections Table */}
      {totalReports > 0 && (
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#272B30] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Extracted Inspection Records
              </h3>
              <span className="text-[10px] bg-[#22262B] text-[#8A94A0] px-2 py-0.5 rounded-full font-mono">
                {reports.length} parts
              </span>
            </div>
            <button
              onClick={() => setActiveTab('results')}
              className="text-xs text-[#FF7A00] hover:text-[#FFA347] flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <span>View All In Results Tab</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141618] text-[#8A94A0] font-mono uppercase text-[10px] border-b border-[#272B30]">
                <tr>
                  <th className="py-3 px-4">Part Number</th>
                  <th className="py-3 px-4">Drawing No.</th>
                  <th className="py-3 px-4">Inspection Date</th>
                  <th className="py-3 px-4">ZEISS Status</th>
                  <th className="py-3 px-4">Calculated</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23272C] text-[#D1D9E0]">
                {reports.map((r) => {
                  const isCalculatedOk = r.calculated_status === 'OK';
                  return (
                    <tr
                      key={r.report_id}
                      className="hover:bg-[#1E2227] transition-colors cursor-pointer group"
                      onClick={() => {
                        setActiveReportId(r.report_id);
                        setActiveTab('results');
                      }}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-white flex items-center gap-2">
                        <span>{r.part_number}</span>
                        {r.is_manually_edited && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded border border-amber-500/30">
                            Edited
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8A94A0]">{r.drawing_number}</td>
                      <td className="py-3 px-4 font-mono text-[#8A94A0]">{r.inspection_datetime}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                          {r.original_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isCalculatedOk
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {r.calculated_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {r.analysis.violations.length > 0 ? (
                          <span className="text-red-400 font-semibold">
                            {r.analysis.violations.length} out of spec
                          </span>
                        ) : (
                          <span className="text-emerald-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8A94A0]">
                        {r.analysis.confidence_score}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReportId(r.report_id);
                            setActiveTab('results');
                          }}
                          className="bg-[#272B30] hover:bg-[#FF7A00] hover:text-black text-white text-[11px] font-medium px-2.5 py-1 rounded transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
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

