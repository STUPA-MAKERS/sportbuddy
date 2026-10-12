import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestEntity } from './request.entity';

@Entity({ name: 'reports' })
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  requestId: string;

  @ManyToOne(() => RequestEntity, (request) => request.reports, {
    onDelete: 'CASCADE',
  })
  request?: RequestEntity;

  @Column({ length: 80 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  /** Keyed hash of the reporter's IP address, so one person counts once per request. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  reporterHash: string | null;

  /** A moderator dismissed the report; it no longer counts. */
  @Column({ default: false })
  dismissed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
