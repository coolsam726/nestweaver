import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bullmq';

@Injectable()
export class QueuesService implements OnModuleInit {
  private readonly logger = new Logger(QueuesService.name);

  constructor(@InjectQueue('example') private readonly exampleQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.exampleQueue.add('bootstrap', { at: new Date().toISOString() });
    this.logger.log('Enqueued bootstrap job on example queue');
  }

  async enqueue(name: string, data: Record<string, unknown>): Promise<void> {
    await this.exampleQueue.add(name, data);
  }
}
