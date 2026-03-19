import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, Min, ValidateNested } from 'class-validator';

export class LogisticsEntryItemDto {
  @Type(() => Number)
  @IsInt()
  clientId: number;

  @Type(() => Number)
  @IsInt()
  vialId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  qty: number;
}

export class CreateLogisticsEntryDto {
  @Type(() => Number)
  @IsInt()
  logisticsId: number;

  @IsDateString()
  entryDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogisticsEntryItemDto)
  items: LogisticsEntryItemDto[];
}