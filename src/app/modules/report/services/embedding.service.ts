import { Injectable, Logger } from '@nestjs/common';
import { ENV } from '@src/env';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  /**
   * Generate a semantic embedding for a report using Gemini. Returns `null` when
   * embeddings are unavailable (missing key or API failure); callers should then
   * skip vector-based duplicate detection gracefully.
   */
  async embed(text: string): Promise<number[] | null> {
    if (!ENV.gemini.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set — skipping embedding generation.');
      return null;
    }

    try {
      const url = `${ENV.gemini.baseUrl}/${ENV.gemini.embedModel}:embedContent?key=${ENV.gemini.apiKey}`;

      const { data } = await axios.post(
        url,
        {
          model: `models/${ENV.gemini.embedModel}`,
          content: { parts: [{ text }] },
          outputDimensionality: ENV.gemini.embedDim,
        },
        { timeout: 20000, headers: { 'Content-Type': 'application/json' } },
      );

      const values: number[] | undefined = data?.embedding?.values;
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Empty embedding response from Gemini');
      }

      return values;
    } catch (error) {
      this.logger.error(`Gemini embedding failed: ${(error as Error)?.message}`);
      return null;
    }
  }

  /** Format a numeric vector into the pgvector literal, e.g. "[0.1,0.2,0.3]". */
  toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }
}
