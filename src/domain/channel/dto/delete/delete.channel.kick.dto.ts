import { ChannelAdminCommandDto } from '../channel.admin.command.dto';

export class DeleteChannelKickDto extends ChannelAdminCommandDto {
  getType(): string {
    return DeleteChannelKickDto.name;
  }
}
