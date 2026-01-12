import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FarmersService } from './farmers.service';
import { UpdateFarmerStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';
import { User } from '../users/entities';

@ApiTags('farmers')
@ApiBearerAuth('access-token')
@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  // GET /farmers - List all farmers (admin only)
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all farmers (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all farmers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAll() {
    return this.farmersService.findAllFarmers();
  }

  // GET /farmers/me - Get current farmer's profile
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@CurrentUser() user: User) {
    return this.farmersService.getMyProfile(user.id);
  }

  // GET /farmers/:id/status - Farmer checks their status
  @Get(':id/status')
  @ApiOperation({ summary: 'Get farmer certification status' })
  @ApiParam({ name: 'id', description: 'Farmer ID', type: Number })
  @ApiResponse({ status: 200, description: 'Farmer status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Farmer not found' })
  async getFarmerStatus(
    @Param('id', ParseIntPipe) id: number,
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
  @ApiOperation({ summary: 'Update farmer certification status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Farmer ID', type: Number })
  @ApiResponse({ status: 200, description: 'Farmer status updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Farmer not found' })
  async updateFarmerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFarmerStatusDto: UpdateFarmerStatusDto,
  ) {
    return this.farmersService.updateFarmerStatus(id, updateFarmerStatusDto);
  }
}
