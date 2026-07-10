import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueuesService } from './queues.service';
import { ExampleProcessor } from './example.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({ name: 'example' }),
  ],
  providers: [QueuesService, ExampleProcessor],
  exports: [QueuesService],
})
export class QueuesModule {}
