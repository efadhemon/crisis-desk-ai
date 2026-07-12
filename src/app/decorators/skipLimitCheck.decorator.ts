import { SetMetadata } from '@nestjs/common';

export const SKIP_LIMIT_CHECK = 'skipLimitCheck';

export const SkipLimitCheck: () => ReturnType<typeof SetMetadata> = () =>
  SetMetadata(SKIP_LIMIT_CHECK, true);
