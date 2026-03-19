import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreateLogisticsClientMapDto {
  @Type(() => Number)
  @IsInt()
  logisticsId: number;

  @Type(() => Number)
  @IsInt()
  clientId: number;
}