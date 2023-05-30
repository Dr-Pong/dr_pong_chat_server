import { GetChannelPageDto } from './get.channel.page.dto';

export class FindChannelPageDto {
  page: number;
  count: number;
  keyword: string;

  static fromGetDto(getDto: GetChannelPageDto): FindChannelPageDto {
    const findChannelPageDto: FindChannelPageDto = new FindChannelPageDto();
    findChannelPageDto.page = getDto.page;
    findChannelPageDto.count = getDto.count;
    findChannelPageDto.keyword = getDto.keywords;
    return findChannelPageDto;
  }
}
