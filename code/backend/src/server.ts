import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './database/client.js';
import { healthRoutes } from './api/routes/health.js';
import { scanRoutes } from './api/routes/scans.js';
import { repositoryRoutes } from './api/routes/repositories.js';
import { ScanService } from './services/scan/scan.service.js';
import { RepositoryCollector } from './services/repository/repository-collector.js';
import { RepositoryExplorer } from './services/repository/repository-explorer.js';
import { DependencyExtractor } from './services/dependencies/dependency-extractor.js';
import { VulnerabilityMatcher } from './services/vulnerabilities/vulnerability-matcher.js';
import { RuleBasedRiskScorer } from './services/risk/rule-based-scorer.js';
import { ManifestParserRegistry } from './services/manifests/manifest-parser.js';
import { NodeManifestParser } from './services/manifests/node-parser.js';
import { PythonManifestParser } from './services/manifests/python-parser.js';
import { GoManifestParser } from './services/manifests/go-parser.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  const parserRegistry = new ManifestParserRegistry();
  parserRegistry.register(new NodeManifestParser());
  parserRegistry.register(new PythonManifestParser());
  parserRegistry.register(new GoManifestParser());

  const repositoryCollector = new RepositoryCollector(process.env.GITHUB_TOKEN);
  const repositoryExplorer = new RepositoryExplorer();
  const dependencyExtractor = new DependencyExtractor(parserRegistry);
  const vulnerabilityMatcher = new VulnerabilityMatcher();
  const riskScorer = new RuleBasedRiskScorer();

  const scanService = new ScanService(
    prisma,
    repositoryCollector,
    repositoryExplorer,
    dependencyExtractor,
    vulnerabilityMatcher,
    riskScorer,
  );

  await fastify.register(healthRoutes);
  scanRoutes(fastify, scanService);
  repositoryRoutes(fastify, scanService);

  const shutdown = async () => {
    fastify.log.info('Shutting down...');
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`RiskTrace backend running on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
