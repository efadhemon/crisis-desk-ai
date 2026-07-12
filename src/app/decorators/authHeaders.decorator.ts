import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export const AuthHeaders = (): ReturnType<typeof applyDecorators> => {
  return applyDecorators(
    ApiHeader({
      name: 'authorization',
      required: false,
    }),
    // ApiHeader({
    //   name: 'x-api-key',
    //   required: false,
    //   description: 'a828defd12caf57100bfcd0fd94cccb1',
    // }),
    // ApiHeader({
    //   name: 'x-api-secret',
    //   required: false,
    //   description: '2ab360862a65f24651ad8c2e6f269511a76e32e2dcd12cc404d9e25048686c40',
    // }),
  );
};
