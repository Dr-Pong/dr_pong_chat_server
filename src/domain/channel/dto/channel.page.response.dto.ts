import { ChannelPageDto } from './channel.page.dto';

export class ChannelPageResponseDto {
  channels: ChannelPageDto[];
  currentPage: number;
  totalPage: number;
}
