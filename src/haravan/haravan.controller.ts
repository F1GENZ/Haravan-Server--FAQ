import { Controller, Response, Get, Query, Post, Request } from '@nestjs/common';
import { HaravanService } from './haravan.service';

@Controller('/oauth/install') 
export class HaravanController {
  constructor(private readonly haravanService: HaravanService) { }

  @Get("/login")
  async login(@Query() query) {
    const { orgid } = query;
    return await this.haravanService.loginApp(orgid);
  }

  @Get("/grandservice")
  async install(@Query() query, @Response() res) {
    const { code } = query;
    await this.haravanService.installApp(code, res);
  }
  
  @Get("/webhooks")
  async webhook(@Query() query) {
    console.log(query);
    return await this.haravanService.getWebhook(query);
  }

  @Post("/webhooks")
  async postWebhook(@Request() req, @Response() res) {
    const { headers, body } = req;
    return await this.haravanService.handleWebhook(headers, body);
  }
}
