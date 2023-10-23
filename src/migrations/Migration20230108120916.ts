import { Migration } from '@mikro-orm/migrations'

export class Migration20230108120916 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table `csars` add column `rescuedAt` datetime null;')
  }
}
