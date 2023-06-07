import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class PostChannelBanDto extends ChannelAdminCommandDto {
  typeof(): string {
    return PostChannelBanDto.name;
  }
}
