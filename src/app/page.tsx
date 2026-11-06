'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInspection } from '@/context/InspectionContext';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { UploadCenter } from '@/components/upload/UploadCenter';
import { InspectionResultDetail } from '@/components/results/InspectionResultDetail';
import { MultiReportComparison } from '@/components/comparison/MultiReportComparison';
import { ExportCenter } from '@/components/export/ExportCenter';
import { InspectionHistory } from '@/components/history/InspectionHistory';
import { ToleranceSettings } from '@/components/settings/ToleranceSettings';

export default function Home() {
  const { activeTab } = useInspection();

  return (
    <AppLayout>
      {activeTab === 'dashboard' && <DashboardOverview />}
      {activeTab === 'upload' && <UploadCenter />}
      {activeTab === 'results' && <InspectionResultDetail />}
      {activeTab === 'comparison' && <MultiReportComparison />}
      {activeTab === 'export' && <ExportCenter />}
      {activeTab === 'history' && <InspectionHistory />}
      {activeTab === 'settings' && <ToleranceSettings />}
    </AppLayout>
  );
}

