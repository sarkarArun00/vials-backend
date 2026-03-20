import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientMasterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  client_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  client_code?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}