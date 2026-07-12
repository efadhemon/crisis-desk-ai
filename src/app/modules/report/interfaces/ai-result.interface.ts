import { ENUM_REPORT_CATEGORY, ENUM_REPORT_URGENCY } from '../enums';

export interface IAiClassification {
  category: ENUM_REPORT_CATEGORY;
  urgency: ENUM_REPORT_URGENCY;
  summary: string;
  suggestedAction: string;
  confidence: number;
  /** True when Gemini failed and safe fallback values were used. */
  fallbackUsed: boolean;
}
