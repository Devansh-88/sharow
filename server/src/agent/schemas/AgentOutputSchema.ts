
import { z } from 'zod';

export const AgentOutputTypeSchema = z.object({
  // Bill extraction fields
  totalAmount: z.union([z.string(), z.number()]).optional(),
  unitsConsumed: z.union([z.string(), z.number()]).optional(),
  billingDate: z.string().optional(),
  dueDate: z.string().optional(),
  accountNumber: z.string().optional(),
  customerName: z.string().optional(),
  address: z.string().optional(),
  period: z.string().optional(),
  
  // Appliance analysis fields
  applianceBreakdown: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  shadowWaste: z.union([z.string(), z.number()]).optional(),
  
  // Analysis and tips
  analysis: z.string().optional(),
  tips: z.array(z.string()).optional(),
  unusualConsumption: z.string().optional(),
  potentialSavings: z.union([z.string(), z.number()]).optional(),
  
  // Fallback fields
  rawText: z.string().optional(),
  fields: z.record(z.string(), z.any()).optional(),
});

export type AgentOutputType = z.infer<typeof AgentOutputTypeSchema>;
