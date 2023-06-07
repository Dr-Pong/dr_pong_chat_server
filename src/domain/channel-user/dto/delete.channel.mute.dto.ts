import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class DeleteChannelMuteDto extends ChannelAdminCommandDto {
  typeof(): string {
    return DeleteChannelMuteDto.name;
  }
}
