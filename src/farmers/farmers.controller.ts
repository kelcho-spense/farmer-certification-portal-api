import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { UpdateFarmerStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';
import { User } from '../users/entities';

@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  // GET /farmers - List all farmers (admin only)
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.farmersService.findAllFarmers();
  }

  // GET /farmers/me - Get current farmer's profile
  @Get('me')
  async getMyProfile(@CurrentUser() user: User) {
    return this.farmersService.getMyProfile(user.id);
  }

  // GET /farmers/:id/status - Farmer checks their status
  @Get(':id/status')
  async getFarmerStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    // Farmers can only check their own status, admins can check any
    if (user.role === UserRole.FARMER && user.id !== id) {
      return this.farmersService.getFarmerStatus(user.id);
    }
    return this.farmersService.getFarmerStatus(id);
  }

  // PATCH /farmers/:id/status - Certify/decline farmer (admin only)
  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateFarmerStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFarmerStatusDto: UpdateFarmerStatusDto,
  ) {
    return this.farmersService.updateFarmerStatus(id, updateFarmerStatusDto);
  }
}
