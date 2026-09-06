import type {
  ScanResponse,
  DependencyResponse,
  VulnerabilityResponse,
} from '../types';
import { RepositoryInfo } from './RepositoryInfo';
import { RiskSummary } from './RiskSummary';
import { DependencyTable } from './DependencyTable';

interface ScanResultProps {
  scan: ScanResponse;
  dependencies: DependencyResponse[];
  vulnerabilities: VulnerabilityResponse[];
}

export function ScanResult({ scan, dependencies, vulnerabilities }: ScanResultProps) {
  if (scan.status === 'FAILED') {
    return (
      <div className="w-full max-w-4xl border border-red-200 rounded-lg p-6 bg-red-50">
        <h2 className="text-sm font-semibold text-red-800 mb-2">Scan Failed</h2>
        <p className="text-sm text-red-700">
          {scan.errorMessage || 'An unexpected error occurred during the scan.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <RepositoryInfo scan={scan} />
      <RiskSummary scan={scan} vulnerabilities={vulnerabilities} />
      <DependencyTable dependencies={dependencies} vulnerabilities={vulnerabilities} />
    </div>
  );
}
