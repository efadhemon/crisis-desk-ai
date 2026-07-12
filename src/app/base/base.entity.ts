import { ENUM_COLUMN_TYPES } from '@src/shared';
import { ClsServiceManager } from 'nestjs-cls';
import {
  BeforeInsert,
  BeforeSoftRemove,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: ENUM_COLUMN_TYPES.BOOLEAN, default: true })
  isActive?: boolean;

  @CreateDateColumn({ type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC })
  createdAt?: Date;

  @UpdateDateColumn({ type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC })
  updatedAt?: Date;

  @DeleteDateColumn({ type: ENUM_COLUMN_TYPES.TIMESTAMP_UTC, select: false })
  deletedAt?: Date;

  @Column({ type: ENUM_COLUMN_TYPES.JSONB, nullable: true, default: null })
  createdBy?: any;

  @Column({ type: ENUM_COLUMN_TYPES.JSONB, nullable: true, default: null })
  updatedBy?: any;

  @Column({ type: ENUM_COLUMN_TYPES.JSONB, nullable: true, select: false, default: null })
  deletedBy?: any;

  @BeforeInsert()
  setCreateAudit?(): void {
    const user = ClsServiceManager.getClsService()?.get('authUser');
    if (user?.id) {
      this.createdBy = user;
    }
  }

  @BeforeUpdate()
  setUpdateAudit?(): void {
    const user = ClsServiceManager.getClsService()?.get('authUser');
    if (user?.id) {
      this.updatedBy = user;
    }
  }

  @BeforeSoftRemove()
  setDeleteAudit?(): void {
    const user = ClsServiceManager.getClsService()?.get('authUser');
    if (user?.id) {
      this.deletedBy = user;
    }
  }
}
