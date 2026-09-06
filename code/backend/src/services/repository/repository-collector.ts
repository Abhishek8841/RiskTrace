import { RepositoryInfo } from '../../types/index.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

const execFileAsync = promisify(execFile);

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?$/;

export function parseGitHubUrl(url: string): { owner: string; name: string } {
  const trimmed = url.trim().replace(/\.git$/, '');
  const match = trimmed.match(GITHUB_URL_REGEX);
  if (!match) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }
  return { owner: match[1], name: match[2] };
}

/**
 * Validate whether a string is a valid GitHub repository URL.
 */
export function validateGitHubUrl(url: string): boolean {
  try {
    parseGitHubUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Collects repository metadata and clones for local analysis.
 * Only supports public GitHub repositories.
 */
export class RepositoryCollector {
  private githubToken?: string;

  constructor(githubToken?: string) {
    this.githubToken = githubToken;
  }

  /**
   * Collect repository information and clone to a temporary directory.
   */
  async collect(repositoryUrl: string): Promise<{ info: RepositoryInfo; localPath: string }> {
    const { owner, name } = parseGitHubUrl(repositoryUrl);

    const info = await this.fetchRepoInfo(owner, name, repositoryUrl);
    const localPath = await this.cloneRepository(owner, name);

    return { info, localPath };
  }

  /**
   * Fetch repository metadata from the GitHub REST API.
   */
  private async fetchRepoInfo(owner: string, name: string, url: string): Promise<RepositoryInfo> {
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'RiskTrace-Scanner/0.1',
    };
    if (this.githubToken) {
      headers['Authorization'] = `Bearer ${this.githubToken}`;
    }

    const response = await fetch(apiUrl, { headers });

    if (response.status === 404) {
      throw new Error(`Repository not found: ${owner}/${name}`);
    }
    if (response.status === 403) {
      throw new Error(
        'GitHub API rate limit exceeded. Try again later or provide a GITHUB_TOKEN in environment variables.'
      );
    }
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    
    let latestCommitSha: string | null = null;
    try {
      const defaultBranch = (data.default_branch as string) || 'main';
      const commitsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(defaultBranch)}`;
      const commitResponse = await fetch(commitsUrl, { headers });
      if (commitResponse.ok) {
        const commitData = (await commitResponse.json()) as Record<string, unknown>;
        latestCommitSha = (commitData.sha as string) || null;
      }
    } catch {
      
    }

    return {
      owner,
      name,
      url: url.trim().replace(/\.git$/, '').replace(/\/$/, ''),
      defaultBranch: (data.default_branch as string) || 'main',
      latestCommitSha,
    };
  }

    private async cloneRepository(owner: string, name: string): Promise<string> {
    
    if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(name)) {
      throw new Error('Invalid repository owner or name characters');
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'risktrace-'));
    const cloneUrl = `https://github.com/${owner}/${name}.git`;

    try {
      await execFileAsync('git', [
        'clone',
        '--depth', '1',
        '--single-branch',
        cloneUrl,
        tmpDir,
      ], {
        timeout: 120_000,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      });
    } catch (error: unknown) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to clone repository ${owner}/${name}: ${msg}`);
    }

    return tmpDir;
  }

    static async cleanup(localPath: string): Promise<void> {
    try {
      await fs.rm(localPath, { recursive: true, force: true });
    } catch {
      
    }
  }
}
