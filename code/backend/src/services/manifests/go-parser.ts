import { ManifestParser } from './manifest-parser.js';
import { NormalizedDependency, Ecosystem } from '../../types/index.js';

export class GoManifestParser implements ManifestParser {
  ecosystem: Ecosystem = 'go';
  supportedFiles = ['go.mod'];

  canParse(filename: string): boolean {
    return this.supportedFiles.includes(filename);
  }

  parse(content: string, filename: string): NormalizedDependency[] {
    try {
      return this.parseGoMod(content);
    } catch {
      return [];
    }
  }

  private parseGoMod(content: string): NormalizedDependency[] {
    const deps: NormalizedDependency[] = [];
    const lines = content.split('\n');
    let inRequireBlock = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith('//')) continue;

      if (line.startsWith('require') && line.includes('(')) {
        inRequireBlock = true;
        continue;
      }

      if (line === ')') {
        inRequireBlock = false;
        continue;
      }

      if (line.startsWith('require ') && !line.includes('(')) {
        const dep = this.parseRequireLine(line.substring('require '.length));
        if (dep) deps.push(dep);
        continue;
      }

      if (inRequireBlock) {
        const dep = this.parseRequireLine(line);
        if (dep) deps.push(dep);
      }
    }

    return deps;
  }

  private parseRequireLine(line: string): NormalizedDependency | null {
    const withoutComment = line.split('//')[0].trim();
    if (!withoutComment) return null;

    const parts = withoutComment.split(/\s+/);
    if (parts.length < 2) return null;

    const modulePath = parts[0];
    const version = parts[1];

    const isIndirect = line.includes('// indirect');

    return {
      name: modulePath,
      version: version.replace(/^v/, ''), 
      ecosystem: 'go',
      direct: !isIndirect,
    };
  }
}
