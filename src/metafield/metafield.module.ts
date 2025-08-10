import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetafieldController } from './metafield.controller';
import { MetafieldService } from './metafield.service';
import { MetafieldCronService } from './metafield.cron';
import { HaravanModule } from '../haravan/haravan.module';

@Module({
  imports: [HttpModule, HaravanModule],
  controllers: [MetafieldController],
  providers: [MetafieldService, MetafieldCronService]
})
export class MetafieldModule {}
  