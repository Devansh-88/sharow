import { z } from 'zod';

export const AgentOutputTypeSchema = z.object({
  id: z.string(),
  totalAmount: z.number(),
  unitsConsumed: z.number(),
  billingDate: z.preprocess(val => (typeof val === 'string' ? new Date(val) : val), z.date()),
  applianceBreakdown: z.record(z.string(), z.number()),
  shadowWaste: z.number(),
});

export type AgentOutputType = z.infer<typeof AgentOutputTypeSchema>;
