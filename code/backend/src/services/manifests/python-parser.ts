import { ManifestParser } from './manifest-parser.js';
import { NormalizedDependency, Ecosystem } from '../../types/index.js';
import { parse as parseToml } from 'smol-toml';

function cleanPythonVersion(version: string): string {
  if (!version) return '';
  return version.replace(/^[>=<!~\s]+/, '').split(/[,;\s]/)[0].trim();
}

export class PythonManifestParser implements ManifestParser {
  ecosystem: Ecosystem = 'pypi';
  supportedFiles = ['requirements.txt', 'pyproject.toml'];

  canParse(filename: string): boolean {
    return this.supportedFiles.includes(filename);
  }

  parse(content: string, filename: string): NormalizedDependency[] {
    try {
      if (filename === 'requirements.txt') {
        return this.parseRequirementsTxt(content);
      }
      if (filename === 'pyproject.toml') {
        return this.parsePyprojectToml(content);
      }
      return [];
    } catch {
      return [];
    }
  }

  private parseRequirementsTxt(content: string): NormalizedDependency[] {
    const deps: NormalizedDependency[] = [];
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#') || line.startsWith('-')) continue;

      const withoutMarker = line.split(';')[0].trim();
      if (!withoutMarker) continue;

      const match = withoutMarker.match(/^([a-zA-Z0-9_.-]+)\s*(?:\[.*?\])?\s*([>=<!~]+\s*[\d.a-zA-Z*]+)?/);
      if (match) {
        const name = match[1];
        const versionConstraint = match[2] || '';
        deps.push({
          name: name.toLowerCase(),
          version: cleanPythonVersion(versionConstraint),
          ecosystem: 'pypi',
          direct: true,
        });
      }
    }

    return deps;
  }

  private parsePyprojectToml(content: string): NormalizedDependency[] {
    const deps: NormalizedDependency[] = [];
    const seen = new Set<string>();

    const data = parseToml(content) as Record<string, unknown>;

    const project = data.project as Record<string, unknown> | undefined;
    if (project?.dependencies && Array.isArray(project.dependencies)) {
      for (const dep of project.dependencies as string[]) {
        const parsed = this.parseDependencyString(dep);
        if (parsed && !seen.has(parsed.name)) {
          seen.add(parsed.name);
          deps.push(parsed);
        }
      }
    }

    const optionalDeps = project?.['optional-dependencies'] as Record<string, string[]> | undefined;
    if (optionalDeps) {
      for (const group of Object.values(optionalDeps)) {
        if (Array.isArray(group)) {
          for (const dep of group) {
            const parsed = this.parseDependencyString(dep);
            if (parsed && !seen.has(parsed.name)) {
              seen.add(parsed.name);
              deps.push(parsed);
            }
          }
        }
      }
    }

    const tool = data.tool as Record<string, unknown> | undefined;
    const poetry = tool?.poetry as Record<string, unknown> | undefined;
    if (poetry?.dependencies) {
      const poetryDeps = poetry.dependencies as Record<string, unknown>;
      for (const [name, value] of Object.entries(poetryDeps)) {
        if (name === 'python') continue; 
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());

        let version = '';
        if (typeof value === 'string') {
          version = cleanPythonVersion(value);
        } else if (typeof value === 'object' && value !== null) {
          const v = (value as Record<string, unknown>).version;
          if (typeof v === 'string') version = cleanPythonVersion(v);
        }

        deps.push({
          name: name.toLowerCase(),
          version,
          ecosystem: 'pypi',
          direct: true,
        });
      }
    }

    return deps;
  }

  private parseDependencyString(dep: string): NormalizedDependency | null {
    const match = dep.match(/^([a-zA-Z0-9_.-]+)\s*(?:\[.*?\])?\s*([>=<!~]+\s*[\d.a-zA-Z*]+)?/);
    if (!match) return null;

    return {
      name: match[1].toLowerCase(),
      version: cleanPythonVersion(match[2] || ''),
      ecosystem: 'pypi',
      direct: true,
    };
  }
}
