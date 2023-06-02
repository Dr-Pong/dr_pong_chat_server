import { Module } from '@nestjs/common';
import { ChatGateWay } from './chat.gateway';
import { FactoryModule } from 'src/domain/factory/factory.module';

@Module({
  imports: [FactoryModule],
  providers: [ChatGateWay],
  exports: [ChatGateWay],
})
export class GatewayModule {}
