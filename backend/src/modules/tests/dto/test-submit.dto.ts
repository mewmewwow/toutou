import { IsInt, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  [questionId: string]: string;
}

export class TestSubmitDto {
  @IsObject()
  answers: Record<string, string>;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  timeTakenMs: number;
}
