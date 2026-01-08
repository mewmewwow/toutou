import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { BooksService, BookListItem, BookDetail } from './books.service';
import { WordsService, WordWithSentences } from './words.service';
import { GuestAuthGuard } from '../../common/guards/guest-auth.guard';
import { UnitAccessGuard } from './guards/unit-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberType } from '../users/entities/user.entity';

interface BookQueryParams {
  isFree?: string;
}

interface RequestUser {
  id: string;
  isGuest: boolean;
  memberType?: MemberType;
}

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly wordsService: WordsService,
  ) {}

  /**
   * GET /books
   * List all vocabulary books
   * Optional filter: ?isFree=true|false
   */
  @Get()
  async listBooks(@Query() query: BookQueryParams): Promise<BookListItem[]> {
    let isFree: boolean | undefined;

    if (query.isFree !== undefined) {
      if (query.isFree === 'true') {
        isFree = true;
      } else if (query.isFree === 'false') {
        isFree = false;
      }
    }

    return this.booksService.findAll(isFree);
  }

  /**
   * GET /books/:bookId
   * Get book details with unit information
   * Unit accessibility depends on user membership
   */
  @Get(':bookId')
  @UseGuards(GuestAuthGuard)
  async getBookDetail(
    @Param('bookId', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) bookId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<BookDetail> {
    const memberType = user?.memberType || MemberType.GUEST;
    return this.booksService.getBookDetail(bookId, memberType);
  }

  /**
   * GET /books/:bookId/units/:unitNumber/words
   * Get all words for a specific unit
   * Access controlled by membership level
   */
  @Get(':bookId/units/:unitNumber/words')
  @UseGuards(GuestAuthGuard, UnitAccessGuard)
  async getUnitWords(
    @Param('bookId', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) bookId: string,
    @Param('unitNumber', new ParseIntPipe({ errorHttpStatusCode: 400 })) unitNumber: number,
  ): Promise<WordWithSentences[]> {
    if (unitNumber < 1) {
      throw new BadRequestException({
        code: 'INVALID_UNIT_NUMBER',
        message: '单元号必须大于0',
      });
    }

    return this.wordsService.getWordsByUnit(bookId, unitNumber);
  }
}
