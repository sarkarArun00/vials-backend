import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClientMasterController } from './client-master.controller';
import { ClientMasterService } from './client-master.service';
import { ClientMaster } from 'src/logistics/entities/client-master.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientMaster])],
  controllers: [ClientMasterController],
  providers: [ClientMasterService],
  exports: [ClientMasterService],
})
export class ClientMasterModule {}