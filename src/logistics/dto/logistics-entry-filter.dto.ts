import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class LogisticsEntryFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  logisticsId?: number;

  @IsOptional()
  @IsDateString()
  entryDate?: string;
}