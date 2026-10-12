import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestEntity } from './request.entity';

export type HistoryAction =
  | 'created'
  | 'verified'
  | 'updated'
  | 'extended'
  | 'reported'
  | 'auto-hidden'
  | 'hidden'
  | 'unhidden'
  | 'approved'
  | 'reports-dismissed'
  | 'verification-resent';

/** One line of the "Verlauf" a moderator sees on a request. */
@Entity({ name: 'request_history' })
export class HistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  requestId: string;

  @ManyToOne(() => RequestEntity, (request) => request.history, {
    onDelete: 'CASCADE',
  })
  request?: RequestEntity;

  @Column({ length: 40 })
  action: HistoryAction;

  /** Name of the moderator, or null for the creator or the system. */
  @Column({ length: 200, nullable: true })
  actor: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
