import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserMaster, UserType } from 'src/logistics/entities/user-master.entity';
import { LoginDto } from 'src/logistics/dto/login.dto';
import { LogisticsPerson } from 'src/logistics/entities/logistics-person.entity';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserMaster)
    private readonly userRepo: Repository<UserMaster>,

    @InjectRepository(LogisticsPerson)
    private readonly logisticsRepo: Repository<LogisticsPerson>,
  
    private readonly jwtService: JwtService,
    
  ) { }

  async login(loginDto: LoginDto) {
    const { mobile_number, password, user_type } = loginDto;

    const user = await this.userRepo.findOne({
      where: {
        mobile_number,
        user_type,
        is_active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid mobile number, password, or user type',
      );
    }

    const isPasswordMatched = await bcrypt.compare(
      password,
      user.password_hash,
    );
    console.log('isPasswordMatched:', isPasswordMatched);
    if (!isPasswordMatched) {
      throw new UnauthorizedException(
        'Invalid mobile number, password, or user type',
      );
    }

    const payload = {
      sub: user.id,
      mobile_number: user.mobile_number,
      user_type: user.user_type,
      logistics_person_id: user.logistics_person_id,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      status: 1,
      message: 'Login successful',
      data: {
        access_token,
        user: {
          id: user.id,
          mobile_number: user.mobile_number,
          user_type: user.user_type,
          logistics_person_id: user.logistics_person_id,
        },
      },
    };
  }

  async regenerateLogisticsPassword(logisticsId: number) {
  const logistics = await this.logisticsRepo.findOne({
    where: { id: logisticsId },
  });

  if (!logistics) {
    throw new NotFoundException('Logistics not found');
  }

  const user = await this.userRepo.findOne({
    where: {
      logistics_person_id: logisticsId,
      user_type: UserType.LOGISTICS,
    },
  });

  if (!user) {
    throw new NotFoundException('Login account not found for this logistics');
  }

  const randomNumber = Math.floor(100 + Math.random() * 900);
  const newPassword = `Nirnayan@${randomNumber}`;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password_hash = hashedPassword;
  await this.userRepo.save(user);

  return {
    status: 1,
    message: 'Password regenerated successfully',
    data: {
      logistics_id: logistics.id,
      logistics_name: logistics.name,
      mobile_number: user.mobile_number,
      password: newPassword,
    },
  };
}
}