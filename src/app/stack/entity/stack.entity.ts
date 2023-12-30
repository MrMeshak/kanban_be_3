import {
  Collection,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { Board } from 'src/app/board/entity/board.entity';
import { Task } from 'src/app/task/entity/task.entity';

export class Stack {
  @PrimaryKey()
  id: string;

  @Property()
  title: string;

  @Property()
  createAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date;

  @ManyToOne({ entity: () => Board, strategy: LoadStrategy.JOINED })
  board: Board;

  @OneToMany(() => Task, (task) => task.stack)
  tasks = new Collection<Task>(this);
}
