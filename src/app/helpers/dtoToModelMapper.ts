import { DataSource } from 'typeorm';
export default function <T>(dataSource: DataSource, entity: new () => T, dto: Partial<T>): T {
  const model = new entity();

  const fields = dataSource
    .getRepository(entity)
    .metadata.ownColumns.map((column) => column.propertyName);
  const keys = Object.keys(dto);

  for (const key of keys) {
    if (fields.indexOf(key) != -1) {
      (model as any)[key] = dto[key as keyof T];
    }
  }

  return model;
}
