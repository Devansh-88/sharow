import { z } from "zod";
import { outputGuard, OutputGuardOutputSchema } from '../base.agent';

type RunContext = { context?: any; conversationId?: string };
export interface OutputGuardrail {
  name: string;
  runInParallel?: boolean;
  execute: (params: { output: any; context: RunContext }) => Promise<{
    tripwireTriggered: boolean;
    outputInfo: {
      outcome: string;
      message?: string;
    };
  }>;
}

const FORBIDDEN_PATTERNS = [
  /personal information/i,
  /credit card/i,
  /password/i,
  /ssn|social security number/i,
  /offensive|abusive|hate|violence/i,
  /sexual|explicit|adult/i,
  /illegal|unlawful|crime/i,
];

function validateOutputGuardrails(output: string): { isSafe: boolean; reason: string; message?: string } {
  const isEmpty = !output || output.trim().length === 0;
  let isSafe = !isEmpty;
  let reason = isSafe
    ? 'Output is not empty.'
    : 'Output is required and cannot be empty.';
  let message = isSafe ? undefined : 'Sorry, I cannot provide that information.';
  if (isSafe) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(output)) {
        isSafe = false;
        reason = 'Output contains forbidden or unsafe content.';
        message = 'Sorry, I cannot provide that information.';
        break;
      }
    }
  }
  return { isSafe, reason, message };
}

const sharowOutputGuardrail: OutputGuardrail = {
  name: "Sharow Output Guardrail",
  runInParallel: false,
  async execute({ output, context }) {
    let outputStr = '';
    if (typeof output === 'string') {
      outputStr = output;
    } else if (output && typeof output.text === 'string') {
      outputStr = output.text;
    } else {
      outputStr = '';
    }
    const validation = validateOutputGuardrails(outputStr);
    const out = OutputGuardOutputSchema.parse({
      isSafe: validation.isSafe,
      reason: validation.reason,
      message: validation.message,
    });
    return {
      tripwireTriggered: !out.isSafe,
      outputInfo: {
        outcome: `Output Guardrail ${!out.isSafe ? `Triggered - Reason: ${out.reason}` : 'Not Triggered'}`,
        message: out.message
      }
    };
  }
};

export default sharowOutputGuardrail;
