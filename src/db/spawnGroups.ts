import { knex, SpawnGroup, Unit } from './db'

export async function findSpawnGroupBy(name: string): Promise<SpawnGroup> {
  const spawnGroup = await knex('spawnGroups')
    .select('*')
    .where({ name })
    .first()

  if (!spawnGroup) {
    throw new Error(`spawn group with name ${name} was not found`)
  }

  return spawnGroup
}

export async function insertOrUpdateSpawnGroup(
  groupName: string,
  typeNames: Unit['typeName'][]
): Promise<void> {
  const timestamp = new Date()

  // try to find existing unit
  const existingUnitResult = await knex('spawnGroups')
    .where('name', groupName)
    .select('*')
    .limit(1)

  // unit not exists, insert
  if (existingUnitResult.length < 1) {
    // insert the position
    const newPositionResult = await knex('spawnGroups')
      .insert({
        name: groupName,
        typeNamesJson: JSON.stringify(typeNames),
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning(['name'])

    if (newPositionResult.length < 1) {
      throw new Error('missing position result')
    }
  } else {
    await knex('spawnGroups')
      .update({
        typeNamesJson: JSON.stringify(typeNames),
        updatedAt: timestamp,
      })
      .where({
        name: groupName,
      })
  }
}
