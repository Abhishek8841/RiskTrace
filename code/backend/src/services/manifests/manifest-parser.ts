import { NormalizedDependency, Ecosystem } from '../../types/index.js';

export interface ManifestParser {
  ecosystem: Ecosystem;

  supportedFiles: string[];

  canParse(filename: string): boolean;

  parse(content: string, filename: string): NormalizedDependency[];
}

export class ManifestParserRegistry {
  private parsers: ManifestParser[] = [];

  register(parser: ManifestParser): void {
    this.parsers.push(parser);
  }

  getParser(filename: string): ManifestParser | null {
    return this.parsers.find((p) => p.canParse(filename)) || null;
  }

  getAll(): ManifestParser[] {
    return [...this.parsers];
  }
}
