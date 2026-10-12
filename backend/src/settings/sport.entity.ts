import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sports' })
export class SportEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80, unique: true })
  name: string;

  /** Name of a Material Symbol, see the icon list of the frontend. */
  @Column({ length: 60, default: 'sports' })
  icon: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  /** An inactive sport is not offered for new requests and has no filter chip. */
  @Column({ default: true })
  active: boolean;
}
