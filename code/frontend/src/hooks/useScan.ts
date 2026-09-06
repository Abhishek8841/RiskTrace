import { useState, useCallback } from 'react';
import {
  createScan,
  getScanDependencies,
  getScanVulnerabilities,
} from '../api/client';
import type {
  ScanResponse,
  DependencyResponse,
  VulnerabilityResponse,
  ApiError,
} from '../types';

interface UseScanState {
  scan: ScanResponse | null;
  dependencies: DependencyResponse[];
  vulnerabilities: VulnerabilityResponse[];
  loading: boolean;
  error: string | null;
}

export function useScan() {
  const [state, setState] = useState<UseScanState>({
    scan: null,
    dependencies: [],
    vulnerabilities: [],
    loading: false,
    error: null,
  });

  const submitScan = useCallback(async (repositoryUrl: string) => {
    setState({
      scan: null,
      dependencies: [],
      vulnerabilities: [],
      loading: true,
      error: null,
    });

    try {
      const scanResult = await createScan(repositoryUrl);

      let deps: DependencyResponse[] = [];
      let vulns: VulnerabilityResponse[] = [];

      if (scanResult.status === 'COMPLETED') {
        try {
          const [depsResult, vulnsResult] = await Promise.all([
            getScanDependencies(scanResult.id),
            getScanVulnerabilities(scanResult.id),
          ]);
          deps = depsResult.dependencies;
          vulns = vulnsResult.vulnerabilities;
        } catch {
        }
      }

      setState({
        scan: scanResult,
        dependencies: deps,
        vulnerabilities: vulns,
        loading: false,
        error: scanResult.status === 'FAILED' ? (scanResult.errorMessage || 'Scan failed.') : null,
      });
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: apiError.message || 'An unexpected error occurred.',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      scan: null,
      dependencies: [],
      vulnerabilities: [],
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    submitScan,
    reset,
  };
}
