import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BooksService, BookListItem, BookDetail } from './books.service';
import { WordsService, WordWithSentences } from './words.service';
import { GuestAuthGuard } from '../../common/guards/guest-auth.guard';
import { UnitAccessGuard } from './guards/unit-access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberType } from '../users/entities/user.entity';
import { UserBook } from './entities/user-book.entity';

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
   * GET /books/current
   * Get user's current selected book
   */
  @Get('current')
  @UseGuards(GuestAuthGuard)
  async getCurrentBook(@CurrentUser() user: RequestUser): Promise<UserBook | null> {
    return this.booksService.getCurrentBook(user.id);
  }

  /**
   * GET /books/:bookId
   * Get book details with unit information
   * Unit accessibility depends on user membership
   * This endpoint is publicly accessible, memberType defaults to GUEST
   */
  @Get(':bookId')
  async getBookDetail(
    @Param('bookId', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) bookId: string,
  ): Promise<BookDetail> {
    // 公开访问时，默认以游客身份查看
    return this.booksService.getBookDetail(bookId, MemberType.GUEST);
  }

  /**
   * POST /books/:bookId/select
   * Select a book as the current learning book
   */
  @Post(':bookId/select')
  @UseGuards(GuestAuthGuard)
  async selectBook(
    @Param('bookId', new ParseUUIDPipe({ errorHttpStatusCode: 400 })) bookId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string; userBook: UserBook }> {
    // 验证词书存在
    const book = await this.booksService.findById(bookId);
    if (!book) {
      throw new NotFoundException({
        code: 'BOOK_NOT_FOUND',
        message: '未找到该词书',
      });
    }

    const userBook = await this.booksService.setCurrentBook(user.id, bookId);
    return {
      message: '词书选择成功',
      userBook,
    };
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

