import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class PostChannelAdminDto extends ChannelAdminCommandDto {
  getType(): string {
    return PostChannelAdminDto.name;
  }
}
