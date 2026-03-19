import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { LogisticsPerson } from './entities/logistics-person.entity';
import { ClientMaster } from './entities/client-master.entity';
import { LogisticsClientMap } from './entities/logistics-client-map.entity';
import { VialMaster } from './entities/vial-master.entity';
import { LogisticsEntry } from './entities/logistics-entry.entity';
import { LogisticsEntryDetail } from './entities/logistics-entry-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LogisticsPerson,
      ClientMaster,
      LogisticsClientMap,
      VialMaster,
      LogisticsEntry,
      LogisticsEntryDetail,
    ]),
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}