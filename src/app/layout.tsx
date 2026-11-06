import type { Metadata } from 'next';
import './globals.css';
import { InspectionProvider } from '@/context/InspectionContext';

export const metadata: Metadata = {
  title: 'MechReport AI | ZEISS GEAR PRO 2023 SP1 Involute Report Analyzer',
  description:
    'Production-ready web application for reading, extracting, analyzing, validating, and comparing mechanical gear inspection reports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#111315] text-[#E1E7EC] antialiased">
        <InspectionProvider>{children}</InspectionProvider>
      </body>
    </html>
  );
}

