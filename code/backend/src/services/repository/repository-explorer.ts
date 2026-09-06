import * as fs from 'fs/promises';
import * as path from 'path';
import { ManifestFile, Ecosystem } from '../../types/index.js';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'vendor',
  'build',
  'dist',
  '.next',
  '__pycache__',
  '.venv',
  'venv',
  'env',
  '.tox',
  '.eggs',
  'target',
  'bin',
  'obj',
  '.idea',
  '.vscode',
  '.github',
  'coverage',
  '.nyc_output',
]);

const MANIFEST_MAP: Record<string, Ecosystem> = {
  'package.json': 'npm',
  'package-lock.json': 'npm',
  'requirements.txt': 'pypi',
  'pyproject.toml': 'pypi',
  'go.mod': 'go',
};

export interface ExplorationResult {
  manifests: ManifestFile[];
  ecosystems: Ecosystem[];
  fileCount: number;
}

export class RepositoryExplorer {
  private maxFiles = 50_000;
  private maxDepth = 15;

  async explore(repoPath: string): Promise<ExplorationResult> {
    const manifests: ManifestFile[] = [];
    const fileCounter = { value: 0 };

    await this.walkDirectory(repoPath, repoPath, 0, manifests, fileCounter);

    const ecosystems = [...new Set(manifests.map((m) => m.ecosystem))];

    return {
      manifests,
      ecosystems,
      fileCount: fileCounter.value,
    };
  }

  private async walkDirectory(
    basePath: string,
    currentPath: string,
    depth: number,
    manifests: ManifestFile[],
    fileCounter: { value: number },
  ): Promise<void> {
    if (depth > this.maxDepth || fileCounter.value > this.maxFiles) {
      return;
    }

    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (fileCounter.value > this.maxFiles) break;

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;

        await this.walkDirectory(
          basePath,
          path.join(currentPath, entry.name),
          depth + 1,
          manifests,
          fileCounter,
        );
      } else if (entry.isFile()) {
        fileCounter.value++;

        const ecosystem = MANIFEST_MAP[entry.name];
        if (ecosystem) {
          const relativePath = path.relative(basePath, path.join(currentPath, entry.name));
          manifests.push({
            path: relativePath.replace(/\\/g, '/'),
            ecosystem,
            filename: entry.name,
          });
        }
      }
    }
  }
}
