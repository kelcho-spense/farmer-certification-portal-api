import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities';
import { RegisterDto, LoginDto, CreateAdminDto } from './dto';
import { UserRole } from '../common/enums';
import { Tokens, JwtPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ tokens: Tokens; user: Partial<User> }> {
    const { email, password, name, farmSize, cropType } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashData(password);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      farmSize,
      cropType,
      role: UserRole.FARMER,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { tokens, user: this.excludeSensitiveFields(user) };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ tokens: Tokens; user: Partial<User> }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { tokens, user: this.excludeSensitiveFields(user) };
  }

  async createAdmin(
    createAdminDto: CreateAdminDto,
  ): Promise<{ tokens: Tokens; user: Partial<User> }> {
    const { email, password, name } = createAdminDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashData(password);

    // Create admin user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: UserRole.ADMIN,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { tokens, user: this.excludeSensitiveFields(user) };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.userRepository.update(userId, { hashedRefreshToken: null });
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access denied');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async validateUser(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Helper methods
  private excludeSensitiveFields(
    user: User,
  ): Omit<User, 'password' | 'hashedRefreshToken'> {
    const { password, hashedRefreshToken, ...safeUser } = user;
    void password;
    void hashedRefreshToken;
    return safeUser;
  }

  private getOrThrow<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined || value === null) {
      throw new Error(`${key} is not defined in environment variables`);
    }
    return value;
  }

  private async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessExpiresIn = parseInt(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS') ?? '900',
      10,
    );
    const refreshExpiresIn = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_SECONDS') ??
        '604800',
      10,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.userRepository.update(userId, { hashedRefreshToken });
  }
}
