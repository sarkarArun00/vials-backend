import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './jwt.strategy';
import { UserMaster } from 'src/logistics/entities/user-master.entity';
import { LogisticsPerson } from 'src/logistics/entities/logistics-person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserMaster, LogisticsPerson]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}