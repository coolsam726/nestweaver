import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LoomService } from '@nestweaver/loom';
import { buildDemoCompanies } from '../database/companies.seed';

const DEFAULT_DEMO_COMPANY_COUNT = 70;

@Injectable()
export class DemoSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(private readonly loom: LoomService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;
    if (process.env.SEED_DEMO === 'false') return;

    const target = Number(process.env.DEMO_COMPANY_COUNT ?? DEFAULT_DEMO_COMPANY_COUNT);
    if (!Number.isFinite(target) || target <= 0) return;

    const { total: existing } = await this.loom.list('companies', { page: 1, perPage: 1 });
    if (existing >= target) return;

    const toCreate = buildDemoCompanies(target - existing);
    for (const data of toCreate) {
      await this.loom.create('companies', { ...data });
    }

    this.logger.log(`Seeded ${toCreate.length} demo companies (${existing + toCreate.length} total)`);
  }
}
