import { ENV } from '@src/env';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import { DuplicateService } from './duplicate.service';
import { EmbeddingService } from './embedding.service';

describe('DuplicateService', () => {
  let service: DuplicateService;
  let repo: { query: jest.Mock };
  let embeddingService: EmbeddingService;

  beforeEach(() => {
    repo = { query: jest.fn() };
    embeddingService = new EmbeddingService();
    service = new DuplicateService(repo as unknown as Repository<Report>, embeddingService);
    ENV.duplicate.similarityThreshold = 0.85;
  });

  it('returns no duplicate when embedding is null', async () => {
    const result = await service.findDuplicate(null, 'fire');
    expect(result).toEqual({ possibleDuplicate: false, matchedReportId: null });
    expect(repo.query).not.toHaveBeenCalled();
  });

  it('flags a duplicate when similarity is at/above threshold', async () => {
    repo.query.mockResolvedValueOnce([{ id: 'report-1', similarity: '0.92' }]);

    const result = await service.findDuplicate([0.1, 0.2, 0.3], 'fire');

    expect(result).toEqual({ possibleDuplicate: true, matchedReportId: 'report-1' });
    expect(repo.query).toHaveBeenCalledTimes(1);
  });

  it('does not flag when similarity is below threshold', async () => {
    repo.query.mockResolvedValueOnce([{ id: 'report-2', similarity: '0.40' }]);

    const result = await service.findDuplicate([0.1, 0.2, 0.3], 'flood');

    expect(result).toEqual({ possibleDuplicate: false, matchedReportId: null });
  });

  it('formats the pgvector literal and persists an embedding', async () => {
    repo.query.mockResolvedValueOnce([]);
    await service.saveEmbedding('report-3', [0.5, 0.25]);

    expect(repo.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE reports SET embedding'),
      ['[0.5,0.25]', 'report-3'],
    );
  });
});
