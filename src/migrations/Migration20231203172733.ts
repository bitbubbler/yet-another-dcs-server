import { Migration } from '@mikro-orm/migrations';

export class Migration20231203172733 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `colors` (`colorId` integer not null primary key autoincrement, `red` float not null, `green` float not null, `blue` float not null, `alpha` float not null);');

    this.addSql('create table `markups` (`markupId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `fillColorId` integer not null, `lineColorId` integer not null, `position` json not null, `type` integer not null, `readonly` integer not null, `coalition` integer not null, `lineType` text null, `radius` integer null, `fontSize` integer null, `text` text null, constraint `markups_fillColorId_foreign` foreign key(`fillColorId`) references `colors`(`colorId`) on update cascade, constraint `markups_lineColorId_foreign` foreign key(`lineColorId`) references `colors`(`colorId`) on update cascade);');
    this.addSql('create index `markups_fillColorId_index` on `markups` (`fillColorId`);');
    this.addSql('create index `markups_lineColorId_index` on `markups` (`lineColorId`);');
    this.addSql('create index `markups_type_index` on `markups` (`type`);');

    this.addSql('create table `bases` (`baseId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `coalition` text not null, `goneAt` datetime null, `heading` integer not null, `labelMarkupId` integer not null, `name` text not null, `position` json not null, `type` integer not null, constraint `bases_labelMarkupId_foreign` foreign key(`labelMarkupId`) references `markups`(`markupId`) on update cascade);');
    this.addSql('create unique index `bases_labelMarkupId_unique` on `bases` (`labelMarkupId`);');

    this.addSql('create table `markupPoints` (`markupId` integer not null, `position` json not null, `index` integer not null, constraint `markupPoints_markupId_foreign` foreign key(`markupId`) references `markups`(`markupId`) on delete cascade on update cascade, primary key (`markupId`));');
    this.addSql('create index `markupPoints_markupId_index` on `markupPoints` (`markupId`);');

    this.addSql('create table `players` (`playerId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `name` text not null, `ucid` text not null);');
    this.addSql('create unique index `players_ucid_unique` on `players` (`ucid`);');

    this.addSql('create table `playerIps` (`playerIpId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `playerId` integer not null, `ip` text not null, constraint `playerIps_playerId_foreign` foreign key(`playerId`) references `players`(`playerId`) on update cascade);');
    this.addSql('create index `playerIps_playerId_index` on `playerIps` (`playerId`);');
    this.addSql('create unique index `playerIps_playerId_ip_unique` on `playerIps` (`playerId`, `ip`);');

    this.addSql('create table `Spawner` (`spawnerId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `position` json not null, `capturedAt` datetime null, `coalition` text not null, `destroyedAt` datetime null, `goneAt` datetime null, `type` text not null);');

    this.addSql('create table `spawnGroups` (`spawnGroupId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `name` text not null, `typeNames` json not null);');
    this.addSql('create unique index `spawnGroups_name_unique` on `spawnGroups` (`name`);');

    this.addSql('create table `staticObjects` (`staticObjectId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `heading` integer not null, `position` json not null, `country` text not null, `typeName` integer not null, `uuid` uuid not null);');

    this.addSql('create table `baseStaticObjects` (`baseId` integer not null, `staticObjectId` integer not null, constraint `baseStaticObjects_baseId_foreign` foreign key(`baseId`) references `bases`(`baseId`) on update cascade, constraint `baseStaticObjects_staticObjectId_foreign` foreign key(`staticObjectId`) references `staticObjects`(`staticObjectId`) on update cascade, primary key (`baseId`, `staticObjectId`));');
    this.addSql('create index `baseStaticObjects_baseId_index` on `baseStaticObjects` (`baseId`);');
    this.addSql('create index `baseStaticObjects_staticObjectId_index` on `baseStaticObjects` (`staticObjectId`);');
    this.addSql('create unique index `baseStaticObjects_baseId_staticObjectId_unique` on `baseStaticObjects` (`baseId`, `staticObjectId`);');

    this.addSql('create table `units` (`unitId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `name` text not null, `canRespawn` integer not null, `country` integer not null, `typeName` text not null, `isPlayerSlot` integer not null, `heading` integer not null, `position` json not null, `destroyedAt` datetime null, `goneAt` datetime null, `hidden` integer not null);');
    this.addSql('create unique index `units_name_unique` on `units` (`name`);');
    this.addSql('create index `units_hidden_index` on `units` (`hidden`);');

    this.addSql('create table `spawnerQueuedUnits` (`spawnerId` integer not null, `unitId` integer not null, `doneAt` datetime null, constraint `spawnerQueuedUnits_spawnerId_foreign` foreign key(`spawnerId`) references `Spawner`(`spawnerId`) on update cascade, constraint `spawnerQueuedUnits_unitId_foreign` foreign key(`unitId`) references `units`(`unitId`) on update cascade, primary key (`spawnerId`, `unitId`));');
    this.addSql('create index `spawnerQueuedUnits_spawnerId_index` on `spawnerQueuedUnits` (`spawnerId`);');
    this.addSql('create unique index `spawnerQueuedUnits_unitId_unique` on `spawnerQueuedUnits` (`unitId`);');
    this.addSql('create unique index `spawnerQueuedUnits_spawnerId_unitId_unique` on `spawnerQueuedUnits` (`spawnerId`, `unitId`);');

    this.addSql('create table `csars` (`csarId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `coalition` text not null, `goneAt` datetime null, `pickedUpAt` datetime null, `playerId` integer not null, `position` json not null, `rescuedAt` datetime null, `diedUnitId` integer not null, `markerStaticObjectId` integer null, `unitId` integer null, constraint `csars_playerId_foreign` foreign key(`playerId`) references `players`(`playerId`) on update cascade, constraint `csars_diedUnitId_foreign` foreign key(`diedUnitId`) references `units`(`unitId`) on update cascade, constraint `csars_markerStaticObjectId_foreign` foreign key(`markerStaticObjectId`) references `staticObjects`(`staticObjectId`) on delete set null on update cascade, constraint `csars_unitId_foreign` foreign key(`unitId`) references `units`(`unitId`) on delete set null on update cascade);');
    this.addSql('create index `csars_playerId_index` on `csars` (`playerId`);');
    this.addSql('create unique index `csars_markerStaticObjectId_unique` on `csars` (`markerStaticObjectId`);');
    this.addSql('create unique index `csars_unitId_unique` on `csars` (`unitId`);');

    this.addSql('create table `cargos` (`cargoId` integer not null primary key autoincrement, `createdAt` datetime not null, `updatedAt` datetime not null, `displayName` text not null, `goneAt` datetime null, `internal` integer not null, `mass` integer not null, `position` json not null, `superType` integer not null, `typeName` text not null, `uuid` uuid not null, `originBaseId` integer null, `csarId` integer null, `type` integer null, `unitTypeName` text null, constraint `cargos_originBaseId_foreign` foreign key(`originBaseId`) references `bases`(`baseId`) on delete set null on update cascade, constraint `cargos_csarId_foreign` foreign key(`csarId`) references `csars`(`csarId`) on delete set null on update cascade);');
    this.addSql('create index `cargos_superType_index` on `cargos` (`superType`);');
    this.addSql('create unique index `cargos_originBaseId_unique` on `cargos` (`originBaseId`);');
    this.addSql('create unique index `cargos_csarId_unique` on `cargos` (`csarId`);');

    this.addSql('create table `baseUnits` (`baseId` integer not null, `unitId` integer not null, constraint `baseUnits_baseId_foreign` foreign key(`baseId`) references `bases`(`baseId`) on update cascade, constraint `baseUnits_unitId_foreign` foreign key(`unitId`) references `units`(`unitId`) on update cascade, primary key (`baseId`, `unitId`));');
    this.addSql('create index `baseUnits_baseId_index` on `baseUnits` (`baseId`);');
    this.addSql('create index `baseUnits_unitId_index` on `baseUnits` (`unitId`);');
    this.addSql('create unique index `baseUnits_baseId_unitId_unique` on `baseUnits` (`baseId`, `unitId`);');

    this.addSql('create table `unitCargos` (`unitId` integer not null, `cargoId` integer not null, constraint `unitCargos_unitId_foreign` foreign key(`unitId`) references `units`(`unitId`) on update cascade, constraint `unitCargos_cargoId_foreign` foreign key(`cargoId`) references `cargos`(`cargoId`) on update cascade, primary key (`unitId`, `cargoId`));');
    this.addSql('create index `unitCargos_unitId_index` on `unitCargos` (`unitId`);');
    this.addSql('create index `unitCargos_cargoId_index` on `unitCargos` (`cargoId`);');
    this.addSql('create unique index `unitCargos_cargoId_unitId_unique` on `unitCargos` (`cargoId`, `unitId`);');
  }

}
