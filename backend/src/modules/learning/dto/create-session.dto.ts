import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @IsUUID()
  bookId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  unitNumber: number;

  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  moduleType: number;
}
