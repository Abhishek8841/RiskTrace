export interface ScanResponse {
  id: string;
  status: 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED';
  repository: {
    id: string;
    owner: string;
    name: string;
    url: string;
    defaultBranch: string;
    latestCommitSha: string | null;
  };
  riskScore: number | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  dependencyCount: number;
  vulnerableDependencyCount: number;
  ecosystems: string[];
  manifestFiles: string[];
  fileCount: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface DependencyResponse {
  id: string;
  name: string;
  version: string;
  ecosystem: string;
  direct: boolean;
  vulnerabilityCount: number;
  highestSeverity: string | null;
}

export interface VulnerabilityResponse {
  id: string;
  vulnerabilityId: string;
  severity: string;
  cvss: number | null;
  summary: string;
  package: string;
  packageVersion: string;
  ecosystem: string;
  fixedVersions: string[];
}

export interface ApiError {
  error: string;
  message: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
