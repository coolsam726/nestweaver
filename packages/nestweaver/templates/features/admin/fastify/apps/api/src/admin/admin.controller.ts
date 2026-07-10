import { Controller, Get, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

@Controller('admin')
export class AdminController {
  @Get()
  dashboard(@Res() reply: FastifyReply): void {
    void reply.view('admin/index.hbs', {
      title: 'Admin Dashboard',
      message: 'Handlebars MVC admin is running.',
    });
  }
}
