import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const REFERENCE_REPORTS = [
  {
    fileName: 'M0166472_Z43_K13_260703 0047 C_04.11.2026_04.18.09.pdf',
    partNumber: '260703 0047 C',
    drawingNumber: 'M0166472_Z43_K13',
    date: '04.11.2026 04:18:09',
    url: '/reference-reports/M0166472_Z43_K13_260703 0047 C_04.11.2026_04.18.09.pdf',
  },
  {
    fileName: 'M0166472_Z43_K13_260704  0048 B_04.11.2026_04.00.48.pdf',
    partNumber: '260704 0048 B',
    drawingNumber: 'M0166472_Z43_K13',
    date: '04.11.2026 04:00:48',
    url: '/reference-reports/M0166472_Z43_K13_260704  0048 B_04.11.2026_04.00.48.pdf',
  },
  {
    fileName: 'M0166472_Z43_K13_260704 0004 B_04.11.2026_01.57.35.pdf',
    partNumber: '260704 0004 B',
    drawingNumber: 'M0166472_Z43_K13',
    date: '04.11.2026 01:57:35',
    url: '/reference-reports/M0166472_Z43_K13_260704 0004 B_04.11.2026_01.57.35.pdf',
  },
  {
    fileName: 'M0166472_Z43_K13_260704 0036 B_03.11.2026_18.10.23.pdf',
    partNumber: '260704 0036 B',
    drawingNumber: 'M0166472_Z43_K13',
    date: '03.11.2026 18:10:23',
    url: '/reference-reports/M0166472_Z43_K13_260704 0036 B_03.11.2026_18.10.23.pdf',
  },
  {
    fileName: 'M0166472_Z43_K13_260707 0045 C_04.11.2026_01.10.57.pdf',
    partNumber: '260707 0045 C',
    drawingNumber: 'M0166472_Z43_K13',
    date: '04.11.2026 01:10:57',
    url: '/reference-reports/M0166472_Z43_K13_260707 0045 C_04.11.2026_01.10.57.pdf',
  },
  {
    fileName: 'M0166472_Z43_K13_260707 0057 C_04.11.2026_03.40.26.pdf',
    partNumber: '260707 0057 C',
    drawingNumber: 'M0166472_Z43_K13',
    date: '04.11.2026 03:40:26',
    url: '/reference-reports/M0166472_Z43_K13_260707 0057 C_04.11.2026_03.40.26.pdf',
  },
  {
    fileName: 'M0166472_Z43_K13_260707 0058 C_04.11.2026_04.05.09.pdf',
    partNumber: '260707 0058 C',
    drawingNumber: 'M0166472_Z43_K13',
    date: '04.11.2026 04:05:09',
    url: '/reference-reports/M0166472_Z43_K13_260707 0058 C_04.11.2026_04.05.09.pdf',
  },
  {
    fileName: 'M0166472_Z43_K13_260707 0060 C_04.11.2026_05.26.52.pdf',
    partNumber: '260707 0060 C',
    drawingNumber: 'M0166472_Z43_K13',
    date: '04.11.2026 05:26:52',
    url: '/reference-reports/M0166472_Z43_K13_260707 0060 C_04.11.2026_05.26.52.pdf',
  },
];

export async function GET() {
  return NextResponse.json({
    reports: REFERENCE_REPORTS,
    count: REFERENCE_REPORTS.length,
    description: 'Eight verified ZEISS GEAR PRO 2023 SP1 Involute Lead Inspection reference reports.',
  });
}

