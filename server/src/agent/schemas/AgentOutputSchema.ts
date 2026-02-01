
import { z } from 'zod';

export const AgentOutputTypeSchema = z.object({
  id: z.string().describe("Account number or bill number from the electricity bill"),
  totalAmount: z.number().describe("Total amount to be paid in rupees (numeric value only, no currency symbols)"),
  unitsConsumed: z.number().describe("Total units of electricity consumed in kWh"),
  billingDate: z.string().describe("Billing date in YYYY-MM-DD format"),
  applianceBreakdown: z.record(z.string(), z.number()).describe("Object mapping appliance names to their estimated monthly cost in rupees. Calculate based on provided appliance data or estimate typical appliances. Example: {'Air Conditioner': 2948.4, 'Refrigerator': 884.52}"),
  shadowWaste: z.number().describe("Estimated vampire load cost in rupees. This is the cost of electricity consumed by appliances in standby mode. Typically 5-10% of total consumption cost."),
  
  analysis: z.string().optional().describe("Brief analysis of the bill, highlighting key insights like consumption trends, rate per unit, and major cost drivers"),
  tips: z.array(z.string()).optional().describe("Array of actionable energy-saving tips specific to the user's consumption pattern and appliances"),
  unusualConsumption: z.string().optional().describe("Description of any unusual consumption patterns detected, such as unexpected spikes or high usage"),
  potentialSavings: z.number().optional().describe("Estimated potential monthly savings in rupees if energy-saving tips are followed"),
});

export type AgentOutputType = z.infer<typeof AgentOutputTypeSchema>;
