import { Entity, Enum, PrimaryKey, Property, Unique } from '@mikro-orm/core';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity()
export class User {
  @PrimaryKey()
  id: string;

  @Property()
  @Unique()
  email: string;

  @Property({ hidden: true })
  password: string;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property({ hidden: true })
  @Enum(() => UserStatus)
  userStatus: UserStatus;

  @Property({ hidden: true })
  createdAt: Date = new Date();

  @Property({ hidden: true })
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
