import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeORMConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'chat-db',
  name: 'chat-ser',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'chat',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: true,
  poolSize: 10,
};
