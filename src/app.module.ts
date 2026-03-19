


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogisticsModule } from './logistics/logistics.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '91.108.104.62',
      port: 5432,
      username: 'postgres',
      password: 'Gold@4nirnayan_it!',
      database: 'vials_tracking',
      autoLoadEntities: true,
      synchronize: false,
      logging: true
    }),
    LogisticsModule,
  ],
})
export class AppModule {}