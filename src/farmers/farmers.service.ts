import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities';
import { UpdateFarmerStatusDto } from './dto';
import { UserRole, CertificationStatus } from '../common/enums';

type SafeUser = Omit<User, 'password' | 'hashedRefreshToken'>;

@Injectable()
export class FarmersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private excludeSensitiveFields(user: User): SafeUser {
    const { password, hashedRefreshToken, ...safeUser } = user;
    void password;
    void hashedRefreshToken;
    return safeUser;
  }

  async findAllFarmers(): Promise<SafeUser[]> {
    const farmers = await this.userRepository.find({
      where: { role: UserRole.FARMER },
      order: { createdAt: 'DESC' },
    });
    return farmers.map((farmer) => this.excludeSensitiveFields(farmer));
  }

  async findFarmerById(id: string): Promise<User> {
    const farmer = await this.userRepository.findOne({
      where: { id, role: UserRole.FARMER },
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${id} not found`);
    }

    return farmer;
  }

  async updateFarmerStatus(
    id: string,
    updateFarmerStatusDto: UpdateFarmerStatusDto,
  ): Promise<SafeUser> {
    const farmer = await this.findFarmerById(id);

    farmer.status = updateFarmerStatusDto.status;
    await this.userRepository.save(farmer);

    return this.excludeSensitiveFields(farmer);
  }

  async getFarmerStatus(id: string): Promise<{
    status: CertificationStatus;
    name: string;
    farmSize: number;
    cropType: string;
  }> {
    const farmer = await this.findFarmerById(id);

    return {
      status: farmer.status,
      name: farmer.name,
      farmSize: farmer.farmSize,
      cropType: farmer.cropType,
    };
  }

  async getMyProfile(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.excludeSensitiveFields(user);
  }
}
