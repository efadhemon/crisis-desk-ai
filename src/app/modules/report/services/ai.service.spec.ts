import { ENV } from '@src/env';
import axios from 'axios';
import { ENUM_REPORT_CATEGORY, ENUM_REPORT_LANGUAGE, ENUM_REPORT_URGENCY } from '../enums';
import { AiService } from './ai.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const geminiResponse = (payload: Record<string, unknown>) => ({
  data: {
    candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
  },
});

describe('AiService', () => {
  let service: AiService;
  const originalKey = ENV.gemini.apiKey;

  beforeEach(() => {
    service = new AiService();
    ENV.gemini.apiKey = 'test-key';
    jest.clearAllMocks();
  });

  afterAll(() => {
    ENV.gemini.apiKey = originalKey;
  });

  it('normalizes a valid Gemini classification', async () => {
    mockedAxios.post.mockResolvedValueOnce(
      geminiResponse({
        category: 'fire',
        urgency: 'critical',
        summary: 'A fire has been reported near a shop with possible trapped people.',
        suggestedAction: 'Immediately notify fire service and emergency responders.',
        confidence: 0.91,
      }),
    );

    const result = await service.classify({
      description: 'There is a fire near a shop and people are trapped.',
      location: 'Sylhet Bondor Bazar',
      language: ENUM_REPORT_LANGUAGE.EN,
    });

    expect(result.category).toBe(ENUM_REPORT_CATEGORY.FIRE);
    expect(result.urgency).toBe(ENUM_REPORT_URGENCY.CRITICAL);
    expect(result.confidence).toBe(0.91);
    expect(result.fallbackUsed).toBe(false);
  });

  it('coerces invalid category/urgency and clamps confidence', async () => {
    mockedAxios.post.mockResolvedValueOnce(
      geminiResponse({
        category: 'aliens',
        urgency: 'apocalyptic',
        summary: 'Something happened.',
        suggestedAction: 'Do something.',
        confidence: 5,
      }),
    );

    const result = await service.classify({ description: 'x', location: 'y' });

    expect(result.category).toBe(ENUM_REPORT_CATEGORY.OTHER);
    expect(result.urgency).toBe(ENUM_REPORT_URGENCY.MEDIUM);
    expect(result.confidence).toBe(1);
  });

  it('falls back gracefully when Gemini throws', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('network down'));

    const result = await service.classify({ description: 'trapped people', location: 'y' });

    expect(result.fallbackUsed).toBe(true);
    expect(result.category).toBe(ENUM_REPORT_CATEGORY.OTHER);
    expect(result.confidence).toBe(0);
  });

  it('falls back when the API key is missing', async () => {
    ENV.gemini.apiKey = '';
    const result = await service.classify({ description: 'flood everywhere', location: 'y' });

    expect(result.fallbackUsed).toBe(true);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
