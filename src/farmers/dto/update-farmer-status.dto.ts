import { IsEnum } from 'class-validator';
import { CertificationStatus } from '../../common/enums';

export class UpdateFarmerStatusDto {
  @IsEnum(CertificationStatus)
  status: CertificationStatus;
}
