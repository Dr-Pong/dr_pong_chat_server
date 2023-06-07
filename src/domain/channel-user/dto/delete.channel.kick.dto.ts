import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class DeleteChannelKickDto extends ChannelAdminCommandDto {
  typeof(): string {
    return DeleteChannelKickDto.name;
  }
}
