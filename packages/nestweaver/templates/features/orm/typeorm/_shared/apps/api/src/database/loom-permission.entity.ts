import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('loom_permissions')
export class LoomPermission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column()
  resource!: string;

  @Column()
  ability!: string;

  @Column({ nullable: true })
  label?: string;
}
