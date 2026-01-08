import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { Certificate } from './entities/certificate.entity';
import { User } from '../users/entities/user.entity';
import { CoinService } from './coin.service';
import { MedalService } from './medal.service';
import { StreakService } from './streak.service';
import { CertificateService } from './certificate.service';
import { RewardsController } from './rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CoinTransaction, Certificate, User])],
  controllers: [RewardsController],
  providers: [CoinService, MedalService, StreakService, CertificateService],
  exports: [CoinService, MedalService, StreakService, CertificateService],
})
export class RewardsModule {}
