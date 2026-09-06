import { useState, useEffect } from 'react';
import { listScans } from '../api/client';
import type { ScanResponse } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface ScanHistoryProps {
  onSelectScan: (scanId: string) => void;
  refreshTrigger: number;
}

export function ScanHistory({ onSelectScan, refreshTrigger }: ScanHistoryProps) {
  const [scans, setScans] = useState<ScanResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      try {
        setLoading(true);
        const result = await listScans();
        setScans(result.scans);
      } catch {
        
      } finally {
        setLoading(false);
      }
    }
    fetchScans();
  }, [refreshTrigger]);

  if (loading) {
    return null;
  }

  if (scans.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Scan History
      </h2>

      <div className="space-y-2">
        {scans.map((scan) => (
          <button
            key={scan.id}
            onClick={() => onSelectScan(scan.id)}
            className="w-full flex items-center justify-between p-3 text-left rounded-md border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {scan.repository.owner}/{scan.repository.name}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  scan.status === 'COMPLETED'
                    ? 'bg-green-50 text-green-700'
                    : scan.status === 'FAILED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-50 text-gray-600'
                }`}
              >
                {scan.status}
              </span>
            </div>

            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              {scan.riskLevel && <SeverityBadge severity={scan.riskLevel} variant="risk" />}
              <span className="text-xs text-gray-400">
                {new Date(scan.startedAt).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
