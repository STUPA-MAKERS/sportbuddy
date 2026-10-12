import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Someone who signed in with the admin group. Recorded at login, because the IdP
 * offers no list of the group's members; removed when they sign in without it.
 */
@Entity({ name: 'moderators' })
export class ModeratorEntity {
  /** The IdP's `sub`. */
  @PrimaryColumn({ length: 255 })
  sub: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string | null;

  /** Gets moderation emails (new reports). */
  @Column({ default: true })
  notify: boolean;

  @Column({ type: 'timestamptz' })
  lastLoginAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
