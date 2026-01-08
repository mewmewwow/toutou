import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from './entities/card.entity';
import { Revlog } from './entities/revlog.entity';
import { FsrsService } from './fsrs.service';
import { CardService } from './card.service';
import { RevlogService } from './revlog.service';

@Module({
  imports: [TypeOrmModule.forFeature([Card, Revlog])],
  providers: [FsrsService, CardService, RevlogService],
  exports: [FsrsService, CardService, RevlogService, TypeOrmModule],
})
export class FsrsModule {}
