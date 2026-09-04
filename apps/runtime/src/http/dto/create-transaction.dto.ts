import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateTransactionLineDto {
  @IsString()
  @MinLength(1)
  catalogueItemId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  selectionsJson?: unknown;
}

/** Guest POST /transactions — whitelist + forbidNonWhitelisted at the pipe. */
export class CreateTransactionDto {
  @IsString()
  @MinLength(1)
  sessionId!: string;

  @IsOptional()
  @IsString()
  participantId?: string;

  @IsString()
  @MinLength(1)
  participantSecret!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionLineDto)
  lines!: CreateTransactionLineDto[];
}
