import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, validateGitHubUrl } from '../services/repository/repository-collector.js';

describe('GitHub URL Validation', () => {
  describe('parseGitHubUrl', () => {
    it('should parse a valid GitHub URL', () => {
      const result = parseGitHubUrl('https://github.com/expressjs/express');
      expect(result).toEqual({ owner: 'expressjs', name: 'express' });
    });

    it('should parse a URL with trailing slash', () => {
      const result = parseGitHubUrl('https://github.com/facebook/react/');
      expect(result).toEqual({ owner: 'facebook', name: 'react' });
    });

    it('should parse a URL with .git suffix', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', name: 'repo' });
    });

    it('should handle whitespace', () => {
      const result = parseGitHubUrl('  https://github.com/owner/repo  ');
      expect(result).toEqual({ owner: 'owner', name: 'repo' });
    });

    it('should handle owner/name with dots, dashes, underscores', () => {
      const result = parseGitHubUrl('https://github.com/my-org/my_repo.js');
      expect(result).toEqual({ owner: 'my-org', name: 'my_repo.js' });
    });

    it('should throw for non-GitHub URLs', () => {
      expect(() => parseGitHubUrl('https://gitlab.com/owner/repo')).toThrow('Invalid GitHub');
    });

    it('should throw for URLs with extra path segments', () => {
      expect(() => parseGitHubUrl('https://github.com/owner/repo/tree/main')).toThrow('Invalid GitHub');
    });

    it('should throw for empty string', () => {
      expect(() => parseGitHubUrl('')).toThrow('Invalid GitHub');
    });

    it('should throw for HTTP (non-HTTPS)', () => {
      expect(() => parseGitHubUrl('http://github.com/owner/repo')).toThrow('Invalid GitHub');
    });

    it('should throw for URLs without owner', () => {
      expect(() => parseGitHubUrl('https://github.com/repo')).toThrow('Invalid GitHub');
    });
  });

  describe('validateGitHubUrl', () => {
    it('should return true for valid URLs', () => {
      expect(validateGitHubUrl('https://github.com/owner/repo')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(validateGitHubUrl('not-a-url')).toBe(false);
      expect(validateGitHubUrl('https://gitlab.com/owner/repo')).toBe(false);
    });
  });
});
