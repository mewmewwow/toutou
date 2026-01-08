import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Word } from './entities/word.entity';
import { Sentence } from './entities/sentence.entity';
import { UserBook } from './entities/user-book.entity';
import { BooksService } from './books.service';
import { WordsService } from './words.service';
import { BooksController } from './books.controller';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Word, Sentence, UserBook]),
    DevicesModule,
  ],
  controllers: [BooksController],
  providers: [BooksService, WordsService],
  exports: [BooksService, WordsService],
})
export class BooksModule {}
