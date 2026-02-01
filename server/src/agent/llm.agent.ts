import https from 'https'
import env from '../config/env';
import { GoogleGenAI } from '@google/genai';
import http from 'http'

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

export interface ConversationHistory {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;
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

  initClient() {
    if (!this.apiKey) {
      console.warn('Gemini API key not provided. Agent will run in dry-run mode.')
      return;
    }
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


  async processBillImage(imageBuffer: Buffer, question?: string, appliances?: Array<{ name: string; avgUsageHours: number; wattage?: number }>) {
    const promptParts = [
      this.instructions || 'Extract all relevant electricity bill details from this image. Return all fields as structured JSON.',
      question ? `USER_QUESTION:\n${question}` : '',
      appliances && appliances.length > 0 ? `\n\nUSER'S APPLIANCES (for cost calculation):\n${appliances.map(a => `- ${a.name}: ${a.avgUsageHours} hours/day${a.wattage ? `, ${a.wattage}W` : ''}`).join('\n')}\n\nPlease calculate the estimated cost per appliance based on the bill rate and provide tips on which appliances are consuming the most.` : ''
    ];
    const prompt = promptParts.filter(Boolean).join('\n\n');

    const response = await this.callGemini(prompt, { image: imageBuffer });
    let entities = {};
    if (response && typeof response.text === 'string') {
      const jsonMatch = response.text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          entities = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.error('Failed to parse JSON block:', e);
          entities = { raw: response.text };
        }
      } else {
        try {
          entities = JSON.parse(response.text);
        } catch {
          entities = { raw: response.text };
        }
      }
    }
    return { entities };
  }

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

  async callGemini(prompt: string, opts: Record<string, any> = {}) {
    if (!this.client) {
      return {
        text: `DRY-RUN: Gemini client not initialized. Prompt received: ${prompt.slice(0, 200)}`,
      };
    }

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

    return { text: '' };
  }

  async chat(message: string, history: ConversationHistory[] = []) {
    if (!this.client) {
      return {
        text: 'DRY-RUN: Gemini client not initialized.',
        history: [],
      };
    }

    const model = this.client.models.get({ model: 'gemini-3-flash-preview' });
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(message);
    
    let text = '';
    for await (const chunk of result) {
      if (chunk.text) text += chunk.text;
    }

    const updatedHistory: ConversationHistory[] = [
      ...history,
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text }] },
    ];

    return { text, history: updatedHistory };
  }

  async run(params: { imageUrl?: string; message?: string; question?: string; sessionId?: string; appliances?: Array<{ name: string; avgUsageHours: number; wattage?: number }>; history?: ConversationHistory[] }) {
    const { imageUrl, message, question, sessionId, appliances, history = [] } = params;
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
      if (message && history.length > 0) {
        const chatResult = await this.chat(message, history);
        
        let response = { text: chatResult.text };
        for (const guard of this.outputGuardrails) {
          if (typeof guard === 'function') {
            await guard(response);
          } else if (guard && typeof guard.execute === 'function') {
            await guard.execute({ output: response, context: params });
          }
        }

        return {
          input: { message },
          output: chatResult.text,
          history: chatResult.history,
        };
      }

      if (!imageUrl) {
        return {
          error: {
            message: 'No image URL provided.',
            details: 'Please provide a valid image URL.'
          }
        };
      }
      
      const imageBuffer = await GeminiAgent.fetchImageBuffer(imageUrl);
      const parsed = await this.processBillImage(imageBuffer, question, appliances);
      context.bill = parsed;

      let response = { text: JSON.stringify(parsed.entities) };

      for (const guard of this.outputGuardrails) {
        if (typeof guard === 'function') {
          await guard(response);
        } else if (guard && typeof guard.execute === 'function') {
          await guard.execute({ output: response, context: params });
        }
      }

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

        const billContext = `You just analyzed an electricity bill with the following details:
- Total Amount: ₹${validation.data.totalAmount}
- Units Consumed: ${validation.data.unitsConsumed} kWh
- Billing Date: ${validation.data.billingDate}
- Appliance Breakdown: ${JSON.stringify(validation.data.applianceBreakdown)}
- Shadow Waste: ₹${validation.data.shadowWaste}

You can answer follow-up questions about this bill, provide energy-saving tips, or help analyze consumption patterns.`;

        const initialHistory: ConversationHistory[] = [
          { role: 'user', parts: [{ text: `Here is my electricity bill image. Please analyze it.` }] },
          { role: 'model', parts: [{ text: billContext }] },
        ];

        return {
          input: { question, parsed },
          output: validation.data,
          history: initialHistory,
        };
      }

      return {
        input: { question, parsed },
        output: parsed.entities,
        history: [],
      };
    } catch (err: any) {
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
