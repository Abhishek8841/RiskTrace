import { ManifestParser } from './manifest-parser.js';
import { NormalizedDependency, Ecosystem } from '../../types/index.js';

function cleanVersion(version: string): string {
  if (!version) return '';
  return version.replace(/^[~^>=<!*\s|]+/, '').split(/[\s,|]/)[0].trim();
}

export class NodeManifestParser implements ManifestParser {
  ecosystem: Ecosystem = 'npm';
  supportedFiles = ['package.json', 'package-lock.json'];

  canParse(filename: string): boolean {
    return this.supportedFiles.includes(filename);
  }

  parse(content: string, filename: string): NormalizedDependency[] {
    try {
      const data = JSON.parse(content);

      if (filename === 'package-lock.json') {
        return this.parseLockfile(data);
      }

      return this.parsePackageJson(data);
    } catch {
      return [];
    }
  }

  private parsePackageJson(data: Record<string, unknown>): NormalizedDependency[] {
    const deps: NormalizedDependency[] = [];

    const dependencies = (data.dependencies || {}) as Record<string, string>;
    for (const [name, version] of Object.entries(dependencies)) {
      if (typeof version === 'string') {
        deps.push({
          name,
          version: cleanVersion(version),
          ecosystem: 'npm',
          direct: true,
        });
      }
    }

    const devDependencies = (data.devDependencies || {}) as Record<string, string>;
    for (const [name, version] of Object.entries(devDependencies)) {
      if (typeof version === 'string') {
        deps.push({
          name,
          version: cleanVersion(version),
          ecosystem: 'npm',
          direct: true,
        });
      }
    }

    return deps;
  }

  private parseLockfile(data: Record<string, unknown>): NormalizedDependency[] {
    const deps: NormalizedDependency[] = [];
    const seen = new Set<string>();

    const packages = (data.packages || {}) as Record<string, Record<string, unknown>>;
    for (const [pkgPath, pkgData] of Object.entries(packages)) {
      if (!pkgPath || pkgPath === '') continue; 

      const name = this.extractPackageName(pkgPath);
      if (!name || seen.has(name)) continue;
      seen.add(name);

      const version = (pkgData.version as string) || '';
      const isDev = Boolean(pkgData.dev);

      deps.push({
        name,
        version,
        ecosystem: 'npm',
        direct: !pkgPath.includes('node_modules/node_modules/'), 
      });
    }

    if (deps.length === 0) {
      const dependencies = (data.dependencies || {}) as Record<string, Record<string, unknown>>;
      for (const [name, depData] of Object.entries(dependencies)) {
        if (seen.has(name)) continue;
        seen.add(name);

        deps.push({
          name,
          version: (depData.version as string) || '',
          ecosystem: 'npm',
          direct: true,
        });
      }
    }

    return deps;
  }

  private extractPackageName(pkgPath: string): string {
    const parts = pkgPath.split('node_modules/');
    const lastPart = parts[parts.length - 1];
    return lastPart || '';
  }
}
