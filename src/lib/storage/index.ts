import { InspectionReport, ToleranceConfig } from '@/types/inspection';
import { get, set, del, keys } from 'idb-keyval';

const REPORTS_STORE_KEY = 'mechreport_saved_reports';
const TOLERANCES_STORE_KEY = 'mechreport_tolerances';

// In-memory fallback for SSR
let memoryReports: InspectionReport[] = [];
let memoryTolerances: Record<string, ToleranceConfig> = {};

export async function getStoredReports(): Promise<InspectionReport[]> {
  if (typeof window === 'undefined') return memoryReports;
  try {
    const data = await get<InspectionReport[]>(REPORTS_STORE_KEY);
    return data || [];
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to localStorage:', err);
    try {
      const raw = localStorage.getItem(REPORTS_STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return memoryReports;
    }
  }
}

export async function saveReport(report: InspectionReport): Promise<void> {
  if (typeof window === 'undefined') {
    memoryReports.unshift(report);
    return;
  }
  try {
    const existing = await getStoredReports();
    // Update if exists, or prepend
    const index = existing.findIndex((r) => r.report_id === report.report_id);
    if (index >= 0) {
      existing[index] = report;
    } else {
      existing.unshift(report);
    }
    await set(REPORTS_STORE_KEY, existing);
    try {
      localStorage.setItem(REPORTS_STORE_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch {}
  } catch (err) {
    console.error('Failed to save report to IndexedDB:', err);
  }
}

export async function saveMultipleReports(reports: InspectionReport[]): Promise<void> {
  if (typeof window === 'undefined') {
    memoryReports = [...reports, ...memoryReports];
    return;
  }
  try {
    const existing = await getStoredReports();
    const existingIds = new Set(existing.map((r) => r.report_id));
    const merged = [...existing];
    for (const r of reports) {
      if (!existingIds.has(r.report_id)) {
        merged.unshift(r);
        existingIds.add(r.report_id);
      }
    }
    await set(REPORTS_STORE_KEY, merged);
  } catch (err) {
    console.error('Failed to save batch reports:', err);
  }
}

export async function deleteReportById(reportId: string): Promise<void> {
  const existing = await getStoredReports();
  const filtered = existing.filter((r) => r.report_id !== reportId);
  if (typeof window !== 'undefined') {
    await set(REPORTS_STORE_KEY, filtered);
    try {
      localStorage.setItem(REPORTS_STORE_KEY, JSON.stringify(filtered.slice(0, 50)));
    } catch {}
  } else {
    memoryReports = filtered;
  }
}

export async function clearAllReports(): Promise<void> {
  if (typeof window !== 'undefined') {
    await del(REPORTS_STORE_KEY);
    try {
      localStorage.removeItem(REPORTS_STORE_KEY);
    } catch {}
  }
  memoryReports = [];
}

export async function getToleranceConfig(drawingNumber: string): Promise<ToleranceConfig | null> {
  if (typeof window === 'undefined') return memoryTolerances[drawingNumber] || null;
  try {
    const configs = (await get<Record<string, ToleranceConfig>>(TOLERANCES_STORE_KEY)) || {};
    return configs[drawingNumber] || null;
  } catch {
    return memoryTolerances[drawingNumber] || null;
  }
}

export async function saveToleranceConfig(config: ToleranceConfig): Promise<void> {
  if (typeof window === 'undefined') {
    memoryTolerances[config.drawing_number] = config;
    return;
  }
  try {
    const configs = (await get<Record<string, ToleranceConfig>>(TOLERANCES_STORE_KEY)) || {};
    configs[config.drawing_number] = config;
    await set(TOLERANCES_STORE_KEY, configs);
  } catch (err) {
    console.error('Failed to save tolerance config:', err);
  }
}

