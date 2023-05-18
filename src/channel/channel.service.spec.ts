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
  describe('GET tests', () => {
    it('채팅방 목록 조회', () => {
      // expect(service).toBeDefined();
    });
    it('채팅방 참여자 목록 조회', () => {
      // expect(service).toBeDefined();
    });
  });
  describe('POST tests', () => {
    it('채팅방 생성', () => {
      // expect(service).toBeDefined();
    });
    it('채팅방 입장', () => {
      // expect(service).toBeDefined();
    });
    it('채팅방 초대', () => {
      // expect(service).toBeDefined();
    });
    it('채팅방 초대 수락', () => {
      // expect(service).toBeDefined();
    });
    it.only('채팅 전송', async () => {
      const message = 'hello world';
      const clientSocket = mockSocket;

      const mockedClient = {
        on: jest.fn(),
      };

      service.sendMessage(clientSocket, message);
      const receivedMessage = await mockedClient.on(
        'message',
        (data: string) => {
          console.log(data);
        },
      );
      expect(receivedMessage).toBe(message);
      // expect(service).toBeDefined();
    });
    it('관리자 / owner 권한 KICK', () => {
      // expect(service).toBeDefined();
    });
    it('관리자 / owner 권한 BAN', () => {
      // expect(service).toBeDefined();
    });
    it('관리자 / owner 권한 MUTE', () => {
      // expect(service).toBeDefined();
    });
  });
  describe('PATCH tests', () => {
    it('채팅방 수정', () => {
      // expect(service).toBeDefined();
    });
  });
  describe('DELETE tests', () => {
    it('채팅방 삭제', () => {
      // expect(service).toBeDefined();
    });
    it('채팅방 퇴장', () => {
      // expect(service).toBeDefined();
    });
    it('관리자 / owner 권한 UN_MUTE', () => {
      // expect(service).toBeDefined();
    });
  });
});
