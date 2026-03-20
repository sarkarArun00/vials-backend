import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LogisticsPerson } from './logistics-person.entity';


export enum UserType {
  ADMIN = 'ADMIN',
  LOGISTICS = 'LOGISTICS',
}

@Entity({ name: 'user_master' })
export class UserMaster {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  mobile_number: string;

  @Column({ type: 'text' })
  password_hash: string;


  @Column({ type: 'varchar', length: 20 })
  user_type: UserType;

  @Column({ type: 'int', nullable: true })
  logistics_person_id: number | null;

  @ManyToOne(() => LogisticsPerson, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'logistics_person_id' })
  logisticsPerson: LogisticsPerson | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}