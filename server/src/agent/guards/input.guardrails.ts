import { z } from "zod";
import { inputGuard, InputGuardOutputSchema } from '../base.agent';
import { InputGuardrail } from './guardrail.types';

const ALLOWED_TOPICS = [
  "bills",
  "savings",
  "energy",
  "electricity",
  "power consumption",
  "appliance",
  "usage",
  "cost",
  "expense",
  "consumption",
  "efficiency",
  "peak hours",
  "budget",
  "tariff",
  "meter",
  "invoice",
  "payment",
  "usage analysis",
  "energy saving",
  "optimization",
  "reduction",
  "comparison",
  "forecast",
  "trend",
  "device",
  "household",
];

function validateInputGuardrails(input: string | undefined | null): { isAllowed: boolean; reason: string; message?: string } {
  if (!input || typeof input !== 'string') {
    return {
      isAllowed: false,
      reason: 'Input is required and cannot be empty',
      message: 'Sorry, I can only help with electricity bills, energy usage analysis, and cost calculations. Please ask about those.'
    };
  }
  const lowerInput = input.toLowerCase().trim();

  const containsAllowedTopic = ALLOWED_TOPICS.some((topic) =>
    lowerInput.includes(topic)
  );

  const isConversational = /^(hi|hello|hey|yes|no|ok|thanks|thank you|hmm|uhh|what|how|why|can you|please|help)\b/i.test(lowerInput);

  const isCompletelyUnrelated = /\b(recipe|weather|sports|movie|music|game|politics|news|joke|story)\b/i.test(lowerInput) && !containsAllowedTopic;

  let isAllowed = containsAllowedTopic || isConversational;
  if (isCompletelyUnrelated) {
    isAllowed = false;
  }

  let reason = isAllowed
    ? 'Input is allowed because it relates to electricity, bills, energy, or is a valid conversational query.'
    : 'Input is rejected because it does not relate to electricity bills, energy usage, or cost analysis.';
  let message = isAllowed ? undefined : 'Sorry, I can only help with electricity bills, energy usage analysis, appliance costs, and tips to reduce your bill. Please ask about those topics.';

  return { isAllowed, reason, message };
}

const sharowInputGuardrail: InputGuardrail = {
  name: "Sharow Input Guardrail",
  runInParallel: false,
  async execute({ input, context }) {
    const validation = validateInputGuardrails(input);
    const output = InputGuardOutputSchema.parse({
      isAllowed: validation.isAllowed,
      reason: validation.reason,
      message: validation.message,
    });
    return {
      tripwireTriggered: !output.isAllowed,
      outputInfo: {
        outcome: `Input Guardrail ${!output.isAllowed ? `Triggered - Reason: ${output.reason}` : 'Not Triggered'}`,
        message: output.message
      }
    };
  }
};

export default sharowInputGuardrail;
