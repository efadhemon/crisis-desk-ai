import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ENV } from '@src/env';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import { EmbeddingService } from './embedding.service';

export interface IDuplicateResult {
  possibleDuplicate: boolean;
  matchedReportId: string | null;
}

@Injectable()
export class DuplicateService {
  constructor(
    @InjectRepository(Report) private readonly repo: Repository<Report>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Find the most similar existing report using pgvector cosine similarity.
   * Pre-filters by category for relevance and speed. Returns a duplicate flag
   * when the top match's similarity is at or above the configured threshold.
   */
  async findDuplicate(
    embedding: number[] | null,
    category?: string,
    excludeId?: string,
  ): Promise<IDuplicateResult> {
    if (!embedding || embedding.length === 0) {
      return { possibleDuplicate: false, matchedReportId: null };
    }

    const literal = this.embeddingService.toVectorLiteral(embedding);
    const params: unknown[] = [literal];
    let where = `embedding IS NOT NULL AND "deletedAt" IS NULL`;

    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }
    if (excludeId) {
      params.push(excludeId);
      where += ` AND id != $${params.length}`;
    }

    const sql = `
      SELECT id, 1 - (embedding <=> $1::vector) AS similarity
      FROM reports
      WHERE ${where}
      ORDER BY embedding <=> $1::vector
      LIMIT 1
    `;

    const rows: Array<{ id: string; similarity: string }> = await this.repo.query(sql, params);
    const top = rows?.[0];

    if (top && Number(top.similarity) >= ENV.duplicate.similarityThreshold) {
      return { possibleDuplicate: true, matchedReportId: top.id };
    }

    return { possibleDuplicate: false, matchedReportId: null };
  }

  /** Persist a report's embedding via raw SQL (TypeORM has no `vector` type). */
  async saveEmbedding(reportId: string, embedding: number[]): Promise<void> {
    const literal = this.embeddingService.toVectorLiteral(embedding);
    await this.repo.query(`UPDATE reports SET embedding = $1::vector WHERE id = $2`, [
      literal,
      reportId,
    ]);
  }
}
