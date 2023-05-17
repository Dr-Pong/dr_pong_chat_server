export class ProfileImageDto {
  id: number;

  url: string;
}

export class ProfileImagesDto {
  images: ProfileImageDto[];
}
