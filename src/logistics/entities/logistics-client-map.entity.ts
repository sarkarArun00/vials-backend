import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { LogisticsPerson } from './logistics-person.entity';
import { ClientMaster } from './client-master.entity';

@Entity('logistics_client_map')
@Unique(['logistics_id', 'client_id'])
export class LogisticsClientMap {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LogisticsPerson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'logistics_id' })
  logistics_id: LogisticsPerson;

  @ManyToOne(() => ClientMaster, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client_id: ClientMaster;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}