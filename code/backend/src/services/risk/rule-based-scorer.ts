import { RiskScorer } from './risk-scorer.js';
import { NormalizedVulnerability, RiskResult, RiskLevel, Severity } from '../../types/index.js';

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  CRITICAL: 10,
  HIGH: 7,
  MEDIUM: 4,
  LOW: 1,
  UNKNOWN: 2,
};

const RISK_THRESHOLDS: { max: number; level: RiskLevel }[] = [
  { max: 10, level: 'LOW' },
  { max: 25, level: 'MEDIUM' },
  { max: 50, level: 'HIGH' },
  { max: Infinity, level: 'CRITICAL' },
];

export class RuleBasedRiskScorer implements RiskScorer {
  calculateScore(vulnerabilities: NormalizedVulnerability[]): RiskResult {
    if (vulnerabilities.length === 0) {
      return { score: 0, level: 'LOW' };
    }

    const score = vulnerabilities.reduce((total, vuln) => {
      return total + (SEVERITY_WEIGHTS[vuln.severity] || SEVERITY_WEIGHTS.UNKNOWN);
    }, 0);

    const level = this.scoreToLevel(score);

    return { score, level };
  }

  private scoreToLevel(score: number): RiskLevel {
    for (const threshold of RISK_THRESHOLDS) {
      if (score <= threshold.max) {
        return threshold.level;
      }
    }
    return 'CRITICAL';
  }
}
