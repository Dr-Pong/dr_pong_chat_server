import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeORMConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'chat-db',
  name: 'chat-ser',
  port: 5432,
  username: process.env.CHAT_DB_USER,
  password: process.env.CHAT_DB_PASSWORD,
  database: process.env.CHAT_DB_NAME,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: true,
  poolSize: 10,
};
