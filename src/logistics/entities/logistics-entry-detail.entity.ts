import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { LogisticsEntry } from './logistics-entry.entity';
import { ClientMaster } from './client-master.entity';
import { VialMaster } from './vial-master.entity';

@Entity('logistics_entry_detail')
@Unique(['entry_id', 'client_id', 'vial_id'])
export class LogisticsEntryDetail {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @ManyToOne(() => LogisticsEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry_id: LogisticsEntry;

  @ManyToOne(() => ClientMaster)
  @JoinColumn({ name: 'client_id' })
  client_id: ClientMaster;

  @ManyToOne(() => VialMaster)
  @JoinColumn({ name: 'vial_id' })
  vial_id: VialMaster;

  @Column({ type: 'int', default: 0 })
  qty: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}