import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class DeleteChannelMuteDto extends ChannelAdminCommandDto {
  getType(): string {
    return DeleteChannelMuteDto.name;
  }
}
