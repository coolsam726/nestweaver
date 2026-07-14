import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  password?: string;

  @Column('simple-array', { nullable: true })
  roleIds?: string[];

  @Column({ default: 0 })
  sessionVersion!: number;

  /** Companies this user may switch into (Loom tenancy membership) */
  @Column('simple-array', { nullable: true })
  companyIds?: string[];

  @Column({ nullable: true })
  companyId?: number;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
