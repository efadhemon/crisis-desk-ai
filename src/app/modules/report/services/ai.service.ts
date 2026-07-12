import { Injectable, Logger } from '@nestjs/common';
import { ENV } from '@src/env';
import axios from 'axios';
import { ENUM_REPORT_CATEGORY, ENUM_REPORT_LANGUAGE, ENUM_REPORT_URGENCY } from '../enums';
import { IAiClassification } from '../interfaces/ai-result.interface';

interface IClassifyInput {
  description: string;
  location: string;
  language?: ENUM_REPORT_LANGUAGE;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly categories = Object.values(ENUM_REPORT_CATEGORY);
  private readonly urgencies = Object.values(ENUM_REPORT_URGENCY);

  /**
   * Classify a citizen report using Gemini. Understands both Bangla and English
   * input and always returns an English summary + recommended action. Falls back
   * to safe defaults if the AI call fails so report submission never breaks.
   */
  async classify(input: IClassifyInput): Promise<IAiClassification> {
    if (!ENV.gemini.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set — using fallback classification.');
      return this.fallback(input);
    }

    try {
      const url = `${ENV.gemini.baseUrl}/${ENV.gemini.model}:generateContent?key=${ENV.gemini.apiKey}`;

      const { data } = await axios.post(
        url,
        {
          contents: [{ role: 'user', parts: [{ text: this.buildPrompt(input) }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: this.responseSchema(),
          },
        },
        { timeout: 20000, headers: { 'Content-Type': 'application/json' } },
      );

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      const parsed = JSON.parse(text);
      return this.normalize(parsed, input);
    } catch (error) {
      this.logger.error(`Gemini classification failed: ${(error as Error)?.message}`);
      return this.fallback(input);
    }
  }

  private buildPrompt(input: IClassifyInput): string {
    return [
      'You are an emergency and public-service triage assistant.',
      'A citizen report may be written in Bangla (bn) or English (en).',
      'Read it (translate internally if needed) and classify it.',
      '',
      `Allowed categories: ${this.categories.join(', ')}.`,
      `Allowed urgency levels: ${this.urgencies.join(', ')}.`,
      '',
      'Return strictly JSON with fields: category, urgency, summary, suggestedAction, confidence.',
      '- summary: a concise English summary (max 2 sentences).',
      '- suggestedAction: a short recommended action for responders, in English.',
      '- confidence: a number between 0 and 1 for your classification certainty.',
      '',
      `Location: ${input.location}`,
      `Declared language: ${input.language ?? ENUM_REPORT_LANGUAGE.UNKNOWN}`,
      `Report: ${input.description}`,
    ].join('\n');
  }

  private responseSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        category: { type: 'string', enum: this.categories },
        urgency: { type: 'string', enum: this.urgencies },
        summary: { type: 'string' },
        suggestedAction: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['category', 'urgency', 'summary', 'suggestedAction', 'confidence'],
    };
  }

  private normalize(parsed: any, input: IClassifyInput): IAiClassification {
    const category = this.categories.includes(parsed?.category)
      ? (parsed.category as ENUM_REPORT_CATEGORY)
      : ENUM_REPORT_CATEGORY.OTHER;

    const urgency = this.urgencies.includes(parsed?.urgency)
      ? (parsed.urgency as ENUM_REPORT_URGENCY)
      : ENUM_REPORT_URGENCY.MEDIUM;

    let confidence = Number(parsed?.confidence);
    if (Number.isNaN(confidence)) confidence = 0.5;
    confidence = Math.min(1, Math.max(0, confidence));

    const summary =
      typeof parsed?.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : input.description.slice(0, 240);

    const suggestedAction =
      typeof parsed?.suggestedAction === 'string' && parsed.suggestedAction.trim()
        ? parsed.suggestedAction.trim()
        : 'Forward to the relevant department for manual review.';

    return { category, urgency, summary, suggestedAction, confidence, fallbackUsed: false };
  }

  private fallback(input: IClassifyInput): IAiClassification {
    return {
      category: ENUM_REPORT_CATEGORY.OTHER,
      urgency: ENUM_REPORT_URGENCY.MEDIUM,
      summary: input.description.slice(0, 240),
      suggestedAction: 'Forward to the relevant department for manual review.',
      confidence: 0,
      fallbackUsed: true,
    };
  }
}
