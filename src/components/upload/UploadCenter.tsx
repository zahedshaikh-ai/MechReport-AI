'use client';

import React, { useState, useRef } from 'react';
import { useInspection } from '@/context/InspectionContext';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

export function UploadCenter() {
  const { processFiles, loadReferenceReportsDemo, isLoading } = useInspection();
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setValidationError(null);

    const validPdfs: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setValidationError(`"${file.name}" is not a valid PDF file.`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setValidationError(`"${file.name}" exceeds the 50MB maximum file size limit.`);
        continue;
      }
      validPdfs.push(file);
    }

    if (validPdfs.length > 0) {
      setStagedFiles((prev) => [...prev, ...validPdfs]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleStartProcessing = async () => {
    if (stagedFiles.length === 0) return;
    await processFiles(stagedFiles);
    setStagedFiles([]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          PDF Inspection Upload Center
        </h2>
        <p className="text-xs text-[#8A94A0] mt-0.5">
          Ingest single or batch ZEISS GEAR PRO 2023 SP1 Involute reports for automated extraction.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
          dragActive
            ? 'border-[#FF7A00] bg-[#FF7A00]/5'
            : 'border-[#2E343B] bg-[#181A1D] hover:border-[#404750]'
        }`}
      >
        <div className="w-14 h-14 rounded-full bg-[#22262B] text-[#FF7A00] flex items-center justify-center">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">
            Drag and drop your ZEISS inspection PDF reports here
          </p>
          <p className="text-xs text-[#8A94A0]">
            Supports individual reports or multi-file batches up to 50MB per file
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#FF7A00] hover:bg-[#E66E00] text-black font-semibold text-xs py-2 px-4 rounded-lg transition-all cursor-pointer shadow-sm shadow-[#FF7A00]/20"
          >
            Browse Local PDF Files
          </button>
          <span className="text-xs text-[#606A75]">or</span>
          <button
            onClick={() => loadReferenceReportsDemo()}
            disabled={isLoading}
            className="bg-[#24282D] hover:bg-[#2C3137] text-white font-medium text-xs py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-[#3A4048]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
            <span>Load 8 Reference Samples</span>
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Staged Files List */}
      {stagedFiles.length > 0 && (
        <div className="bg-[#181A1D] border border-[#272B30] rounded-xl overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#FF7A00]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Staged for Extraction ({stagedFiles.length})
              </h3>
            </div>
            <button
              onClick={() => setStagedFiles([])}
              className="text-xs text-[#8A94A0] hover:text-red-400 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {stagedFiles.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="bg-[#202428] border border-[#2E343B] rounded-lg px-3 py-2 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-[#FF7A00] shrink-0" />
                  <span className="font-mono text-white truncate">{f.name}</span>
                  <span className="text-[10px] text-[#8A94A0] font-mono shrink-0">
                    ({Math.round(f.size / 1024)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeStagedFile(idx)}
                  className="text-[#8A94A0] hover:text-red-400 p-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartProcessing}
            disabled={isLoading}
            className="w-full bg-[#FF7A00] hover:bg-[#E66E00] text-black font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md shadow-[#FF7A00]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Begin Extraction & Analysis ({stagedFiles.length} files)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Technical Extraction Strategy Card */}
      <div className="bg-[#181A1D] border border-[#272B30] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Engine Processing Strategy
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#8A94A0]">
          <div className="bg-[#141618] p-3 rounded-lg border border-[#23272C] space-y-1">
            <span className="font-semibold text-white">1. Native Coordinate Parsing</span>
            <p className="text-[11px]">
              Extracts text stream with exact 2D transforms, sorting into horizontal bands and columns.
            </p>
          </div>
          <div className="bg-[#141618] p-3 rounded-lg border border-[#23272C] space-y-1">
            <span className="font-semibold text-white">2. Table Reconstruction</span>
            <p className="text-[11px]">
              Maps left/right flanks across teeth 33, 23, 12, 1, averages, and tolerances without hardcoding.
            </p>
          </div>
          <div className="bg-[#141618] p-3 rounded-lg border border-[#23272C] space-y-1">
            <span className="font-semibold text-white">3. Traceable Verification</span>
            <p className="text-[11px]">
              Compares against DIN 3962 / ISO 1328 rules while preserving the original ZEISS stamp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

