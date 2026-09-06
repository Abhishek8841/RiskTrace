import { useState } from 'react';
import type { DependencyResponse, VulnerabilityResponse } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { VulnerabilityDetails } from './VulnerabilityDetails';

interface DependencyTableProps {
  dependencies: DependencyResponse[];
  vulnerabilities: VulnerabilityResponse[];
}

export function DependencyTable({ dependencies, vulnerabilities }: DependencyTableProps) {
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

  if (dependencies.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Dependencies
        </h2>
        <p className="text-sm text-gray-500">No dependencies detected.</p>
      </div>
    );
  }

  
  const sorted = [...dependencies].sort((a, b) => {
    if (a.vulnerabilityCount !== b.vulnerabilityCount) {
      return b.vulnerabilityCount - a.vulnerabilityCount;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Dependencies ({dependencies.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ecosystem
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direct
              </th>
              <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vulnerabilities
              </th>
              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((dep) => (
              <tr key={dep.id} className="group">
                <td className="py-2 pr-4" colSpan={6}>
                  <div
                    className={`flex items-center w-full -mx-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                      dep.vulnerabilityCount > 0
                        ? 'hover:bg-gray-50'
                        : ''
                    }`}
                    onClick={() => {
                      if (dep.vulnerabilityCount > 0) {
                        setExpandedPackage(
                          expandedPackage === dep.name ? null : dep.name,
                        );
                      }
                    }}
                  >
                    <div className="flex-1 grid grid-cols-6 items-center">
                      <span className="font-mono text-gray-900 pr-4">
                        {dep.name}
                      </span>
                      <span className="font-mono text-gray-600 pr-4">
                        {dep.version || '-'}
                      </span>
                      <span className="text-gray-600 pr-4">{dep.ecosystem}</span>
                      <span className="text-gray-600 pr-4">
                        {dep.direct ? 'Yes' : 'No'}
                      </span>
                      <span className={`pr-4 ${dep.vulnerabilityCount > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {dep.vulnerabilityCount}
                      </span>
                      <span>
                        {dep.highestSeverity ? (
                          <SeverityBadge severity={dep.highestSeverity} />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {expandedPackage === dep.name && (
                    <VulnerabilityDetails
                      vulnerabilities={vulnerabilities}
                      packageName={dep.name}
                      onClose={() => setExpandedPackage(null)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
