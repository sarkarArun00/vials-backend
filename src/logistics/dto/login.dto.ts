import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { UserType } from '../entities/user-master.entity';



export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  mobile_number: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserType)
  user_type: UserType;
}