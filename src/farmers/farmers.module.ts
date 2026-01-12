import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmersService } from './farmers.service';
import { FarmersController } from './farmers.controller';
import { User } from '../users/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [FarmersController],
  providers: [FarmersService],
  exports: [FarmersService],
})
export class FarmersModule {}
