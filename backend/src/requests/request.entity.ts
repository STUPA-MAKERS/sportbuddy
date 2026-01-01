import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity({ name: 'requests' })
export class RequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  title: string;

  @Index()
  @Column({ length: 80 })
  sport: string;

  @Column({ type: 'text' })
  description: string;

  @Index({ unique: true })
  @Column({ length: 128 })
  editToken: string;

  @Index({ unique: true })
  @Column({ length: 128 })
  deleteToken: string;

  @Index()
  @Column({ length: 200 })
  contactEmail: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;
}


