## Technology Used

- ExpressJS
- NestJS
- TypeORM
- PostgreSQL
- Valkey
- Cron

## Running Application

Environment file is available in `environments` directory. Change database credentials then run

```shell
nvm use v22.12.0
yarn install
yarn db:seed # to seed data
yarn start
```

## Migrations

For creating a migration file

```shell
yarn db:migration:create src/database/migrations/User
```

Before running migration run `yarn build` command

```shell
yarn build
yarn db:migration:run
yarn db:migration:revert
```

## Documentation

http://localhost:4002/docs

pg_dump -h ${host} -U wagehat -d wagehat_db_stg -F c -f wagehat_db_stg-oct-29-25.dump

pg_restore --no-owner -h localhost -p 5432 -U postgres -d wagehat_db -F c wagehat_db_stg-oct-29-25.dump
