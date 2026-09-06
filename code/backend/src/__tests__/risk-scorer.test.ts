import { describe, it, expect } from 'vitest';
import { RuleBasedRiskScorer } from '../services/risk/rule-based-scorer.js';
import { NormalizedVulnerability } from '../types/index.js';

describe('RuleBasedRiskScorer', () => {
  const scorer = new RuleBasedRiskScorer();

  function makeVuln(severity: string): NormalizedVulnerability {
    return {
      id: `VULN-${Math.random().toString(36).substring(7)}`,
      package: 'test-package',
      severity: severity as NormalizedVulnerability['severity'],
      cvss: null,
      summary: 'Test vulnerability',
      fixedVersions: [],
    };
  }

  it('should return score 0 and LOW for no vulnerabilities', () => {
    const result = scorer.calculateScore([]);
    expect(result).toEqual({ score: 0, level: 'LOW' });
  });

  it('should score CRITICAL as 10', () => {
    const result = scorer.calculateScore([makeVuln('CRITICAL')]);
    expect(result.score).toBe(10);
    expect(result.level).toBe('LOW'); 
  });

  it('should score HIGH as 7', () => {
    const result = scorer.calculateScore([makeVuln('HIGH')]);
    expect(result.score).toBe(7);
  });

  it('should score MEDIUM as 4', () => {
    const result = scorer.calculateScore([makeVuln('MEDIUM')]);
    expect(result.score).toBe(4);
  });

  it('should score LOW as 1', () => {
    const result = scorer.calculateScore([makeVuln('LOW')]);
    expect(result.score).toBe(1);
  });

  it('should sum scores from multiple vulnerabilities', () => {
    const vulns = [makeVuln('CRITICAL'), makeVuln('HIGH'), makeVuln('MEDIUM')];
    const result = scorer.calculateScore(vulns);
    expect(result.score).toBe(10 + 7 + 4); 
    expect(result.level).toBe('MEDIUM'); 
  });

  it('should return MEDIUM for score 11-25', () => {
    const vulns = [makeVuln('HIGH'), makeVuln('HIGH')];
    const result = scorer.calculateScore(vulns);
    expect(result.level).toBe('MEDIUM');
  });

  it('should return HIGH for score 26-50', () => {
    const vulns = Array(4).fill(null).map(() => makeVuln('CRITICAL'));
    const result = scorer.calculateScore(vulns);
    expect(result.score).toBe(40);
    expect(result.level).toBe('HIGH');
  });

  it('should return CRITICAL for score 51+', () => {
    const vulns = Array(8).fill(null).map(() => makeVuln('HIGH'));
    const result = scorer.calculateScore(vulns);
    expect(result.score).toBe(56);
    expect(result.level).toBe('CRITICAL');
  });

  it('should handle UNKNOWN severity', () => {
    const result = scorer.calculateScore([makeVuln('UNKNOWN')]);
    expect(result.score).toBe(2);
  });
});
