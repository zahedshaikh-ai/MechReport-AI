'use client';

import React, { useState } from 'react';
import { useInspection } from '@/context/InspectionContext';
import { Sliders, Save, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';
import { ToleranceConfig } from '@/types/inspection';

export function ToleranceSettings() {
  const { toleranceConfig, updateTolerances, reports } = useInspection();

  const [drawingNumber, setDrawingNumber] = useState<string>(
    toleranceConfig.drawing_number
  );
  const [ffpUpper, setFfpUpper] = useState<number>(toleranceConfig.ffp_upper);
  const [fHbetaUpper, setFHbetaUpper] = useState<number>(toleranceConfig.fHbeta_upper);
  const [fHbetaLower, setFHbetaLower] = useState<number>(toleranceConfig.fHbeta_lower);
  const [updatedBy, setUpdatedBy] = useState<string>(
    toleranceConfig.updated_by || 'Quality Engineer (Admin)'
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    if (fHbetaUpper <= fHbetaLower) {
      setError('fHβ Upper tolerance limit must be strictly greater than lower tolerance limit.');
      return;
    }

    if (ffpUpper <= 0) {
      setError('ffβ Upper tolerance limit must be greater than zero.');
      return;
    }

    const newConfig: ToleranceConfig = {
      drawing_number: drawingNumber,
      ffp_upper: ffpUpper,
      fHbeta_upper: fHbetaUpper,
      fHbeta_lower: fHbetaLower,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    await updateTolerances(newConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const resetToZeissDefaults = () => {
    setFfpUpper(20);
    setFHbetaUpper(30);
    setFHbetaLower(-38);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#FF7A00]" />
          Gear Inspection Tolerance Specifications
        </h2>
        <p className="text-xs text-[#8A94A0] mt-0.5">
          Configure rule thresholds for independent quality pass/fail calculations.
          The source PDF original ZEISS status is always preserved separately.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[#181A1D] border border-[#272B30] rounded-xl p-6 space-y-6">
        {/* Drawing Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white uppercase tracking-wider">
            Target Drawing Number
          </label>
          <input
            type="text"
            value={drawingNumber}
            onChange={(e) => setDrawingNumber(e.target.value)}
            required
            className="w-full bg-[#141618] border border-[#2E343B] text-white text-xs font-mono rounded-lg px-3 py-2.5 focus:border-[#FF7A00] focus:outline-none"
          />
          <p className="text-[11px] text-[#8A94A0]">
            Applies to all inspected gears under drawing: <span className="font-mono text-white">M0166472_Z43_K13</span>
          </p>
        </div>

        {/* Tolerance Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#272B30]">
          {/* fHβ Upper */}
          <div className="space-y-1.5 bg-[#141618] p-4 rounded-lg border border-[#2E343B]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white font-mono">
                fHβ Upper Limit (+Tol)
              </label>
              <span className="text-[10px] text-[#FF7A00] font-mono">µm</span>
            </div>
            <input
              type="number"
              value={fHbetaUpper}
              onChange={(e) => setFHbetaUpper(parseFloat(e.target.value))}
              required
              step="1"
              className="w-full bg-[#1A1D21] border border-[#3A4048] text-white text-sm font-mono rounded px-3 py-2 focus:border-[#FF7A00] focus:outline-none"
            />
            <p className="text-[10px] text-[#8A94A0]">
              ZEISS Reference default: <span className="font-mono text-gray-300">+30 µm</span>
            </p>
          </div>

          {/* fHβ Lower */}
          <div className="space-y-1.5 bg-[#141618] p-4 rounded-lg border border-[#2E343B]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white font-mono">
                fHβ Lower Limit (-Tol)
              </label>
              <span className="text-[10px] text-[#FF7A00] font-mono">µm</span>
            </div>
            <input
              type="number"
              value={fHbetaLower}
              onChange={(e) => setFHbetaLower(parseFloat(e.target.value))}
              required
              step="1"
              className="w-full bg-[#1A1D21] border border-[#3A4048] text-white text-sm font-mono rounded px-3 py-2 focus:border-[#FF7A00] focus:outline-none"
            />
            <p className="text-[10px] text-[#8A94A0]">
              ZEISS Reference default: <span className="font-mono text-gray-300">-38 µm</span> (or -37 µm right)
            </p>
          </div>

          {/* ffβ Upper */}
          <div className="space-y-1.5 bg-[#141618] p-4 rounded-lg border border-[#2E343B]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white font-mono">
                ffβ / ffp Upper Limit
              </label>
              <span className="text-[10px] text-[#FF7A00] font-mono">µm</span>
            </div>
            <input
              type="number"
              value={ffpUpper}
              onChange={(e) => setFfpUpper(parseFloat(e.target.value))}
              required
              step="1"
              className="w-full bg-[#1A1D21] border border-[#3A4048] text-white text-sm font-mono rounded px-3 py-2 focus:border-[#FF7A00] focus:outline-none"
            />
            <p className="text-[10px] text-[#8A94A0]">
              ZEISS Reference default: <span className="font-mono text-gray-300">20 µm</span>
            </p>
          </div>

          {/* Engineer Signature */}
          <div className="space-y-1.5 bg-[#141618] p-4 rounded-lg border border-[#2E343B]">
            <label className="text-xs font-bold text-white">
              Configured By (Quality Engineer)
            </label>
            <input
              type="text"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              required
              className="w-full bg-[#1A1D21] border border-[#3A4048] text-white text-xs rounded px-3 py-2 focus:border-[#FF7A00] focus:outline-none"
            />
            <p className="text-[10px] text-[#8A94A0]">
              Recorded for audit trail compliance
            </p>
          </div>
        </div>

        {/* Feedback message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Tolerances saved! Recalculated {reports.length} loaded reports automatically.</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#272B30]">
          <button
            type="button"
            onClick={resetToZeissDefaults}
            className="text-xs text-[#8A94A0] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to ZEISS Report Defaults</span>
          </button>

          <button
            type="submit"
            className="bg-[#FF7A00] hover:bg-[#E66E00] text-black font-bold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-[#FF7A00]/20 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply & Recalculate Reports</span>
          </button>
        </div>
      </form>
    </div>
  );
}

