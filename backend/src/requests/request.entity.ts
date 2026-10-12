import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportEntity } from './report.entity';
import { HistoryEntity } from './history.entity';

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

  @Column({ length: 32, nullable: true })
  knowledgeLevel: string | null;

  @Column({ length: 32, nullable: true })
  gender: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Index({ unique: true })
  @Column({ length: 128 })
  editToken: string;

  /** Older emails link a separate delete token; it opens the same manage page. */
  @Index({ unique: true })
  @Column({ length: 128 })
  deleteToken: string;

  @Index({ unique: true })
  @Column({ length: 128, nullable: true })
  verifyToken: string | null;

  @Index()
  @Column({ length: 200 })
  contactEmail: string;

  /** The creator confirmed the email address. */
  @Column({ default: false })
  active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationSentAt: Date | null;

  @Column({ type: 'int', default: 0 })
  verificationResends: number;

  /** Confirmed, but waits for a moderator (setting "review before publishing"). */
  @Column({ default: false })
  pendingReview: boolean;

  @Index()
  @Column({ default: false })
  hidden: boolean;

  @Column({ length: 80, nullable: true })
  hiddenReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  hiddenAt: Date | null;

  // Plain timestamps as before: changing the column type would make TypeORM drop the data.
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @OneToMany(() => ReportEntity, (report) => report.request)
  reports?: ReportEntity[];

  @OneToMany(() => HistoryEntity, (entry) => entry.request)
  history?: HistoryEntity[];
}
