'use client';

import React, { useState } from 'react';
import { useInspection } from '@/context/InspectionContext';
import {
  GitCompare,
  CheckSquare,
  Square,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Filter,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

export function MultiReportComparison() {
  const {
    reports,
    selectedReportIds,
    toggleSelectReportForComparison,
    selectAllForComparison,
    clearComparisonSelection,
    setActiveReportId,
    setActiveTab,
  } = useInspection();

  const [metricToCompare, setMetricToCompare] = useState<'Fp' | 'ffp' | 'fHbeta' | 'vfHbeta'>('fHbeta');

  const selectedReports = reports.filter((r) =>
    selectedReportIds.includes(r.report_id)
  );

  // Line Chart Data: Trend across selected parts
  const trendData = selectedReports.map((r) => {
    const row = r.measurements.rows.find((x) => x.name === metricToCompare);
    return {
      part: r.part_number.replace('2607', '..'),
      fullPart: r.part_number,
      leftAvg: row?.left.avg ?? 0,
      rightAvg: row?.right.avg ?? 0,
      leftT1: row?.left.teeth['1'] ?? 0,
      rightT1: row?.right.teeth['1'] ?? 0,
      leftCrown: row?.left.crowning_value ?? 0,
      rightCrown: row?.right.crowning_value ?? 0,
      date: r.metadata.inspection_date,
    };
  });

  // Tooth 1, 12, 23, 33 comparative matrix
  const teethList = ['33', '23', '12', '1'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Comparison Header & Selectors */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#FF7A00]" />
              Multi-Report Lead Deviation Comparison
            </h2>
            <p className="text-xs text-[#8A94A0] mt-0.5">
              Select inspection reports to analyze deviations across part batches and quadrant teeth.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAllForComparison}
              className="bg-[#24282D] hover:bg-[#2F343A] text-xs text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-[#3A4048]"
            >
              Select All ({reports.length})
            </button>
            <button
              onClick={clearComparisonSelection}
              className="bg-[#24282D] hover:bg-[#2F343A] text-xs text-[#8A94A0] hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Selection Checkbox Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#272B30]">
          {reports.map((r) => {
            const isSelected = selectedReportIds.includes(r.report_id);
            return (
              <button
                key={r.report_id}
                onClick={() => toggleSelectReportForComparison(r.report_id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#FF7A00]/10 border-[#FF7A00] text-white font-semibold'
                    : 'bg-[#141618] border-[#2E343B] text-[#8A94A0] hover:border-[#4A515A]'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#FF7A00]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#606A75]" />
                )}
                <span>{r.part_number}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded ${
                    r.calculated_status === 'OK'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {r.calculated_status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedReports.length < 2 ? (
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-12 text-center space-y-3">
          <GitCompare className="w-8 h-8 text-[#8A94A0] mx-auto" />
          <h3 className="text-sm font-semibold text-white">Select at Least 2 Reports to Compare</h3>
          <p className="text-xs text-[#8A94A0] max-w-sm mx-auto">
            Check the boxes above to compare lead deviation trends, tolerance violations, and tooth variations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metric Selector & Charts */}
          <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Comparative Trend Analysis
                </h3>
                <p className="text-[11px] text-[#8A94A0]">
                  Comparing {selectedReports.length} inspection reports across teeth positions
                </p>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 bg-[#141618] p-1 rounded-lg border border-[#272B30] text-xs font-mono">
                <button
                  onClick={() => setMetricToCompare('fHbeta')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    metricToCompare === 'fHbeta'
                      ? 'bg-[#FF7A00] text-black font-bold'
                      : 'text-[#8A94A0] hover:text-white'
                  }`}
                >
                  fHβ (Slope)
                </button>
                <button
                  onClick={() => setMetricToCompare('ffp')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    metricToCompare === 'ffp'
                      ? 'bg-[#FF7A00] text-black font-bold'
                      : 'text-[#8A94A0] hover:text-white'
                  }`}
                >
                  ffβ (Form)
                </button>
                <button
                  onClick={() => setMetricToCompare('Fp')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    metricToCompare === 'Fp'
                      ? 'bg-[#FF7A00] text-black font-bold'
                      : 'text-[#8A94A0] hover:text-white'
                  }`}
                >
                  Fβ (Total)
                </button>
                <button
                  onClick={() => setMetricToCompare('vfHbeta')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    metricToCompare === 'vfHbeta'
                      ? 'bg-[#FF7A00] text-black font-bold'
                      : 'text-[#8A94A0] hover:text-white'
                  }`}
                >
                  vfHβ (Crown)
                </button>
              </div>
            </div>

            {/* Recharts Trend Line */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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

                  {/* Tolerance boundary reference lines */}
                  {metricToCompare === 'fHbeta' && (
                    <>
                      <ReferenceLine y={30} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '+30 µm Upper Limit', fill: '#EF4444', fontSize: 10 }} />
                      <ReferenceLine y={-38} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '-38 µm Lower Limit', fill: '#EF4444', fontSize: 10 }} />
                    </>
                  )}
                  {metricToCompare === 'ffp' && (
                    <ReferenceLine y={20} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '20 µm Upper Limit', fill: '#EF4444', fontSize: 10 }} />
                  )}

                  {metricToCompare !== 'vfHbeta' ? (
                    <>
                      <Line type="monotone" dataKey="leftAvg" name="Left Flank Avg (µm)" stroke="#FF7A00" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="rightAvg" name="Right Flank Avg (µm)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="leftT1" name="Left Tooth 1 (µm)" stroke="#F59E0B" strokeDasharray="3 3" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="rightT1" name="Right Tooth 1 (µm)" stroke="#8B5CF6" strokeDasharray="3 3" dot={{ r: 3 }} />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="leftCrown" name="Left Crowning (µm)" stroke="#FF7A00" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="rightCrown" name="Right Crowning (µm)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Side-by-Side Comparison Table */}
          <div className="bg-[#181A1D] border border-[#272B30] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#272B30]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Measurement Comparison Matrix
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141618] text-[#8A94A0] uppercase text-[10px] border-b border-[#272B30]">
                  <tr>
                    <th className="py-3 px-4">Part Number</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center bg-blue-950/20 text-blue-400">Left Avg</th>
                    <th className="py-3 px-3 text-center bg-blue-950/20 text-blue-400">Left T1</th>
                    <th className="py-3 px-3 text-center bg-blue-950/20 text-blue-400">Left T12</th>
                    <th className="py-3 px-3 text-center bg-blue-950/20 text-blue-400">Left T23</th>
                    <th className="py-3 px-3 text-center bg-blue-950/20 text-blue-400">Left T33</th>
                    <th className="py-3 px-3 text-center bg-indigo-950/20 text-indigo-400">Right T1</th>
                    <th className="py-3 px-3 text-center bg-indigo-950/20 text-indigo-400">Right T12</th>
                    <th className="py-3 px-3 text-center bg-indigo-950/20 text-indigo-400">Right T23</th>
                    <th className="py-3 px-3 text-center bg-indigo-950/20 text-indigo-400">Right T33</th>
                    <th className="py-3 px-3 text-center bg-indigo-950/20 text-indigo-400">Right Avg</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23272C] text-[#D1D9E0]">
                  {selectedReports.map((r) => {
                    const row = r.measurements.rows.find((x) => x.name === metricToCompare);

                    return (
                      <tr key={r.report_id} className="hover:bg-[#1E2227] transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{r.part_number}</td>
                        <td className="py-3 px-3 text-[#8A94A0]">{r.metadata.inspection_date}</td>
                        <td className="py-3 px-3">
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

                        {/* Left flank values */}
                        <td className="py-3 px-3 text-center font-bold text-gray-100 bg-blue-950/10">
                          {row?.left.avg ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center bg-blue-950/10">
                          {row?.left.teeth['1'] ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center bg-blue-950/10">
                          {row?.left.teeth['12'] ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center bg-blue-950/10">
                          {row?.left.teeth['23'] ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center bg-blue-950/10">
                          {row?.left.teeth['33'] ?? '—'}
                        </td>

                        {/* Right flank values */}
                        <td className="py-3 px-3 text-center bg-indigo-950/10">
                          {row?.right.teeth['1'] ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center bg-indigo-950/10">
                          {row?.right.teeth['12'] ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center bg-indigo-950/10">
                          {row?.right.teeth['23'] ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center bg-indigo-950/10">
                          {row?.right.teeth['33'] ?? '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-gray-100 bg-indigo-950/10">
                          {row?.right.avg ?? '—'}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setActiveReportId(r.report_id);
                              setActiveTab('results');
                            }}
                            className="text-[#FF7A00] hover:text-[#FFA347] text-xs font-semibold cursor-pointer"
                          >
                            Inspect
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
      )}
    </div>
  );
}

