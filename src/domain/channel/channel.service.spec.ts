import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { ChannelModule } from './channel.module';

const mockSocket = {
  emit: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
};

describe('ChannelService', () => {
  let service: ChannelService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ChannelModule],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
  });
});
