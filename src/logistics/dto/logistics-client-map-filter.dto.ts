import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class LogisticsClientMapFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  logisticsId?: number;
}