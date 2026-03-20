import { PartialType } from '@nestjs/mapped-types';
import { CreateLogisticsMasterDto } from './create-logistics-master.dto';

export class UpdateLogisticsMasterDto extends PartialType(CreateLogisticsMasterDto) {}