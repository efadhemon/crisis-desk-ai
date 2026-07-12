import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

const handlers = [];

@Global()
@Module({
  imports: [CqrsModule.forRoot()],
  providers: [...handlers],
  exports: [],
})
export class EventModule {}
