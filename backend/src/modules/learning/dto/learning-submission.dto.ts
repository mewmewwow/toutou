import { IsUUID, IsInt, Min, Max, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class LearningSubmissionDto {
  @IsUUID()
  wordId: string;

  @IsInt()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  rating: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  responseTimeMs: number;

  @IsOptional()
  @IsString()
  userAnswer?: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}
