import { ENV } from 'src/env';
import { DataSource } from 'typeorm';
import * as path from 'path';

export default new DataSource({
  type: ENV.db.type,
  host: ENV.db.host,
  port: ENV.db.port,
  username: ENV.db.username,
  password: ENV.db.password,
  database: ENV.db.database,
  // synchronize: ENV.db.synchronize,
  synchronize: false, // Set to false for production to avoid data loss
  logging: ['migration'],
  logger: ENV.isProduction ? 'file' : 'debug',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  ssl: ENV.db.sslMode
    ? {
        ca: ENV.db.cert,
        rejectUnauthorized: ENV.db.rejectUnauthorized,
      }
    : false,
});
