import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'blocked_emails' })
export class BlockedEmailEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** A full address, or `*@domain` for a whole domain. Stored lower case. */
  @Column({ length: 200, unique: true })
  pattern: string;

  @Column({ length: 120, nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
