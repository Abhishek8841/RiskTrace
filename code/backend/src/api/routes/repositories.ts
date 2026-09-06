import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ScanService } from '../../services/scan/scan.service.js';

export function repositoryRoutes(fastify: FastifyInstance, scanService: ScanService) {
  fastify.get('/api/repositories', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const repositories = await scanService.listRepositories();

      const formatted = repositories.map((repo) => ({
        id: repo.id,
        owner: repo.owner,
        name: repo.name,
        url: repo.url,
        defaultBranch: repo.defaultBranch,
        latestCommitSha: repo.latestCommitSha,
        createdAt: repo.createdAt.toISOString(),
        lastScan: repo.scans[0]
          ? {
              id: repo.scans[0].id,
              status: repo.scans[0].status,
              riskScore: repo.scans[0].riskScore,
              riskLevel: repo.scans[0].riskLevel,
              startedAt: repo.scans[0].startedAt.toISOString(),
            }
          : null,
      }));

      return reply.status(200).send({ repositories: formatted });
    } catch (error: unknown) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve repositories.',
      });
    }
  });
}
