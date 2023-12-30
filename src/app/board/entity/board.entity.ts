import { Collection, OneToMany } from '@mikro-orm/core';
import { Stack } from 'src/app/stack/entity/stack.entity';

export class Board {
  title: string;

  @OneToMany(() => Stack, (stack) => stack.board)
  stacks = new Collection<Stack>(this);
}
