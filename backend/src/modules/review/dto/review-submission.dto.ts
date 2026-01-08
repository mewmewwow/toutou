import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewSubmissionDto {
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  rating: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  responseTimeMs: number;
}
