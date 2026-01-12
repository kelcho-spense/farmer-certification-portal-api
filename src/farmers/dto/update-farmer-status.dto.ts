import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CertificationStatus } from '../../common/enums';

export class UpdateFarmerStatusDto {
  @ApiProperty({
    enum: CertificationStatus,
    example: CertificationStatus.CERTIFIED,
    description: 'Certification status',
  })
  @IsEnum(CertificationStatus)
  status: CertificationStatus;
}
