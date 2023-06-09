export class PostChannelRequestDto {
  title: string;
  access: 'public' | 'private';
  password: string | null;
  maxCount: number;
}
