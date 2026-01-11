import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Word } from './entities/word.entity';
import { Sentence } from './entities/sentence.entity';
import { UserBook } from './entities/user-book.entity';
import { BooksService } from './books.service';
import { WordsService } from './words.service';
import { BooksController } from './books.controller';
import { DevicesModule } from '../devices/devices.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Word, Sentence, UserBook]),
    DevicesModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [BooksController],
  providers: [BooksService, WordsService],
  exports: [BooksService, WordsService],
})
export class BooksModule {}
