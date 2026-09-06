import { z } from 'zod';

export const createScanSchema = z.object({
  repositoryUrl: z
    .string()
    .min(1, 'Repository URL is required')
    .url('Must be a valid URL')
    .regex(
      /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/,
      'Must be a valid GitHub repository URL (https://github.com/owner/repo)',
    ),
});

export type CreateScanInput = z.infer<typeof createScanSchema>;

export const scanIdSchema = z.object({
  id: z.string().uuid('Invalid scan ID format'),
});

export type ScanIdParams = z.infer<typeof scanIdSchema>;
