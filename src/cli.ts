import { Command, OptionValues } from 'commander'
import fs from 'fs'

const program = new Command()

program.requiredOption('-a --address <address>', 'grpc address')
program.option('--db <name>', 'database path')
program.requiredOption('--missions <path>', 'My missions path (in saved games)')

program.parse()

interface ServerOptions {
  address: string
  db: string | undefined
  missions: string
}

const options = cliOptions(program.opts())

export { options }

// builder fns

function cliOptions(maybeOptions: OptionValues): ServerOptions {
  return {
    address: address(maybeOptions.address),
    db: db(maybeOptions.db),
    missions: missions(maybeOptions.missions),
  }
}

function address(maybeAddress: string | undefined): string {
  if (maybeAddress) {
    return maybeAddress
  }
  throw new Error('address missing from options')
}

function db(maybeDb: string | undefined): string | undefined {
  if (maybeDb) {
    return maybeDb
  }
  return undefined
}

function missions(maybeMissions: string | undefined): string {
  if (maybeMissions) {
    if (fs.existsSync(maybeMissions)) {
      return maybeMissions
    }
    throw new Error('missions path does not exists')
  }
  throw new Error('missions missing from options')
}
