'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  InspectionReport,
  ToleranceConfig,
  InspectionStatus,
  ExtractedMeasurementTable,
} from '@/types/inspection';
import {
  getStoredReports,
  saveReport,
  saveMultipleReports,
  deleteReportById,
  clearAllReports,
  getToleranceConfig,
  saveToleranceConfig,
} from '@/lib/storage';
import { processInspectionPdf } from '@/lib/extractor';
import { analyzeInspection } from '@/lib/extractor/validationEngine';

export type NavigationTab =
  | 'dashboard'
  | 'upload'
  | 'results'
  | 'comparison'
  | 'export'
  | 'history'
  | 'settings';

interface InspectionContextType {
  reports: InspectionReport[];
  activeReport: InspectionReport | null;
  activeReportId: string | null;
  selectedReportIds: string[];
  activeTab: NavigationTab;
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: { current: number; total: number } | null;
  toleranceConfig: ToleranceConfig;
  setActiveTab: (tab: NavigationTab) => void;
  setActiveReportId: (id: string | null) => void;
  toggleSelectReportForComparison: (id: string) => void;
  selectAllForComparison: () => void;
  clearComparisonSelection: () => void;
  processFiles: (files: File[]) => Promise<void>;
  loadReferenceReportsDemo: () => Promise<void>;
  removeReport: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateReportTable: (reportId: string, updatedTable: ExtractedMeasurementTable) => Promise<void>;
  updateTolerances: (config: ToleranceConfig) => Promise<void>;
}

const DEFAULT_TOLERANCE: ToleranceConfig = {
  drawing_number: 'M0166472_Z43_K13',
  ffp_upper: 20,
  fHbeta_upper: 30,
  fHbeta_lower: -38,
  updated_by: 'Quality Engineer (Admin)',
  updated_at: new Date().toISOString(),
};

const InspectionContext = createContext<InspectionContextType | undefined>(undefined);

export function InspectionProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);
  const [toleranceConfig, setToleranceConfig] = useState<ToleranceConfig>(DEFAULT_TOLERANCE);

  // Load initial reports and tolerance configs from IndexedDB on mount
  useEffect(() => {
    async function init() {
      const stored = await getStoredReports();
      setReports(stored);
      if (stored.length > 0) {
        setActiveReportId(stored[0].report_id);
      }
      const savedTol = await getToleranceConfig(DEFAULT_TOLERANCE.drawing_number);
      if (savedTol) setToleranceConfig(savedTol);
    }
    init();
  }, []);

  const activeReport = reports.find((r) => r.report_id === activeReportId) || null;

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    setIsLoading(true);
    setLoadingProgress({ current: 0, total: files.length });

    const newReports: InspectionReport[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setLoadingMessage(`Extracting & analyzing ${file.name} (${i + 1}/${files.length})...`);
      setLoadingProgress({ current: i + 1, total: files.length });

      try {
        const buffer = await file.arrayBuffer();
        const pdfBlobUrl = URL.createObjectURL(file);
        const report = await processInspectionPdf(
          buffer,
          file.name,
          file.size,
          toleranceConfig,
          pdfBlobUrl
        );
        newReports.push(report);
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
      }
    }

    if (newReports.length > 0) {
      await saveMultipleReports(newReports);
      setReports((prev) => {
        const existingIds = new Set(prev.map((p) => p.report_id));
        const combined = [...newReports, ...prev.filter((p) => !existingIds.has(p.report_id))];
        return combined;
      });
      setActiveReportId(newReports[0].report_id);
      setActiveTab('results');
    }

    setIsLoading(false);
    setLoadingProgress(null);
    setLoadingMessage('');
  };

  // One-click demo loader: loads the 8 reference reports from public directory
  const loadReferenceReportsDemo = async () => {
    setIsLoading(true);
    setLoadingMessage('Fetching reference reports list...');

    try {
      const res = await fetch('/api/reference-reports');
      const data = await res.json();
      const sampleList: { fileName: string; url: string }[] = data.reports;

      setLoadingProgress({ current: 0, total: sampleList.length });
      const loadedReports: InspectionReport[] = [];

      for (let i = 0; i < sampleList.length; i++) {
        const sample = sampleList[i];
        setLoadingMessage(`Processing reference sample ${i + 1} of ${sampleList.length}: ${sample.fileName}`);
        setLoadingProgress({ current: i + 1, total: sampleList.length });

        const pdfRes = await fetch(sample.url);
        const buffer = await pdfRes.arrayBuffer();
        const report = await processInspectionPdf(
          buffer,
          sample.fileName,
          buffer.byteLength,
          toleranceConfig,
          sample.url
        );
        loadedReports.push(report);
      }

      await saveMultipleReports(loadedReports);
      setReports((prev) => {
        // Merge without duplicating
        const map = new Map<string, InspectionReport>();
        loadedReports.forEach((r) => map.set(r.part_number, r));
        prev.forEach((r) => {
          if (!map.has(r.part_number)) map.set(r.part_number, r);
        });
        return Array.from(map.values());
      });

      if (loadedReports.length > 0) {
        setActiveReportId(loadedReports[0].report_id);
        setSelectedReportIds(loadedReports.slice(0, 4).map((r) => r.report_id));
      }
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to load reference demo reports:', err);
    } finally {
      setIsLoading(false);
      setLoadingProgress(null);
      setLoadingMessage('');
    }
  };

  const removeReport = async (id: string) => {
    await deleteReportById(id);
    setReports((prev) => prev.filter((r) => r.report_id !== id));
    if (activeReportId === id) {
      setActiveReportId(reports.find((r) => r.report_id !== id)?.report_id || null);
    }
    setSelectedReportIds((prev) => prev.filter((item) => item !== id));
  };

  const clearHistory = async () => {
    await clearAllReports();
    setReports([]);
    setActiveReportId(null);
    setSelectedReportIds([]);
  };

  const toggleSelectReportForComparison = (id: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllForComparison = () => {
    setSelectedReportIds(reports.map((r) => r.report_id));
  };

  const clearComparisonSelection = () => {
    setSelectedReportIds([]);
  };

  const updateReportTable = async (
    reportId: string,
    updatedTable: ExtractedMeasurementTable
  ) => {
    const reportIndex = reports.findIndex((r) => r.report_id === reportId);
    if (reportIndex === -1) return;

    const current = reports[reportIndex];
    // Re-evaluate analysis
    const newAnalysis = analyzeInspection(
      current.original_status,
      updatedTable,
      toleranceConfig
    );

    const updatedReport: InspectionReport = {
      ...current,
      measurements: updatedTable,
      analysis: newAnalysis,
      calculated_status: newAnalysis.calculated_status,
      is_manually_edited: true,
    };

    await saveReport(updatedReport);
    setReports((prev) => {
      const copy = [...prev];
      copy[reportIndex] = updatedReport;
      return copy;
    });
  };

  const updateTolerances = async (newConfig: ToleranceConfig) => {
    setToleranceConfig(newConfig);
    await saveToleranceConfig(newConfig);

    // Recalculate status for all loaded reports based on new tolerances
    const updated = reports.map((r) => {
      const newAnalysis = analyzeInspection(
        r.original_status,
        r.measurements,
        newConfig
      );
      return {
        ...r,
        analysis: newAnalysis,
        calculated_status: newAnalysis.calculated_status,
      };
    });

    setReports(updated);
    await saveMultipleReports(updated);
  };

  return (
    <InspectionContext.Provider
      value={{
        reports,
        activeReport,
        activeReportId,
        selectedReportIds,
        activeTab,
        isLoading,
        loadingMessage,
        loadingProgress,
        toleranceConfig,
        setActiveTab,
        setActiveReportId,
        toggleSelectReportForComparison,
        selectAllForComparison,
        clearComparisonSelection,
        processFiles,
        loadReferenceReportsDemo,
        removeReport,
        clearHistory,
        updateReportTable,
        updateTolerances,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspection must be used within an InspectionProvider');
  }
  return context;
}

