import { Module } from '@nestjs/common';
import { LoomAdminModule } from '../admin/loom-admin.module';
import { SiteController } from './site.controller';
import { SiteViewService } from './site-view.service';
import { SiteAuthGuard } from './site-auth.guard';

@Module({
  imports: [LoomAdminModule],
  controllers: [SiteController],
  providers: [SiteViewService, SiteAuthGuard],
  exports: [SiteAuthGuard, SiteViewService],
})
export class SiteModule {}
