import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { UserBook } from './entities/user-book.entity';
import { MemberType } from '../users/entities/user.entity';

export interface BookListItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  totalWords: number;
  totalUnits: number;
  isFree: boolean;
  coverImage: string | null;
}

export interface UnitInfo {
  number: number;
  wordCount: number;
  isAccessible: boolean;
}

export interface BookDetail extends BookListItem {
  units: UnitInfo[];
}

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(UserBook)
    private readonly userBookRepository: Repository<UserBook>,
  ) {}

  /**
   * Get all books, optionally filtered by isFree
   */
  async findAll(isFree?: boolean): Promise<BookListItem[]> {
    const query = this.bookRepository.createQueryBuilder('book');

    if (isFree !== undefined) {
      query.where('book.is_free = :isFree', { isFree });
    }

    query.orderBy('book.sort_order', 'ASC');

    const books = await query.getMany();

    return books.map((book) => ({
      id: book.id,
      name: book.name,
      code: book.code,
      description: book.description,
      totalWords: book.totalWords,
      totalUnits: book.totalUnits,
      isFree: book.isFree,
      coverImage: book.coverImage,
    }));
  }

  /**
   * Get book by ID
   */
  async findById(bookId: string): Promise<Book | null> {
    return this.bookRepository.findOne({
      where: { id: bookId },
    });
  }

  /**
   * Get book details with unit information
   * Accessibility is determined by user membership
   */
  async getBookDetail(
    bookId: string,
    memberType: MemberType = MemberType.GUEST,
  ): Promise<BookDetail> {
    const book = await this.bookRepository.findOne({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException({
        code: 'BOOK_NOT_FOUND',
        message: '未找到该词书',
      });
    }

    // Get word counts per unit using raw query for efficiency
    const unitStats = await this.bookRepository.manager.query(
      `
      SELECT unit_number, COUNT(*) as word_count
      FROM words
      WHERE book_id = $1
      GROUP BY unit_number
      ORDER BY unit_number
    `,
      [bookId],
    );

    // Build units array with accessibility information
    const units: UnitInfo[] = unitStats.map((stat: any) => ({
      number: parseInt(stat.unit_number, 10),
      wordCount: parseInt(stat.word_count, 10),
      isAccessible: this.isUnitAccessible(
        parseInt(stat.unit_number, 10),
        memberType,
        book.isFree,
      ),
    }));

    return {
      id: book.id,
      name: book.name,
      code: book.code,
      description: book.description,
      totalWords: book.totalWords,
      totalUnits: book.totalUnits,
      isFree: book.isFree,
      coverImage: book.coverImage,
      units,
    };
  }

  /**
   * Determine if a unit is accessible based on membership
   * - Guests can only access Unit 1
   * - Free members can access all units of free books, Unit 1 of paid books
   * - Trial/Paid members can access all units
   */
  isUnitAccessible(
    unitNumber: number,
    memberType: MemberType,
    isFreeBook: boolean,
  ): boolean {
    // Paid or trial members have full access
    if (memberType === MemberType.PAID || memberType === MemberType.TRIAL) {
      return true;
    }

    // Free members have access to free books and Unit 1 of any book
    if (memberType === MemberType.FREE) {
      return isFreeBook || unitNumber === 1;
    }

    // Guests can only access Unit 1
    return unitNumber === 1;
  }

  /**
   * Get or create user book progress
   */
  async getOrCreateUserBook(userId: string, bookId: string): Promise<UserBook> {
    let userBook = await this.userBookRepository.findOne({
      where: { userId, bookId },
    });

    if (!userBook) {
      userBook = this.userBookRepository.create({
        userId,
        bookId,
        isCurrent: true,
        unitProgress: {},
      });
      await this.userBookRepository.save(userBook);
    }

    return userBook;
  }

  /**
   * Set current book for user
   */
  async setCurrentBook(userId: string, bookId: string): Promise<UserBook> {
    // Unset current book for all other books
    await this.userBookRepository.update(
      { userId, isCurrent: true },
      { isCurrent: false },
    );

    // Get or create user book and set as current
    const userBook = await this.getOrCreateUserBook(userId, bookId);
    userBook.isCurrent = true;
    return this.userBookRepository.save(userBook);
  }

  /**
   * Get user's current book
   */
  async getCurrentBook(userId: string): Promise<UserBook | null> {
    return this.userBookRepository.findOne({
      where: { userId, isCurrent: true },
      relations: ['book'],
    });
  }
}
