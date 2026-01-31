import { z } from "zod";

// Define forbidden or unsafe output patterns (add more as needed)
const FORBIDDEN_PATTERNS = [
  /personal information/i,
  /credit card/i,
  /password/i,
  /ssn|social security number/i,
  /offensive|abusive|hate|violence/i,
  /sexual|explicit|adult/i,
  /illegal|unlawful|crime/i,
];

// Output validation schema
export const OutputGuardrailSchema = z.object({
  output: z.string().min(1, "Output cannot be empty"),
});

export type ValidatedOutput = z.infer<typeof OutputGuardrailSchema>;

/**
 * Validates if the output is safe and does not contain forbidden content
 * @param output - Model output string
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateOutputGuardrails(
  output: string
): { isValid: boolean; error?: string } {
  // Validate output is not empty
  const parseResult = OutputGuardrailSchema.safeParse({ output });
  if (!parseResult.success) {
    return {
      isValid: false,
      error: "Output is required and cannot be empty",
    };
  }

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(output)) {
      return {
        isValid: false,
        error: "Output contains forbidden or unsafe content.",
      };
    }
  }

  return { isValid: true };
}

/**
 * Middleware to check output guardrails
 * @param output - Model output string
 * @throws Error if output fails guardrail validation
 */
export function checkOutputGuardrails(output: string): void {
  const validation = validateOutputGuardrails(output);

  if (!validation.isValid) {
    throw new Error(validation.error || "Output validation failed");
  }
}
