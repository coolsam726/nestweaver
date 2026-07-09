import { Controller, Get, Render } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get()
  @Render('admin/index')
  dashboard() {
    return {
      title: 'Admin Dashboard',
      message: 'Handlebars MVC admin is running.',
    };
  }
}
