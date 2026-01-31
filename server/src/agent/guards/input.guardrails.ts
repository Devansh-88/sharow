import { z } from "zod";

// Define allowed topics for the guardrail
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

// Input validation schema
export const InputGuardrailSchema = z.object({
  input: z.string().min(1, "Input cannot be empty"),
});

export type ValidatedInput = z.infer<typeof InputGuardrailSchema>;

/**
 * Validates if the input is related to allowed topics (bills, savings, energy, etc.)
 * @param input - User input string
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateInputGuardrails(
  input: string
): { isValid: boolean; error?: string } {
  // Validate input is not empty
  const parseResult = InputGuardrailSchema.safeParse({ input });
  if (!parseResult.success) {
    return {
      isValid: false,
      error: "Input is required and cannot be empty",
    };
  }

  const lowerInput = input.toLowerCase().trim();

  // Check if input contains any of the allowed topics
  const containsAllowedTopic = ALLOWED_TOPICS.some((topic) =>
    lowerInput.includes(topic)
  );

  if (!containsAllowedTopic) {
    return {
      isValid: false,
      error:
        "Invalid input. I can only assist with questions related to bills, savings, energy consumption, appliances, usage analysis, and cost optimization. Please ask a question about these topics.",
    };
  }

  return { isValid: true };
}

/**
 * Middleware to check input guardrails
 * @param input - User input string
 * @throws Error if input fails guardrail validation
 */
export function checkInputGuardrails(input: string): void {
  const validation = validateInputGuardrails(input);

  if (!validation.isValid) {
    throw new Error(validation.error || "Input validation failed");
  }
}
