import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENV } from '@src/env';
import * as path from 'path';

export const ormConfig: TypeOrmModuleOptions = {
  type: ENV.db.type, // 'postgres'
  host: ENV.db.host,
  port: ENV.db.port,
  username: ENV.db.username,
  password: ENV.db.password,
  database: ENV.db.database,
  synchronize: false, // Set to false for production to avoid data loss
  logging: ENV.db.logging,
  logger: ENV.isProduction ? 'file' : 'debug',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  ssl: ENV.db.sslMode
    ? {
        ca: ENV.db.cert,
        rejectUnauthorized: ENV.db.rejectUnauthorized,
      }
    : false,

  // Connection Pooling Options
  extra: {
    // 1. POOL SIZE
    // Our DB Limit is 22. We set this to 20.
    // We leave 2 connections free for you (the admin) to connect via GUI tools
    // to debug issues even if the app is under full load.
    max: 20,

    // 2. TIMEOUT (Queuing Strategy)
    // If all 20 connections are busy (locked by transactions),
    // a new user will wait for 5 seconds.
    // If no connection opens up, they get an error instead of hanging forever.
    connectionTimeoutMillis: 5000,

    // 3. IDLE TIMEOUT (Optional)
    // If a connection is not used for 30s, close it to save resources.
    idleTimeoutMillis: 30000,
  },
};

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig)],
  providers: [],
})
export class DatabaseModule {}
