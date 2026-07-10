import {
  DynamicModule,
  Module,
  Type,
} from '@nestjs/common';
import { HealthController } from './health.controller';
import { SsrFallbackController } from './ssr-fallback.controller';

@Module({})
export class AppModule {
  static register(): DynamicModule {
    const isProduction = process.env.NODE_ENV === 'production';

    const controllers: Type[] = [HealthController];

    if (isProduction) {
      controllers.push(SsrFallbackController);
    }

    return {
      module: AppModule,
      controllers,
    };
  }
}
