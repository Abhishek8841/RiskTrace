import { PrismaClient, ScanStatus, RiskLevel as PrismaRiskLevel } from '@prisma/client';
import { RepositoryCollector, parseGitHubUrl } from '../repository/repository-collector.js';
import { RepositoryExplorer } from '../repository/repository-explorer.js';
import { DependencyExtractor } from '../dependencies/dependency-extractor.js';
import { VulnerabilityMatcher } from '../vulnerabilities/vulnerability-matcher.js';
import { RiskScorer } from '../risk/risk-scorer.js';
import { NormalizedVulnerability, ScanResponse } from '../../types/index.js';

export class ScanService {
  constructor(
    private prisma: PrismaClient,
    private repositoryCollector: RepositoryCollector,
    private repositoryExplorer: RepositoryExplorer,
    private dependencyExtractor: DependencyExtractor,
    private vulnerabilityMatcher: VulnerabilityMatcher,
    private riskScorer: RiskScorer,
  ) {}

  async scan(repositoryUrl: string): Promise<ScanResponse> {
    const { owner, name } = parseGitHubUrl(repositoryUrl);

    const normalizedUrl = repositoryUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
    let repository = await this.prisma.repository.findUnique({
      where: { url: normalizedUrl },
    });

    const { info, localPath } = await this.repositoryCollector.collect(repositoryUrl);

    if (!repository) {
      repository = await this.prisma.repository.create({
        data: {
          owner: info.owner,
          name: info.name,
          url: info.url,
          defaultBranch: info.defaultBranch,
          latestCommitSha: info.latestCommitSha,
        },
      });
    } else {
      repository = await this.prisma.repository.update({
        where: { id: repository.id },
        data: {
          defaultBranch: info.defaultBranch,
          latestCommitSha: info.latestCommitSha,
        },
      });
    }

    const scan = await this.prisma.scan.create({
      data: {
        repositoryId: repository.id,
        status: 'SCANNING',
        startedAt: new Date(),
      },
    });

    try {
      const exploration = await this.repositoryExplorer.explore(localPath);

      const dependencies = await this.dependencyExtractor.extract(localPath, exploration.manifests);

      const vulnerabilityMap = await this.vulnerabilityMatcher.matchVulnerabilities(dependencies);

      const allVulnerabilities: NormalizedVulnerability[] = [];
      vulnerabilityMap.forEach((vulns) => allVulnerabilities.push(...vulns));

      const risk = this.riskScorer.calculateScore(allVulnerabilities);

      let vulnerableDependencyCount = 0;

      for (const dep of dependencies) {
        const depRecord = await this.prisma.dependency.create({
          data: {
            scanId: scan.id,
            name: dep.name,
            version: dep.version,
            ecosystem: dep.ecosystem,
            direct: dep.direct,
          },
        });

        const key = `${dep.ecosystem}:${dep.name}`;
        const vulns = vulnerabilityMap.get(key) || [];

        if (vulns.length > 0) {
          vulnerableDependencyCount++;

          for (const vuln of vulns) {
            await this.prisma.vulnerability.create({
              data: {
                dependencyId: depRecord.id,
                vulnerabilityId: vuln.id,
                severity: vuln.severity,
                cvss: vuln.cvss,
                summary: vuln.summary,
                fixedVersions: vuln.fixedVersions,
              },
            });
          }
        }
      }

      const completedScan = await this.prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          riskScore: risk.score,
          riskLevel: risk.level as PrismaRiskLevel,
          ecosystems: exploration.ecosystems,
          manifestFiles: exploration.manifests.map((m) => m.path),
          fileCount: exploration.fileCount,
        },
        include: { repository: true },
      });

      await RepositoryCollector.cleanup(localPath);

      return this.formatScanResponse(completedScan, dependencies.length, vulnerableDependencyCount);
    } catch (error: unknown) {
      await RepositoryCollector.cleanup(localPath);

      await this.prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown scan error',
        },
      });

      throw error;
    }
  }

  async getScan(scanId: string): Promise<ScanResponse | null> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        repository: true,
        dependencies: {
          include: { vulnerabilities: true },
        },
      },
    });

    if (!scan) return null;

    const depCount = scan.dependencies.length;
    const vulnDepCount = scan.dependencies.filter((d) => d.vulnerabilities.length > 0).length;

    return this.formatScanResponse(
      { ...scan, repository: scan.repository },
      depCount,
      vulnDepCount,
    );
  }

  async listScans(): Promise<ScanResponse[]> {
    const scans = await this.prisma.scan.findMany({
      include: {
        repository: true,
        dependencies: {
          include: { vulnerabilities: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return scans.map((scan) => {
      const depCount = scan.dependencies.length;
      const vulnDepCount = scan.dependencies.filter((d) => d.vulnerabilities.length > 0).length;
      return this.formatScanResponse(
        { ...scan, repository: scan.repository },
        depCount,
        vulnDepCount,
      );
    });
  }

  async getScanDependencies(scanId: string) {
    const deps = await this.prisma.dependency.findMany({
      where: { scanId },
      include: { vulnerabilities: true },
      orderBy: { name: 'asc' },
    });

    return deps.map((dep) => ({
      id: dep.id,
      name: dep.name,
      version: dep.version,
      ecosystem: dep.ecosystem,
      direct: dep.direct,
      vulnerabilityCount: dep.vulnerabilities.length,
      highestSeverity: this.getHighestSeverity(dep.vulnerabilities),
    }));
  }

  async getScanVulnerabilities(scanId: string) {
    const deps = await this.prisma.dependency.findMany({
      where: { scanId },
      include: { vulnerabilities: true },
    });

    const vulns = [];
    for (const dep of deps) {
      for (const vuln of dep.vulnerabilities) {
        vulns.push({
          id: vuln.id,
          vulnerabilityId: vuln.vulnerabilityId,
          severity: vuln.severity,
          cvss: vuln.cvss,
          summary: vuln.summary,
          package: dep.name,
          packageVersion: dep.version,
          ecosystem: dep.ecosystem,
          fixedVersions: vuln.fixedVersions,
        });
      }
    }

    const severityOrder: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
      UNKNOWN: 4,
    };
    vulns.sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5));

    return vulns;
  }

  async listRepositories() {
    return this.prisma.repository.findMany({
      include: {
        scans: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private formatScanResponse(
    scan: {
      id: string;
      status: string;
      riskScore: number | null;
      riskLevel: string | null;
      ecosystems: string[];
      manifestFiles: string[];
      fileCount: number;
      startedAt: Date;
      completedAt: Date | null;
      errorMessage: string | null;
      repository: {
        id: string;
        owner: string;
        name: string;
        url: string;
        defaultBranch: string;
        latestCommitSha: string | null;
      };
    },
    dependencyCount: number,
    vulnerableDependencyCount: number,
  ): ScanResponse {
    return {
      id: scan.id,
      status: scan.status,
      repository: {
        id: scan.repository.id,
        owner: scan.repository.owner,
        name: scan.repository.name,
        url: scan.repository.url,
        defaultBranch: scan.repository.defaultBranch,
        latestCommitSha: scan.repository.latestCommitSha,
      },
      riskScore: scan.riskScore,
      riskLevel: scan.riskLevel,
      dependencyCount,
      vulnerableDependencyCount,
      ecosystems: scan.ecosystems,
      manifestFiles: scan.manifestFiles,
      fileCount: scan.fileCount,
      startedAt: scan.startedAt.toISOString(),
      completedAt: scan.completedAt?.toISOString() || null,
      errorMessage: scan.errorMessage,
    };
  }

  private getHighestSeverity(
    vulnerabilities: Array<{ severity: string }>,
  ): string | null {
    if (vulnerabilities.length === 0) return null;

    const order: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
      UNKNOWN: 4,
    };

    let highest = vulnerabilities[0].severity;
    for (const v of vulnerabilities) {
      if ((order[v.severity] ?? 5) < (order[highest] ?? 5)) {
        highest = v.severity;
      }
    }

    return highest;
  }
}
