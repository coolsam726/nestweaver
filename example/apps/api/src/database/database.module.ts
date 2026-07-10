import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './company.schema';
import { User, UserSchema } from './user.schema';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL!),
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
