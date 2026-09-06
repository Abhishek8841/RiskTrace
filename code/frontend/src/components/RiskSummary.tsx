import type { ScanResponse, VulnerabilityResponse } from '../types';
import { SeverityBadge } from './SeverityBadge';

interface RiskSummaryProps {
  scan: ScanResponse;
  vulnerabilities: VulnerabilityResponse[];
}

export function RiskSummary({ scan, vulnerabilities }: RiskSummaryProps) {
  
  const severityCounts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const vuln of vulnerabilities) {
    const sev = vuln.severity.toUpperCase();
    if (sev in severityCounts) {
      severityCounts[sev]++;
    }
  }

  const summaryItems = [
    {
      label: 'Risk Score',
      value: scan.riskScore !== null ? String(scan.riskScore) : '-',
    },
    {
      label: 'Risk Level',
      value: scan.riskLevel || '-',
      badge: scan.riskLevel ? true : false,
    },
    {
      label: 'Dependencies',
      value: String(scan.dependencyCount),
    },
    {
      label: 'Vulnerable',
      value: String(scan.vulnerableDependencyCount),
    },
  ];

  return (
    <div className="space-y-6">
      {}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Risk Summary
        </h2>
        <p className="text-xs text-gray-400 mb-4">Rule-Based Risk Score</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {item.badge && scan.riskLevel ? (
                  <SeverityBadge severity={scan.riskLevel} variant="risk" />
                ) : (
                  item.value
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {}
      {vulnerabilities.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            Severity Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(severityCounts).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between p-3 rounded-md border border-gray-100">
                <SeverityBadge severity={severity} />
                <span className="text-lg font-semibold text-gray-900 ml-3">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
