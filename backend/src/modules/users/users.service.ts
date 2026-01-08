import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface UpdateUserDto {
  username?: string;
  avatar?: string;
  birthday?: Date;
  pronunciationPref?: 'us' | 'uk';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Get user by phone
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { phone },
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /**
   * Update user coins
   */
  async updateCoins(id: string, amount: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    user.totalCoins += amount;
    return this.userRepository.save(user);
  }

  /**
   * Update user credits
   */
  async updateCredits(id: string, amount: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    user.totalCredits += amount;
    return this.userRepository.save(user);
  }

  /**
   * Update user level
   */
  async updateLevel(id: string, level: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    user.level = level;
    return this.userRepository.save(user);
  }
}
