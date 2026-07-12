import { SetMetadata } from '@nestjs/common';

export const PermissionChecker = (...permissions: string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata('permissions', permissions);
