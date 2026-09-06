import { describe, it, expect } from 'vitest';
import { GoManifestParser } from '../services/manifests/go-parser.js';

describe('GoManifestParser', () => {
  const parser = new GoManifestParser();

  describe('canParse', () => {
    it('should accept go.mod', () => {
      expect(parser.canParse('go.mod')).toBe(true);
    });

    it('should reject other files', () => {
      expect(parser.canParse('go.sum')).toBe(false);
      expect(parser.canParse('package.json')).toBe(false);
    });
  });

  describe('parse go.mod', () => {
    it('should extract require block dependencies', () => {
      const content = `
module github.com/example/project

go 1.21

require (
\tgithub.com/gin-gonic/gin v1.9.1
\tgithub.com/lib/pq v1.10.9
)
`;
      const deps = parser.parse(content, 'go.mod');

      expect(deps).toHaveLength(2);
      expect(deps[0]).toEqual({
        name: 'github.com/gin-gonic/gin',
        version: '1.9.1',
        ecosystem: 'go',
        direct: true,
      });
    });

    it('should handle single-line require', () => {
      const content = `
module github.com/example/project

go 1.21

require github.com/pkg/errors v0.9.1
`;
      const deps = parser.parse(content, 'go.mod');

      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('github.com/pkg/errors');
      expect(deps[0].version).toBe('0.9.1');
    });

    it('should mark indirect dependencies', () => {
      const content = `
module github.com/example/project

go 1.21

require (
\tgithub.com/gin-gonic/gin v1.9.1
\tgithub.com/something v1.0.0 // indirect
)
`;
      const deps = parser.parse(content, 'go.mod');

      expect(deps).toHaveLength(2);
      expect(deps[0].direct).toBe(true);
      expect(deps[1].direct).toBe(false);
    });

    it('should strip v prefix from versions', () => {
      const content = `
module github.com/example/project

go 1.21

require github.com/pkg/errors v0.9.1
`;
      const deps = parser.parse(content, 'go.mod');
      expect(deps[0].version).toBe('0.9.1');
    });

    it('should skip comments and empty lines', () => {
      const content = `
module github.com/example/project

go 1.21

// This is a comment
require (
\t// Another comment
\tgithub.com/gin-gonic/gin v1.9.1
)
`;
      const deps = parser.parse(content, 'go.mod');
      expect(deps).toHaveLength(1);
    });

    it('should handle empty file gracefully', () => {
      const deps = parser.parse('', 'go.mod');
      expect(deps).toHaveLength(0);
    });
  });
});
