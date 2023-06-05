import { GetChannelPageDto } from './get.channel.page.dto';

export class FindChannelPageDto {
  page: number;
  count: number;
  keyword: string;

  static fromGetDto(getDto: GetChannelPageDto): FindChannelPageDto {
    const { page, count, keyword } = getDto;
    return new FindChannelPageDto(page, count, keyword);
  }

  constructor(page: number, count: number, keyword: string) {
    this.page = page;
    this.count = count;
    this.keyword = keyword;
  }
}
