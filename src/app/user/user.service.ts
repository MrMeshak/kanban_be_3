import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { User, UserStatus } from './entity/user.entity';
import { EntityRepository } from '@mikro-orm/mysql';
import { SignupDto } from '../auth/dto/signup.dto';
import { AlreadyExistsError } from 'src/utils/base/errors';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async findUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({ id: userId });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ email: email });
  }

  async createUser(data: SignupDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      email: data.email,
    });
    if (existingUser) {
      throw new AlreadyExistsError('User account already exists, please login');
    }

    const hashPassword = await bcrypt.hash(data.password, 10);

    const user: User = plainToInstance(User, {
      ...data,
      id: randomUUID(),
      password: hashPassword,
      userStatus: UserStatus.ACTIVE,
    });

    await this.userRepository.getEntityManager().persistAndFlush(user);

    return user;
  }
}
