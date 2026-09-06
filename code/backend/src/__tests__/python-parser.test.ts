import { describe, it, expect } from 'vitest';
import { PythonManifestParser } from '../services/manifests/python-parser.js';

describe('PythonManifestParser', () => {
  const parser = new PythonManifestParser();

  describe('canParse', () => {
    it('should accept requirements.txt', () => {
      expect(parser.canParse('requirements.txt')).toBe(true);
    });

    it('should accept pyproject.toml', () => {
      expect(parser.canParse('pyproject.toml')).toBe(true);
    });

    it('should reject other files', () => {
      expect(parser.canParse('package.json')).toBe(false);
    });
  });

  describe('parse requirements.txt', () => {
    it('should extract dependencies with exact versions', () => {
      const content = 'flask==2.3.0\nrequests==2.31.0\n';
      const deps = parser.parse(content, 'requirements.txt');

      expect(deps).toHaveLength(2);
      expect(deps[0]).toEqual({
        name: 'flask',
        version: '2.3.0',
        ecosystem: 'pypi',
        direct: true,
      });
    });

    it('should handle version ranges', () => {
      const content = 'requests>=2.28.0\nflask~=2.0\n';
      const deps = parser.parse(content, 'requirements.txt');

      expect(deps).toHaveLength(2);
      expect(deps[0].name).toBe('requests');
      expect(deps[0].version).toBe('2.28.0');
    });

    it('should handle packages without versions', () => {
      const content = 'requests\nflask\n';
      const deps = parser.parse(content, 'requirements.txt');

      expect(deps).toHaveLength(2);
      expect(deps[0].version).toBe('');
    });

    it('should skip comments and empty lines', () => {
      const content = '# This is a comment\n\nflask==2.3.0\n# Another comment\n';
      const deps = parser.parse(content, 'requirements.txt');

      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('flask');
    });

    it('should skip option lines', () => {
      const content = '-r other-requirements.txt\n--index-url https://pypi.org/simple\nflask==2.3.0\n';
      const deps = parser.parse(content, 'requirements.txt');

      expect(deps).toHaveLength(1);
    });

    it('should handle extras', () => {
      const content = 'requests[security]>=2.28.0\n';
      const deps = parser.parse(content, 'requirements.txt');

      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('requests');
    });

    it('should lowercase package names', () => {
      const content = 'Flask==2.3.0\nRequests>=2.28.0\n';
      const deps = parser.parse(content, 'requirements.txt');

      expect(deps[0].name).toBe('flask');
      expect(deps[1].name).toBe('requests');
    });
  });

  describe('parse pyproject.toml', () => {
    it('should extract PEP 621 dependencies', () => {
      const content = `
[project]
name = "my-project"
dependencies = [
  "flask>=2.3.0",
  "requests==2.31.0",
]
`;
      const deps = parser.parse(content, 'pyproject.toml');

      expect(deps).toHaveLength(2);
      expect(deps[0].name).toBe('flask');
      expect(deps[1].name).toBe('requests');
    });

    it('should extract Poetry dependencies', () => {
      const content = `
[tool.poetry.dependencies]
python = "^3.9"
flask = "^2.3.0"
requests = {version = "^2.31.0", optional = true}
`;
      const deps = parser.parse(content, 'pyproject.toml');

      expect(deps).toHaveLength(2); 
      expect(deps.find((d) => d.name === 'python')).toBeUndefined();
      expect(deps.find((d) => d.name === 'flask')).toBeDefined();
    });

    it('should handle invalid TOML gracefully', () => {
      const deps = parser.parse('not valid toml [[[', 'pyproject.toml');
      expect(deps).toHaveLength(0);
    });
  });
});
