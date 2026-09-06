import { NormalizedVulnerability, RiskResult, RiskLevel } from '../../types/index.js';

export interface RiskScorer {
  calculateScore(vulnerabilities: NormalizedVulnerability[]): RiskResult;
}
