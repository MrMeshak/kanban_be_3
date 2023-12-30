import { LoadStrategy, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { Stack } from 'src/app/stack/entity/stack.entity';

export class Task {
  @PrimaryKey()
  id: string;

  @Property()
  title: string;

  @Property()
  description: string;

  @Property()
  createAt: Date = new Date();

  @Property({ onUpdate: () => Date.now })
  updatedAt: Date = new Date();

  @ManyToOne({ entity: () => Stack, strategy: LoadStrategy.JOINED })
  stack: Stack;
}
