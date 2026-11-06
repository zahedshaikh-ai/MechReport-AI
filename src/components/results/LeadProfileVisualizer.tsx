'use client';

import React, { useState } from 'react';
import { InspectionReport } from '@/types/inspection';
import { Eye, ShieldAlert, CheckCircle, Sliders, Info } from 'lucide-react';

interface Props {
  report: InspectionReport;
}

export function LeadProfileVisualizer({ report }: Props) {
  const [selectedFlank, setSelectedFlank] = useState<'left' | 'right'>('left');
  const [showTolerances, setShowTolerances] = useState<boolean>(true);

  const fpRow = report.measurements.rows.find((r) => r.name === 'Fp');
  const ffpRow = report.measurements.rows.find((r) => r.name === 'ffp');
  const fHRow = report.measurements.rows.find((r) => r.name === 'fHbeta');
  const vfHRow = report.measurements.rows.find((r) => r.name === 'vfHbeta');

  const teeth = selectedFlank === 'left' ? ['33', '23', '12', '1'] : ['1', '12', '23', '33'];

  const crowningVal =
    selectedFlank === 'left'
      ? vfHRow?.left.crowning_value ?? 25
      : vfHRow?.right.crowning_value ?? 25;

  const upperTol =
    selectedFlank === 'left' ? fHRow?.left.tol_upper ?? 30 : fHRow?.right.tol_upper ?? 30;
  const lowerTol =
    selectedFlank === 'left' ? fHRow?.left.tol_lower ?? -38 : fHRow?.right.tol_lower ?? -37;

  return (
    <div className="bg-[#141618] border border-[#272B30] rounded-xl p-5 space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#272B30] pb-3">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FF7A00]" />
            Synthesized Lead Profile Curves (Tooth Traces)
          </h4>
          <p className="text-[11px] text-[#8A94A0] mt-0.5">
            Reference length L = 33.400 mm (top: -2.500 mm, bottom: -35.900 mm), DIN 3962
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Flank Toggle */}
          <div className="flex items-center gap-1 bg-[#1C1F23] p-1 rounded-lg border border-[#2E343B] text-xs font-mono">
            <button
              onClick={() => setSelectedFlank('left')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                selectedFlank === 'left'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-[#8A94A0] hover:text-white'
              }`}
            >
              Left Flank (-)
            </button>
            <button
              onClick={() => setSelectedFlank('right')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                selectedFlank === 'right'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-[#8A94A0] hover:text-white'
              }`}
            >
              Right Flank (+)
            </button>
          </div>

          {/* Tolerance Toggle */}
          <button
            onClick={() => setShowTolerances(!showTolerances)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showTolerances
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-[#1C1F23] text-gray-400 border-[#2E343B]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tolerance Envelope</span>
          </button>
        </div>
      </div>

      {/* SVG Multi-Tooth Trace Profiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {teeth.map((t) => {
          const flankData = selectedFlank === 'left' ? fHRow?.left : fHRow?.right;
          const toothFH = flankData?.teeth[t] ?? 0;
          const toothFfp = (selectedFlank === 'left' ? ffpRow?.left : ffpRow?.right)?.teeth[t] ?? 10;
          const toothFp = (selectedFlank === 'left' ? fpRow?.left : fpRow?.right)?.teeth[t] ?? 20;

          const isOut = toothFH > upperTol || toothFH < lowerTol;

          // Generate SVG path for lead profile trace curve
          // 40 height steps from top (y=20) to bottom (y=220)
          const svgHeight = 200;
          const startY = 25;
          const centerX = 75; // nominal line

          const points: string[] = [];
          for (let step = 0; step <= 20; step++) {
            const frac = step / 20; // 0 to 1
            const y = startY + frac * svgHeight;

            // Tilt from slope deviation fHbeta (scaled for display: 1 um = 0.5px)
            const slopeDev = toothFH * (frac - 0.5) * 0.45;

            // Crowning curvature (parabolic dome)
            const crownDev = crowningVal * 4 * frac * (1 - frac) * 0.2;

            // Micro-waviness from form error ffp
            const formWaviness = Math.sin(frac * Math.PI * 4) * (toothFfp * 0.15);

            const x = centerX + slopeDev + crownDev + formWaviness;
            points.push(`${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`);
          }

          const pathD = `M ${points.join(' L ')}`;

          // Upper and Lower tolerance boundary X positions
          const tolUpperX = centerX + upperTol * 0.45;
          const tolLowerX = centerX + lowerTol * 0.45;

          return (
            <div
              key={t}
              className={`bg-[#181A1D] border rounded-xl p-3.5 space-y-2 flex flex-col items-center ${
                isOut ? 'border-red-500/50 bg-red-950/10' : 'border-[#272B30]'
              }`}
            >
              {/* Tooth Header */}
              <div className="w-full flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white">Tooth #{t}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isOut
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  fHβ: {toothFH} µm
                </span>
              </div>

              {/* Graphic Canvas Viewport */}
              <div className="w-full h-64 bg-[#111315] rounded-lg border border-[#23272C] relative overflow-hidden flex items-center justify-center">
                <svg
                  viewBox="0 0 150 250"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Grid Lines */}
                  <line x1="20" y1="25" x2="130" y2="25" stroke="#252A30" strokeDasharray="2 2" />
                  <line x1="20" y1="125" x2="130" y2="125" stroke="#252A30" strokeDasharray="2 2" />
                  <line x1="20" y1="225" x2="130" y2="225" stroke="#252A30" strokeDasharray="2 2" />

                  {/* Nominal Axis (0 deviation line) */}
                  <line
                    x1={centerX}
                    y1="15"
                    x2={centerX}
                    y2="235"
                    stroke="#4B5563"
                    strokeWidth="1.2"
                  />

                  {/* Tolerance Envelope Bands */}
                  {showTolerances && (
                    <>
                      {/* Upper Limit Line */}
                      <line
                        x1={tolUpperX}
                        y1="20"
                        x2={tolUpperX}
                        y2="230"
                        stroke="#EF4444"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      {/* Lower Limit Line */}
                      <line
                        x1={tolLowerX}
                        y1="20"
                        x2={tolLowerX}
                        y2="230"
                        stroke="#EF4444"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      {/* Tolerance Area Fill */}
                      <rect
                        x={Math.min(tolLowerX, tolUpperX)}
                        y="20"
                        width={Math.abs(tolUpperX - tolLowerX)}
                        height="210"
                        fill="#EF4444"
                        fillOpacity="0.04"
                      />
                    </>
                  )}

                  {/* Actual Measured Lead Trace Profile Curve */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isOut ? '#EF4444' : '#10B981'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Scale Labels */}
                  <text x="5" y="30" fill="#6B7280" fontSize="8" fontFamily="monospace">
                    -2.5 mm
                  </text>
                  <text x="5" y="225" fill="#6B7280" fontSize="8" fontFamily="monospace">
                    -35.9 mm
                  </text>
                  <text x={centerX - 4} y="12" fill="#9CA3AF" fontSize="8" fontFamily="monospace">
                    0
                  </text>
                </svg>

                {/* Status Indicator Stamp */}
                <div className="absolute top-2 right-2">
                  {isOut ? (
                    <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Tooth Metrics Footer */}
              <div className="w-full grid grid-cols-2 gap-1 text-[10px] font-mono text-[#8A94A0] pt-1 border-t border-[#272B30]">
                <div>Fβ: <span className="text-white font-bold">{toothFp} µm</span></div>
                <div>ffβ: <span className="text-white font-bold">{toothFfp} µm</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
