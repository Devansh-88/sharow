import { z } from 'zod';

export interface GuardrailContext {
  context?: any;
  conversationId?: string;
}

export interface InputGuardrail {
  name: string;
  runInParallel?: boolean;
  execute: (params: { input: any; context: GuardrailContext }) => Promise<{
    tripwireTriggered: boolean;
    outputInfo: {
      outcome: string;
      message?: string;
    };
  }>;
}

export interface OutputGuardrail {
  name: string;
  runInParallel?: boolean;
  execute: (params: { output: any; context: GuardrailContext }) => Promise<{
    tripwireTriggered: boolean;
    outputInfo: {
      outcome: string;
      message?: string;
    };
  }>;
}
