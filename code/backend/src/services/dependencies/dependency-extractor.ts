import * as fs from 'fs/promises';
import * as path from 'path';
import { NormalizedDependency, ManifestFile } from '../../types/index.js';
import { ManifestParserRegistry } from '../manifests/manifest-parser.js';

export class DependencyExtractor {
  constructor(private registry: ManifestParserRegistry) {}

  async extract(repoPath: string, manifests: ManifestFile[]): Promise<NormalizedDependency[]> {
    const allDeps: NormalizedDependency[] = [];
    const seen = new Set<string>();

    for (const manifest of manifests) {
      const parser = this.registry.getParser(manifest.filename);
      if (!parser) continue;

      try {
        const filePath = path.join(repoPath, manifest.path);
        const content = await fs.readFile(filePath, 'utf-8');
        const deps = parser.parse(content, manifest.filename);

        for (const dep of deps) {
          const key = `${dep.ecosystem}:${dep.name}`;
          if (!seen.has(key)) {
            seen.add(key);
            allDeps.push(dep);
          }
        }
      } catch {
      }
    }

    return allDeps;
  }
}
