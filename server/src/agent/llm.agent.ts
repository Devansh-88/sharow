import https from 'https'
import env from '../config/env';
import { GoogleGenAI } from '@google/genai';
import http from 'http'
// Gemini agent scaffold
// - Provides a pluggable agent loop for LLM calls (Gemini)
// - Accepts tool and guard injections (vision/OCR, validators, etc.)
// - Contains a helper to process an electricity-bill image and extract basic entities
//
// TODO: wire a real Gemini SDK client in `initClient()` and provide real `callGemini()`

type Tools = Record<string, any>;
type Guard = ((context: any) => Promise<void> | void) | { execute: Function };

export interface GeminiAgentOptions {
  apiKey?: string;
  tools?: Tools;
  guards?: Guard[];
  inputGuardrails?: Guard[];
  outputGuardrails?: Guard[];
  name?: string;
  instructions?: string;
  model?: string;
  outputType?: any;
}

export default class GeminiAgent {
  private apiKey?: string
  private client: any | null = null
  private tools: Tools
  private guards: Guard[]
  public name?: string
  public instructions?: string
  public model?: string
  public outputType?: any
  private inputGuardrails: Guard[]
  private outputGuardrails: Guard[]


  constructor(opts: GeminiAgentOptions = {}) {
    this.apiKey = opts.apiKey || process.env.GEMINI_API_KEY
    this.tools = opts.tools || {}
    this.guards = opts.guards || []
    this.inputGuardrails = opts.inputGuardrails || []
    this.outputGuardrails = opts.outputGuardrails || []
    this.name = opts.name
    this.instructions = opts.instructions
    this.model = opts.model || 'gemini-pro'
    this.outputType = opts.outputType
  }

  /**
   * OpenAI-style static create method for async setup.
   */
  static async create(opts: GeminiAgentOptions = {}) {
    const agent = new GeminiAgent(opts)
    agent.initClient()
    return agent
  }

  /**
   * Initialize the Gemini SDK client.
   * Replace the placeholder with the actual Gemini SDK initialization.
   */
  initClient() {
    if (!this.apiKey) {
      console.warn('Gemini API key not provided. Agent will run in dry-run mode.')
      return;
    }
    // Use GoogleGenAI SDK
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  registerTools(tools: Tools) {
    this.tools = { ...this.tools, ...tools }
  }

  registerGuards(guards: Guard[]) {
    this.guards = [...this.guards, ...guards]
  }

  private async runGuards(context: any) {
    for (const g of this.guards) {
      if (typeof g === 'function') {
        await g(context);
      } else if (g && typeof g.execute === 'function') {
        await g.execute(context);
      }
    }
  }


  /**
   * High-level method: process a bill image buffer and return structured info using Gemini's built-in OCR.
   * Sends the image directly to Gemini for OCR and extraction.
   */
  async processBillImage(imageBuffer: Buffer, question?: string, appliances?: Array<{ name: string; avgUsageHours: number; wattage?: number }>) {
    // Compose a prompt for Gemini to extract bill info from the image
    const promptParts = [
      this.instructions || 'Extract all relevant electricity bill details from this image. Return all fields as structured JSON.',
      question ? `USER_QUESTION:\n${question}` : '',
      appliances && appliances.length > 0 ? `\n\nUSER'S APPLIANCES (for cost calculation):\n${appliances.map(a => `- ${a.name}: ${a.avgUsageHours} hours/day${a.wattage ? `, ${a.wattage}W` : ''}`).join('\n')}\n\nPlease calculate the estimated cost per appliance based on the bill rate and provide tips on which appliances are consuming the most.` : ''
    ];
    const prompt = promptParts.filter(Boolean).join('\n\n');

    // Send image and prompt to Gemini
    const response = await this.callGemini(prompt, { image: imageBuffer });
    let entities = {};
    if (response && typeof response.text === 'string') {
      // Debug: print raw Gemini response
      console.log('--- RAW GEMINI RESPONSE ---');
      console.log(response.text);
      try {
        entities = JSON.parse(response.text);
      } catch {
        entities = { raw: response.text };
      }
    }
    return { entities };
  }

  /**
   * Very small, heuristic entity extraction from OCR text. Replace with a better
   * parser or structured-extraction tool later.
   */
  extractEntitiesFromText(text: string) {
    const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const joined = lines.join(' | ')

    const accountMatch = joined.match(/account\s*(no|number)?[:#\s]*([A-Z0-9-]+)/i)
    const amountMatch = joined.match(/(?:total|amount|due)[:\s]*\$?\s*([0-9]+(?:\.[0-9]{2})?)/i)
    const dateMatch = joined.match(/(?:due date|date due|due)[:\s]*([0-9]{1,2}[-\/. ][0-9]{1,2}[-\/. ][0-9]{2,4})/i)

    return {
      accountNumber: accountMatch?.[2] || null,
      amountDue: amountMatch?.[1] || null,
      dueDate: dateMatch?.[1] || null,
      rawLines: lines,
    }
  }

  /**
   * Call Gemini LLM with a prompt. Replace implementation with the real SDK call.
   */
  async callGemini(prompt: string, opts: Record<string, any> = {}) {
    if (!this.client) {
      // Dry-run / fallback: return a canned response for development
      return {
        text: `DRY-RUN: Gemini client not initialized. Prompt received: ${prompt.slice(0, 200)}`,
      };
    }

    // If image is provided, use Gemini vision API
    if (opts.image) {
      const base64ImageData = opts.image.toString('base64');
      const mimeType = opts.mimeType || 'image/png';
      const result = await this.client.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          { text: prompt }
        ],
      });
      let text = '';
      for await (const chunk of result) {
        if (chunk.text) text += chunk.text;
      }
      return { text };
    }

    // Otherwise, just text prompt
    // TODO: Add text-only Gemini call if needed
    return { text: '' };
  }

  /**
   * Main agent loop: given an image and optional user query, parse the bill and
   * ask Gemini to answer follow-up questions. Guards and tools are applied.
   */
  /**
   * Accepts either an image URL or a Buffer. If imageUrl is provided, fetches the image and processes it.
   */
  /**
   * Accepts only an imageUrl. Fetches the image and processes it.
   */
  /**
   * OpenAI-style run method: main entry point for agentic loop.
   */
  async run(params: { imageUrl: string; question?: string; sessionId?: string; appliances?: Array<{ name: string; avgUsageHours: number; wattage?: number }> }) {
    const { imageUrl, question, sessionId, appliances } = params;
    const context: any = { sessionId: sessionId || null };

    await this.runGuards(context);
    for (const guard of this.inputGuardrails) {
      if (typeof guard === 'function') {
        await guard(params);
      } else if (guard && typeof guard.execute === 'function') {
        await guard.execute(params);
      }
    }

    try {
      if (!imageUrl) {
        return {
          error: {
            message: 'No image URL provided.',
            details: 'Please provide a valid image URL.'
          }
        };
      }
      const imageBuffer = await GeminiAgent.fetchImageBuffer(imageUrl);
      // Use Gemini's built-in OCR/image understanding
      const parsed = await this.processBillImage(imageBuffer, question, appliances);
      context.bill = parsed;

      // The rest of the prompt/response logic is now handled by Gemini in processBillImage
      let response = { text: JSON.stringify(parsed.entities) };

      for (const guard of this.outputGuardrails) {
        if (typeof guard === 'function') {
          await guard(response);
        } else if (guard && typeof guard.execute === 'function') {
          await guard.execute({ output: response, context: params });
        }
      }

      // Output type validation (if schema provided)
      if (this.outputType && typeof this.outputType.safeParse === 'function') {
        const validation = this.outputType.safeParse(parsed.entities);
        if (!validation.success) {
          let details = 'Unknown error.';
          if (validation.error && Array.isArray(validation.error.errors)) {
            details = validation.error.errors.map((e: { message: string; path?: any[] }) => `• ${e.message}${e.path ? ` (field: ${e.path.join('.')})` : ''}`).join('\n');
          }
          return {
            error: {
              message: 'Sorry, I could not find a valid electricity bill in the image you provided. Please upload a clear photo of your bill.',
              details
            }
          };
        }
        return {
          input: { question, parsed },
          output: validation.data,
        };
      }

      return {
        input: { question, parsed },
        output: parsed.entities,
      };
    } catch (err: any) {
      // Format Gemini API errors and other errors
      let message = 'An unexpected error occurred.';
      let details = '';
      if (err && err.status === 429) {
        message = 'You have exceeded your Gemini API quota.';
        details = 'Please wait for your quota to reset or upgrade your Gemini API plan.';
      } else if (err && err.error && err.error.message) {
        message = 'Gemini API Error';
        details = err.error.message;
      } else if (err && err.message) {
        message = err.message;
      }
      return {
        error: {
          message,
          details
        }
      };
    }
  }

  /**
   * Fetches an image from a URL and returns it as a Buffer.
   */
  static fetchImageBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http
      client.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch image. Status code: ${res.statusCode}`))
          return
        }
        const data: Uint8Array[] = []
        res.on('data', chunk => data.push(chunk))
        res.on('end', () => resolve(Buffer.concat(data)))
        res.on('error', reject)
      }).on('error', reject)
    })
  }
}
