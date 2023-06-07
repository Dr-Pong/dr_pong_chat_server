import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class PostChannelAdminDto extends ChannelAdminCommandDto {
  typeof(): string {
    return PostChannelAdminDto.name;
  }
}
