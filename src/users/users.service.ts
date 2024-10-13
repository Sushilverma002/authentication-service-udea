import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getAll() {
    return this.userRepo.find({
      select: ['_id', 'name', 'email', 'created_at', 'updated_at'], // Add the fields you want to retrieve, excluding 'password'
    });
  }
}
