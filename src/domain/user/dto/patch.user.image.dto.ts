import { UserIdCardDto } from 'src/domain/auth/jwt/auth.user.id-card.dto';
import { PatchUserImageRequestDto } from './patch.user.image.request.dto';

export class PatchUserImageDto {
  userId: number;
  imgId: number;

  static forPatchUserImageDto(
    userInfoDto: UserIdCardDto,
    patchRequestDto: PatchUserImageRequestDto,
  ): PatchUserImageDto {
    return {
      userId: userInfoDto.id,
      imgId: patchRequestDto.imgId,
    };
  }
}
