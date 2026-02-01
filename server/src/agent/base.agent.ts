import { z } from 'zod';
import { AgentOutputTypeSchema } from './schemas/AgentOutputSchema';
import 'dotenv/config';
import GeminiAgent from './llm.agent';
import inputGuardrail from './guards/input.guardrails';
import sharowOutputGuardrail from './guards/output.guardrails';

export const InputGuardOutputSchema = z.object({
  isAllowed: z.boolean().describe("True if input is related to electricity/energy/bill query and therefore allowed to be passed, else false"),
  reason: z.string().describe('VERY ACCURATE AND DESCRIPTIVE at least 30 words long Reason for rejection of input if rejected, otherwise why it was not rejected'),
  message: z.string().describe("UPON REJECTION, Appropriate concise message for user to let them know that something is wrong, WITHOUT REVEALING TECHNICALITY, a simple polite answer. The answer should preferably be like `Sorry I can't do that...` ,etc. manner shaped").optional()
});

export const inputGuard = new GeminiAgent({
  name: "Sharow Input Guard Agent",
  instructions: `Check if user input is related to electricity, bills, energy, or appliances, and nothing completely unrelated is mixed in query. The system serves a lot of things, don't assume that it might not have something. ALWAYS REDIRECT vague queries towards energy/bill topics.\nRULES:\n- ALLOW VAGUE queries/answers like hmm, uhh, etc.. and hi, what is your name, etc. Such question CAN be asked from an assistant, just see if this question/answer can be given to an energy assistant by a user and ALLOW IT, assuming that nothing else is intermixed like math, etc. AND THEN REDIRECT them towards our features in the same response politely\n- User can describe their mood, feeling, occupation, etc., for the assistant to suggest them something about energy usage, THIS IS COMPLETELY FINE because it is related to energy/bill.\n- Allow follow up queries like Yes, No that could make sense in response to previous query/response\n- Reject if something else is mixed with allowed query/answer(s).\n- The query can be indirect.`,
  model: 'gemini-pro',
  outputType: InputGuardOutputSchema
});

export const OutputGuardOutputSchema = z.object({
  isSafe: z.boolean().describe("True if output is safe and does not contain forbidden content, else false"),
  reason: z.string().describe('VERY ACCURATE AND DESCRIPTIVE at least 30 words long Reason for rejection of output if rejected, otherwise why it was not rejected'),
  message: z.string().describe("UPON REJECTION, Appropriate concise message for user to let them know that something is wrong, WITHOUT REVEALING TECHNICALITY, a simple polite answer. The answer should preferably be like `Sorry I can't do that...` ,etc. manner shaped").optional()
});

export const outputGuard = new GeminiAgent({
  name: "Sharow Output Guard Agent",
  instructions: `Check if model output is safe and does not contain forbidden or unsafe content. If any forbidden pattern is found, reject the output and provide a polite message to the user.`,
  model: 'gemini-pro',
  outputType: OutputGuardOutputSchema
});

const agent = await GeminiAgent.create({
  name: 'Sharow',
  instructions: `You are Sharow, a smart assistant for electricity bill analysis and energy cost optimization.\n\nYour job is to:\n1. Extract bill details from scanned electricity bills and return them in a specific JSON format\n2. Help users analyze their appliance-level energy consumption and costs\n3. Calculate expense per appliance based on user-provided usage hours and average consumption\n4. Identify what's causing unusually high bills\n5. Provide actionable tips to reduce electricity costs\n\nWhen extracting bill data, you MUST return it in this exact JSON format:\n{\n  "id": "account or bill number as string",\n  "totalAmount": numeric value,\n  "unitsConsumed": numeric value,\n  "billingDate": "YYYY-MM-DD" format,\n  "applianceBreakdown": {\n    "Appliance Name": cost in rupees (number)\n  },\n  "shadowWaste": estimated vampire load in rupees (number),\n  "analysis": "optional analysis text",\n  "tips": ["tip1", "tip2"]\n}\n\nIf the user provides appliance data, calculate the cost for each appliance and include it in applianceBreakdown.\nIf no appliance data is provided, estimate typical appliances based on the bill.\nAlways calculate shadowWaste (typically 5-10% of total consumption).\n\nIf the image is not a valid electricity bill, return an error in the analysis field.`,
  model: 'gemini-pro',
  tools: {},
  inputGuardrails: [inputGuardrail],
  outputGuardrails: [sharowOutputGuardrail],
  outputType: AgentOutputTypeSchema,
  apiKey: process.env.GEMINI_API_KEY
});

export default agent;
