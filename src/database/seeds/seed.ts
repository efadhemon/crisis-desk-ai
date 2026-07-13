import { User } from '@src/app/modules/user/entities/user.entity';
import { ENV } from '@src/env';
import { DataSource } from 'typeorm';
import UserSeeder from './seeder/user.seeder';

const dataSource = new DataSource({
  type: ENV.db.type,
  host: ENV.db.host,
  port: ENV.db.port,
  username: ENV.db.username,
  password: ENV.db.password,
  database: ENV.db.database,
  // synchronize: ENV.db.synchronize,
  synchronize: false, // Set to false for production to avoid data loss
  ssl: ENV.db.sslMode
    ? {
        ca: ENV.db.cert,
        rejectUnauthorized: ENV.db.rejectUnauthorized,
      }
    : false,
  entities: [User],
});

(async () => {
  await dataSource.initialize();
  await dataSource.synchronize();

  const userSeeder = new UserSeeder(dataSource);

  await userSeeder.run();

  await dataSource.destroy();
})();
