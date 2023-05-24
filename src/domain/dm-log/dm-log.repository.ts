import { Injectable } from '@nestjs/common';
import { DmLog } from './dm-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DmLogRepository {
  constructor(
    @InjectRepository(DmLog)
    private readonly repository: Repository<DmLog>,
  ) {}
}
