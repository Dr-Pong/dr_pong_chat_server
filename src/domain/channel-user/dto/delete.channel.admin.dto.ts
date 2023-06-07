import { ChannelAdminCommandDto } from './channel.admin.command.dto';

export class DeleteChannelAdminDto extends ChannelAdminCommandDto {
  typeof(): string {
    return DeleteChannelAdminDto.name;
  }
}
