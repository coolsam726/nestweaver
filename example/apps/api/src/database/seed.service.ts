import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildDemoCompanies } from './companies.seed';
import { Company, type CompanyDocument } from './company.schema';

const DEFAULT_DEMO_COMPANY_COUNT = 70;

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Company.name) private readonly companies: Model<CompanyDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    if (process.env.SEED_DEMO === 'false') {
      return;
    }

    const target = Number(process.env.DEMO_COMPANY_COUNT ?? DEFAULT_DEMO_COMPANY_COUNT);
    if (!Number.isFinite(target) || target <= 0) {
      return;
    }

    const existing = await this.companies.countDocuments();
    if (existing >= target) {
      return;
    }

    const toCreate = buildDemoCompanies(target - existing);
    await this.companies.insertMany(toCreate);

    this.logger.log(
      `Seeded ${toCreate.length} demo companies (${existing + toCreate.length} total)`,
    );
  }
}
