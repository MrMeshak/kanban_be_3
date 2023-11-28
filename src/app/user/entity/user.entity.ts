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

  @Property()
  password: string;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Enum(() => UserStatus)
  userStatus: UserStatus;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
