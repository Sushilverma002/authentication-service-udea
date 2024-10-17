import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Auth } from './entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../utils/services/mail.service';
import { LoginDto, SignUpDto } from './dtos/auth.dto';
import * as bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const saltingRound = 10;
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Auth) private authRepo: Repository<Auth>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}
  async signUp(signUpDto: SignUpDto): Promise<{
    token: string;
    name: string;
    email: string;
    _id: ObjectId;
  }> {
    try {
      const { name, email, password } = signUpDto;

      let userExist = await this.userRepo.findOneBy({ email: email });

      if (userExist) {
        throw new ConflictException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, saltingRound);

      const user = await this.userRepo.create({
        name,
        email,
        password: hashedPassword,
      });
      await this.userRepo.save(user);

      const token = this.jwtService.sign({ _id: user._id });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
      };
    } catch (error) {
      console.log('Error in Creating User:', error);
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException();
    }
  }

  async login(loginDto: LoginDto): Promise<{
    token: string;
    email: string;
    _id: ObjectId;
  }> {
    try {
      const { email, password } = loginDto;

      const user = await this.userRepo.findOneBy({ email });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordMatched = await bcrypt.compare(password, user.password);

      if (!isPasswordMatched) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const token = this.jwtService.sign({ id: user._id });

      return {
        _id: user._id,
        email: user.email,
        token: token,
      };
    } catch (error) {
      console.log('Error in Login User:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async forgetPassword(email: string) {
    try {
      //Check that user exists
      const user = await this.userRepo.findOneBy({ email });
      if (!user) {
        throw new NotFoundException('user not Found.');
      } else {
        //If user exists, generate password reset link
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        const resetToken = uuidv4();

        const authEntry = this.authRepo.create({
          userId: user._id, // Use user.id instead of user._id if using TypeORM
          token: resetToken,
          expiryDate,
        });

        // Save the Auth entity to the database
        await this.authRepo.save(authEntry);

        //Send the link to the user by email
        const resetLink = `${process.env.BASE_URL}auth/set-new-password/${resetToken}`;
        const mailbody = {
          to: email,
          subject: 'Password Reset Request',
          html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`,
        };
        this.mailService.mailer(mailbody);
        return { message: 'If this user exists, they will receive an email' };
      }
    } catch (error) {
      console.log('Error in Forget Password:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async resetPassword(newPassword: string, accessToken: string) {
    try {
      // Find the latest token details in the database
      const tokenDetails = await this.authRepo.findOne({
        where: {
          token: accessToken,
          expiryDate: { $gte: new Date() } as any,
        },
        order: {
          created_at: 'DESC',
        },
      });

      if (!tokenDetails) {
        throw new UnauthorizedException('Invalid link');
      }

      // Optionally check if the token is expired
      if (tokenDetails.expiryDate < new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      // Convert userId to ObjectId and find the user
      const userId = new ObjectId(tokenDetails.userId);
      const user = await this.userRepo.findOne({
        where: { _id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found or invalid token');
      }

      // Hash the new password
      user.password = await bcrypt.hash(newPassword, 10);

      // Save the updated user and delete the token
      await this.userRepo.save(user);
      await this.authRepo.delete({ _id: tokenDetails._id });

      return { message: 'Password has been successfully reset' };
    } catch (error) {
      console.error('Error in Reset Password:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
