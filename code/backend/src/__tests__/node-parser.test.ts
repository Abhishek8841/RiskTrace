import { describe, it, expect } from 'vitest';
import { NodeManifestParser } from '../services/manifests/node-parser.js';

describe('NodeManifestParser', () => {
  const parser = new NodeManifestParser();

  describe('canParse', () => {
    it('should accept package.json', () => {
      expect(parser.canParse('package.json')).toBe(true);
    });

    it('should accept package-lock.json', () => {
      expect(parser.canParse('package-lock.json')).toBe(true);
    });

    it('should reject other files', () => {
      expect(parser.canParse('requirements.txt')).toBe(false);
      expect(parser.canParse('go.mod')).toBe(false);
    });
  });

  describe('parse package.json', () => {
    it('should extract dependencies', () => {
      const content = JSON.stringify({
        dependencies: {
          express: '^4.18.2',
          lodash: '4.17.21',
        },
      });

      const deps = parser.parse(content, 'package.json');
      expect(deps).toHaveLength(2);
      expect(deps[0]).toEqual({
        name: 'express',
        version: '4.18.2',
        ecosystem: 'npm',
        direct: true,
      });
      expect(deps[1]).toEqual({
        name: 'lodash',
        version: '4.17.21',
        ecosystem: 'npm',
        direct: true,
      });
    });

    it('should extract devDependencies', () => {
      const content = JSON.stringify({
        dependencies: { express: '^4.18.0' },
        devDependencies: { jest: '^29.0.0' },
      });

      const deps = parser.parse(content, 'package.json');
      expect(deps).toHaveLength(2);
      expect(deps.find((d) => d.name === 'jest')).toBeDefined();
    });

    it('should handle tilde version prefix', () => {
      const content = JSON.stringify({
        dependencies: { lodash: '~4.17.0' },
      });

      const deps = parser.parse(content, 'package.json');
      expect(deps[0].version).toBe('4.17.0');
    });

    it('should handle empty dependencies', () => {
      const content = JSON.stringify({});
      const deps = parser.parse(content, 'package.json');
      expect(deps).toHaveLength(0);
    });

    it('should handle invalid JSON gracefully', () => {
      const deps = parser.parse('not valid json', 'package.json');
      expect(deps).toHaveLength(0);
    });
  });
});
