import { SetMetadata } from '@nestjs/common';

export const MAX_QUERY_LIMIT = 'maxQueryLimit';

export const MaxQueryLimit: (limit: number) => ReturnType<typeof SetMetadata> = (limit) =>
  SetMetadata(MAX_QUERY_LIMIT, limit);
