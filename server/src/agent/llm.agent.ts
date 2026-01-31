import https from 'https'
import http from 'http'
// Gemini agent scaffold
// - Provides a pluggable agent loop for LLM calls (Gemini)
// - Accepts tool and guard injections (vision/OCR, validators, etc.)
// - Contains a helper to process an electricity-bill image and extract basic entities
//
// TODO: wire a real Gemini SDK client in `initClient()` and provide real `callGemini()`

type Tools = Record<string, any>;
type Guard = (context: any) => Promise<void> | void;

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
      return
    }

    // TODO: Replace this stub with real Gemini SDK initialization, for example:
    // import {GeminiClient} from '@google/gemini' // (example package)
    // this.client = new GeminiClient({ apiKey: this.apiKey })

    this.client = { /* placeholder client */ }
  }

  registerTools(tools: Tools) {
    this.tools = { ...this.tools, ...tools }
  }

  registerGuards(guards: Guard[]) {
    this.guards = [...this.guards, ...guards]
  }

  private async runGuards(context: any) {
    for (const g of this.guards) {
      await g(context)
    }
  }

  /**
   * High-level method: process a bill image buffer and return structured info.
   * Delegates OCR/vision to a registered tool named `vision` (if provided).
   * If not provided, this will throw so you can wire your preferred OCR.
   */
  async processBillImage(imageBuffer: Buffer) {
    if (!this.tools || !this.tools.vision) {
      throw new Error('No vision tool registered. Please register a `vision` tool for OCR.');
    }

    // vision tool is expected to return plain text from the image, e.g. { text: string }
    const visionResult = await this.tools.vision.run({ image: imageBuffer })
    const text: string = visionResult?.text || ''

    const entities = this.extractEntitiesFromText(text)

    return { text, entities }
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
      }
    }

    // TODO: Use this.client to call Gemini and return model response
    // e.g. return await this.client.generate({ prompt, ...opts })

    return { text: 'TODO: real Gemini response (client not wired)' }
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
  async run(params: { imageUrl: string; question?: string; sessionId?: string }) {
    const { imageUrl, question, sessionId } = params
    const context: any = { sessionId: sessionId || null }

    await this.runGuards(context)
    for (const guard of this.inputGuardrails) {
      await guard(params)
    }

    if (!imageUrl) {
      throw new Error('imageUrl is required')
    }
    const imageBuffer = await GeminiAgent.fetchImageBuffer(imageUrl)
    const parsed = await this.processBillImage(imageBuffer)
    context.bill = parsed

    const promptParts = []
    if (this.instructions) {
      promptParts.push(this.instructions)
    } else {
      promptParts.push('You are an assistant that extracts and answers questions about electricity bills.')
    }
    if (parsed.text) promptParts.push('OCR_TEXT:\n' + parsed.text)
    if (parsed.entities) promptParts.push('EXTRACTED_ENTITIES:\n' + JSON.stringify(parsed.entities, null, 2))
    if (question) promptParts.push('USER_QUESTION:\n' + question)

    const prompt = promptParts.join('\n\n')

    let response = await this.callGemini(prompt, { maxTokens: 800, model: this.model })

    for (const guard of this.outputGuardrails) {
      await guard(response)
    }

    // Output type validation (if schema provided)
    if (this.outputType && typeof this.outputType.safeParse === 'function') {
      const validation = this.outputType.safeParse(response)
      if (!validation.success) {
        throw new Error('Output does not match schema: ' + JSON.stringify(validation.error))
      }
      return {
        input: { question, parsed },
        output: validation.data,
      }
    }

    return {
      input: { question, parsed },
      output: response,
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
