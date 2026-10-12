import { Column, Entity, PrimaryColumn } from 'typeorm';

/** The moderation settings. There is exactly one row (id 1). */
@Entity({ name: 'settings' })
export class SettingsEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'int', default: 90 })
  runtimeDays: number;

  /** Open reports at which a request leaves the public list. 0 turns it off. */
  @Column({ type: 'int', default: 3 })
  autoHideThreshold: number;

  @Column({ default: false })
  reviewBeforePublish: boolean;

  @Column({ default: true })
  notifyOnReport: boolean;
}
