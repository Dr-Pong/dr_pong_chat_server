import { Test, TestingModule } from '@nestjs/testing';
import { UserChannelService } from './user-channel.service';

describe('UserChannelService', () => {
  let service: UserChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserChannelService],
    }).compile();

    service = module.get<UserChannelService>(UserChannelService);
  });
  describe('관리자 기능', () => {
    describe('관리자 임명 / 해제', () => {
      it('[Valid Case] 관리자 임명', async () => {});
      it('[Valid Case] 관리자 해제', async () => {});
    });

    describe('KICK TEST', () => {
      it('[Valid Case] 일반 유저 강퇴', async () => {
        // expect(service).toBeDefined();
      });
      it('[Valid Case] owner가 관리자를 강퇴', async () => {
        // expect(service).toBeDefined();
      });
      it('[Error Case] 관리자가 관리자를 강퇴', async () => {
        // expect(service).toBeDefined();
      });
    });

    describe('BAN TEST', () => {
      it('[Valid Case] 일반 유저 BAN', async () => {
        // expect(service).toBeDefined();
      });
      it('[Valid Case] owner가 BAN를 강퇴', async () => {
        // expect(service).toBeDefined();
      });
      it('[Error Case] 관리자가 관리자를 강퇴', async () => {
        // expect(service).toBeDefined();
      });
    });

    describe('MUTE TEST', () => {
      it('[Valid Case] 일반 유저 MUTE', async () => {
        // expect(service).toBeDefined();
      });
      it('[Valid Case] owner가 admin을 강퇴', async () => {
        // expect(service).toBeDefined();
      });
      it('[Error Case] 관리자가 관리자를 MUTE', async () => {
        // expect(service).toBeDefined();
      });
    });

    describe('UNMUTE TEST', () => {
      it('[Valid Case] 일반 유저 UNMUTE', async () => {
        // expect(service).toBeDefined();
      });
      it('[Error Case] 관리자가 관리자를 UNMUTE', async () => {
        // expect(service).toBeDefined();
      });
    });

    describe('채팅방 삭제', () => {
      it('[Valid Case] 채팅방 삭제(유저가 0명 되는 경우)', async () => {
        // expect(service).toBeDefined();
      });
      it('[Valid Case] 채팅방 삭제(오너가 삭제하는 경우)', async () => {
        // expect(service).toBeDefined();
      });
    });
    describe('채팅방 수정', () => {
      it('[Valid Case] public -> private', async () => {});
      it('[Valid Case] public -> protected', async () => {});
      it('[Valid Case] private -> public', async () => {});
      it('[Valid Case] private -> protected', async () => {});
      it('[Valid Case] protected -> public', async () => {});
      it('[Valid Case] protected -> private', async () => {});
    });
  });
});
