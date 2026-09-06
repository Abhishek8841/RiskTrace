export type Ecosystem = 'npm' | 'pypi' | 'go';

export interface RepositoryInfo {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
  latestCommitSha: string | null;
}

export interface ManifestFile {
  path: string;
  ecosystem: Ecosystem;
  filename: string;
}

export interface NormalizedDependency {
  name: string;
  version: string;
  ecosystem: Ecosystem;
  direct: boolean;
}

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface NormalizedVulnerability {
  id: string;
  package: string;
  severity: Severity;
  cvss: number | null;
  summary: string;
  fixedVersions: string[];
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskResult {
  score: number;
  level: RiskLevel;
}

export interface ScanPipelineResult {
  repository: RepositoryInfo;
  manifests: ManifestFile[];
  ecosystems: Ecosystem[];
  fileCount: number;
  dependencies: NormalizedDependency[];
  vulnerabilityMap: Map<string, NormalizedVulnerability[]>;
  risk: RiskResult;
}

export interface ScanResponse {
  id: string;
  status: string;
  repository: {
    id: string;
    owner: string;
    name: string;
    url: string;
    defaultBranch: string;
    latestCommitSha: string | null;
  };
  riskScore: number | null;
  riskLevel: string | null;
  dependencyCount: number;
  vulnerableDependencyCount: number;
  ecosystems: string[];
  manifestFiles: string[];
  fileCount: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}
