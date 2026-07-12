import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { SUPPORTED_LANGUAGES } from '@src/shared/constants/common.constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AppLanguageInterceptor implements NestInterceptor {
  private readonly supportedLanguages = SUPPORTED_LANGUAGES;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Default to 'en' if not provided
    const lang = request?.query?.language || request?.headers['x-language'] || 'en';

    return next.handle().pipe(map((data) => this.replaceWithLanguage(data, lang)));
  }

  private replaceWithLanguage(obj: any, lang: string): any {
    // Handle primitive types
    if (!obj || typeof obj !== 'object') return obj;

    // Handle Date objects
    if (obj instanceof Date) return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceWithLanguage(item, lang));
    }

    const result: any = {};

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      // Check if key ends with language suffix
      const currentLangSuffix = `_${lang}`;
      const hasCurrentLangSuffix = key.endsWith(currentLangSuffix);

      // Check if key ends with any other language suffix
      const hasOtherLangSuffix = this.supportedLanguages
        .filter((l) => l !== lang)
        .some((l) => key.endsWith(`_${l}`));

      if (hasOtherLangSuffix) {
        // Skip properties with other language suffixes
        continue;
      } else if (hasCurrentLangSuffix) {
        // Remove current language suffix from key
        const newKey = key.slice(0, -currentLangSuffix.length);
        result[newKey] = this.replaceWithLanguage(obj[key], lang);
      } else {
        // Keep the key as is and recurse into nested objects
        result[key] = this.replaceWithLanguage(obj[key], lang);
      }
    }

    return result;
  }
}
