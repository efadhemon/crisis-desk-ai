import { SetMetadata } from '@nestjs/common';

export const SKIP_KEY_CHECK = 'skipKeyCheck';

export const SkipKeyCheck: () => ReturnType<typeof SetMetadata> = () =>
  SetMetadata(SKIP_KEY_CHECK, true);
