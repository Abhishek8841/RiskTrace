import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ScanService } from '../../services/scan/scan.service.js';
import { createScanSchema, scanIdSchema } from '../../schemas/scan.schema.js';
import { ZodError } from 'zod';

export function scanRoutes(fastify: FastifyInstance, scanService: ScanService) {
  fastify.post('/api/scans', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createScanSchema.parse(request.body);

      const result = await scanService.scan(body.repositoryUrl);

      return reply.status(201).send(result);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors.map((e) => e.message).join(', '),
        });
      }

      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('not found')) {
        return reply.status(404).send({ error: 'Not Found', message });
      }
      if (message.includes('rate limit')) {
        return reply.status(429).send({ error: 'Rate Limited', message });
      }
      if (message.includes('Invalid GitHub')) {
        return reply.status(400).send({ error: 'Bad Request', message });
      }
      if (message.includes('Failed to clone')) {
        return reply.status(502).send({ error: 'Repository Access Failed', message });
      }

      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while scanning the repository.',
      });
    }
  });

  fastify.get('/api/scans', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const scans = await scanService.listScans();
      return reply.status(200).send({ scans });
    } catch (error: unknown) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve scans.',
      });
    }
  });

  fastify.get('/api/scans/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = scanIdSchema.parse(request.params);
      const scan = await scanService.getScan(params.id);

      if (!scan) {
        return reply.status(404).send({ error: 'Not Found', message: 'Scan not found.' });
      }

      return reply.status(200).send(scan);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors.map((e) => e.message).join(', '),
        });
      }
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve scan.',
      });
    }
  });

  fastify.get('/api/scans/:id/dependencies', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = scanIdSchema.parse(request.params);
      const dependencies = await scanService.getScanDependencies(params.id);
      return reply.status(200).send({ dependencies });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors.map((e) => e.message).join(', '),
        });
      }
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve dependencies.',
      });
    }
  });

  fastify.get('/api/scans/:id/vulnerabilities', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = scanIdSchema.parse(request.params);
      const vulnerabilities = await scanService.getScanVulnerabilities(params.id);
      return reply.status(200).send({ vulnerabilities });
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors.map((e) => e.message).join(', '),
        });
      }
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve vulnerabilities.',
      });
    }
  });
}
