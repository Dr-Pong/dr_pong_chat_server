import { ChannelAdminCommandDto } from '../channel.admin.command.dto';

export class DeleteChannelAdminDto extends ChannelAdminCommandDto {
  getType(): string {
    return DeleteChannelAdminDto.name;
  }
}
