import { BcryptHelper } from '@src/app/helpers';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { User } from '../entities/user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    dataSource: DataSource,
    private readonly bcryptHelper: BcryptHelper,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo(): typeof User {
    return User;
  }

  async beforeInsert(event: InsertEvent<User>): Promise<void> {
    if (event.entity.password) {
      event.entity.password = await this.bcryptHelper.hash(event.entity.password);
    }
    if (event.entity.email) {
      event.entity.email = event.entity.email.toLowerCase().trim();
    }

    // Trim firstName and lastName if they exist, and then set fullName if not already set
    event.entity.firstName = event.entity.firstName?.trim() || event.entity.firstName;
    event.entity.lastName = event.entity.lastName?.trim() || event.entity.lastName;
    if (event.entity.firstName && !event.entity.fullName) {
      event.entity.fullName = [event.entity.firstName, event.entity.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
    }
  }

  async beforeUpdate(event: InsertEvent<Partial<User>>): Promise<void> {
    if (event.entity.password) {
      event.entity.password = await this.bcryptHelper.hash(event.entity.password);
    }
    if (event.entity.email) {
      event.entity.email = event.entity.email.toLowerCase().trim();
    }

    // Trim firstName and lastName if they exist, and then set fullName if not already set
    event.entity.firstName = event.entity.firstName?.trim() || event.entity.firstName;
    event.entity.lastName = event.entity.lastName?.trim() || event.entity.lastName;
    if (event.entity.firstName && !event.entity.fullName) {
      event.entity.fullName = [event.entity.firstName, event.entity.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
    }
  }
}
