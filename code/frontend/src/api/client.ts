import type {
  ScanResponse,
  DependencyResponse,
  VulnerabilityResponse,
  ApiError,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let error: ApiError;
    try {
      error = await response.json();
    } catch {
      error = {
        error: `HTTP ${response.status}`,
        message: response.statusText || 'An unexpected error occurred.',
      };
    }
    throw error;
  }

  return response.json();
}

export async function createScan(repositoryUrl: string): Promise<ScanResponse> {
  return apiFetch<ScanResponse>('/api/scans', {
    method: 'POST',
    body: JSON.stringify({ repositoryUrl }),
  });
}

export async function getScan(scanId: string): Promise<ScanResponse> {
  return apiFetch<ScanResponse>(`/api/scans/${scanId}`);
}

export async function listScans(): Promise<{ scans: ScanResponse[] }> {
  return apiFetch<{ scans: ScanResponse[] }>('/api/scans');
}

export async function getScanDependencies(
  scanId: string,
): Promise<{ dependencies: DependencyResponse[] }> {
  return apiFetch<{ dependencies: DependencyResponse[] }>(`/api/scans/${scanId}/dependencies`);
}

export async function getScanVulnerabilities(
  scanId: string,
): Promise<{ vulnerabilities: VulnerabilityResponse[] }> {
  return apiFetch<{ vulnerabilities: VulnerabilityResponse[] }>(
    `/api/scans/${scanId}/vulnerabilities`,
  );
}
