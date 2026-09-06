import { useState, useCallback } from 'react';
import { ScanForm } from './components/ScanForm';
import { ScanResult } from './components/ScanResult';
import { ScanHistory } from './components/ScanHistory';
import { useScan } from './hooks/useScan';
import { getScan, getScanDependencies, getScanVulnerabilities } from './api/client';
import type { ScanResponse, DependencyResponse, VulnerabilityResponse } from './types';

function App() {
  const { scan, dependencies, vulnerabilities, loading, error, submitScan, reset } = useScan();
  const [historyRefresh, setHistoryRefresh] = useState(0);

  
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyScan, setHistoryScan] = useState<ScanResponse | null>(null);
  const [historyDeps, setHistoryDeps] = useState<DependencyResponse[]>([]);
  const [historyVulns, setHistoryVulns] = useState<VulnerabilityResponse[]>([]);

  const handleSubmit = useCallback(
    async (url: string) => {
      setHistoryScan(null);
      await submitScan(url);
      setHistoryRefresh((c) => c + 1);
    },
    [submitScan],
  );

  const handleSelectScan = useCallback(async (scanId: string) => {
    setHistoryLoading(true);
    try {
      const [scanData, depsData, vulnsData] = await Promise.all([
        getScan(scanId),
        getScanDependencies(scanId),
        getScanVulnerabilities(scanId),
      ]);
      setHistoryScan(scanData);
      setHistoryDeps(depsData.dependencies);
      setHistoryVulns(vulnsData.vulnerabilities);
    } catch {
      
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  
  const displayScan = scan || historyScan;
  const displayDeps = scan ? dependencies : historyDeps;
  const displayVulns = scan ? vulnerabilities : historyVulns;
  const isLoading = loading || historyLoading;

  return (
    <div className="min-h-screen bg-white">
      {}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Repository Risk Analyzer</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Analyze dependencies and vulnerabilities in public GitHub repositories
          </p>
        </div>
      </header>

      {}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center space-y-8">
          {}
          <ScanForm onSubmit={handleSubmit} loading={loading} />

          {}
          {error && !displayScan && (
            <div className="w-full max-w-4xl border border-red-200 rounded-lg p-4 bg-red-50">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {}
          {isLoading && (
            <div className="w-full max-w-4xl flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-500">
                  {loading
                    ? 'Scanning repository... This may take a moment.'
                    : 'Loading scan details...'}
                </p>
              </div>
            </div>
          )}

          {}
          {!isLoading && displayScan && (
            <>
              {scan && (
                <div className="w-full max-w-4xl flex justify-end">
                  <button
                    onClick={reset}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear Results
                  </button>
                </div>
              )}
              <ScanResult
                scan={displayScan}
                dependencies={displayDeps}
                vulnerabilities={displayVulns}
              />
            </>
          )}

          {}
          <ScanHistory onSelectScan={handleSelectScan} refreshTrigger={historyRefresh} />
        </div>
      </main>

      {}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="text-xs text-gray-400">
            RiskTrace POC -- Rule-based risk scoring. Vulnerability data from OSV.dev.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
