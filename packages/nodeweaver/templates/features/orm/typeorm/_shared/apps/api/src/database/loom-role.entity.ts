import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('loom_roles')
export class LoomRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  active!: boolean;

  @Column('simple-array', { nullable: true })
  permissionIds?: string[];
}
