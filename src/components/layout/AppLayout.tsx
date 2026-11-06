'use client';

import React from 'react';
import { useInspection, NavigationTab } from '@/context/InspectionContext';
import {
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  GitCompare,
  Download,
  History,
  Sliders,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  Database,
  Trash2,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    reports,
    activeTab,
    setActiveTab,
    isLoading,
    loadingMessage,
    loadingProgress,
    loadReferenceReportsDemo,
    clearHistory,
  } = useInspection();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Reports', icon: UploadCloud },
    {
      id: 'results',
      label: 'Inspection Results',
      icon: FileCheck2,
      badge: reports.length,
    },
    { id: 'comparison', label: 'Compare Reports', icon: GitCompare },
    { id: 'export', label: 'Export Center', icon: Download },
    { id: 'history', label: 'Inspection History', icon: History },
    { id: 'settings', label: 'Tolerance Settings', icon: Sliders },
  ];

  return (
    <div className="flex h-screen bg-[#111315] text-[#E1E7EC] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#181A1D] border-r border-[#272B30] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Area */}
          <div className="p-5 border-b border-[#272B30] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF7A00] flex items-center justify-center font-bold text-black text-lg shadow-md shadow-[#FF7A00]/20">
              <Layers className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                MechReport <span className="text-[#FF7A00] text-xs font-mono uppercase bg-[#FF7A00]/10 px-1.5 py-0.5 rounded border border-[#FF7A00]/30">AI</span>
              </h1>
              <p className="text-[11px] text-[#8A94A0] font-mono">ZEISS GEAR PRO Suite</p>
            </div>
          </div>

          {/* Quick Demo Action */}
          <div className="px-4 py-3">
            <button
              onClick={() => loadReferenceReportsDemo()}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FF7A00] to-[#E66E00] hover:from-[#FF8C1A] hover:to-[#FF7A00] text-black font-semibold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-[#FF7A00]/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Load 8 Reference Samples</span>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#24282D] text-[#FF7A00] font-semibold border-l-2 border-[#FF7A00]'
                      : 'text-[#8A94A0] hover:text-[#E1E7EC] hover:bg-[#202327]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF7A00]' : 'text-[#8A94A0]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2E343B] text-[#8A94A0] font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Status */}
        <div className="p-4 border-t border-[#272B30] bg-[#141618] text-[11px] text-[#8A94A0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Engine Online
            </span>
            <span className="font-mono text-[10px] bg-[#202428] px-1.5 py-0.5 rounded text-gray-400">
              v2023 SP1
            </span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono flex items-center justify-between">
            <span>Drawing: M0166472_Z43</span>
            <span>z=43 spur</span>
          </div>
          {reports.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all processed reports from browser storage?')) {
                  clearHistory();
                }
              }}
              className="w-full text-left flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-red-400 transition-colors pt-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear browser memory</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#111315]">
        {/* Top Header */}
        <header className="h-14 border-b border-[#272B30] bg-[#181A1D]/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold capitalize text-white">
              {activeTab === 'dashboard' && 'Quality Inspection Executive Dashboard'}
              {activeTab === 'upload' && 'ZEISS GEAR PRO Batch Ingestion'}
              {activeTab === 'results' && 'Inspection Results & Measurement Matrix'}
              {activeTab === 'comparison' && 'Multi-Report Lead Deviation Comparison'}
              {activeTab === 'export' && 'Export Center (XLSX, CSV, PDF)'}
              {activeTab === 'history' && 'IndexedDB Inspection Trace Archive'}
              {activeTab === 'settings' && 'Drawing Tolerances & Specification Limits'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#202428] px-3 py-1 rounded-full text-xs font-mono text-[#8A94A0] border border-[#2E343B]">
              <Database className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>{reports.length} Reports Loaded</span>
            </div>

            <button
              onClick={() => setActiveTab('upload')}
              className="bg-[#272B30] hover:bg-[#32373E] text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Upload PDF</span>
            </button>
          </div>
        </header>

        {/* Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Loading Modal Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1F23] border border-[#2E343B] rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center text-[#FF7A00] animate-spin">
              <Loader2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Processing ZEISS GEAR PRO Reports</h3>
              <p className="text-xs text-[#8A94A0] mt-1 font-mono">{loadingMessage}</p>
            </div>

            {loadingProgress && (
              <div className="w-full space-y-1.5">
                <div className="w-full bg-[#272B30] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF7A00] h-full transition-all duration-300"
                    style={{
                      width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8A94A0] font-mono">
                  <span>Batch Progress</span>
                  <span>
                    {loadingProgress.current} / {loadingProgress.total} (
                    {Math.round((loadingProgress.current / loadingProgress.total) * 100)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

