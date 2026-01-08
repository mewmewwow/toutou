import { IsUUID, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum TestModeDto {
  NORMAL = 'normal',
  SPEED = 'speed',
  ULTIMATE = 'ultimate',
}

export class TestStartDto {
  @IsUUID()
  bookId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  unitNumber: number;

  @IsEnum(TestModeDto)
  mode: TestModeDto;

  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  moduleType: number;
}
