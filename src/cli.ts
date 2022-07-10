import { Server } from '@grpc/grpc-js'
import { Command, OptionValues } from 'commander'

const program = new Command()

program.requiredOption('-a --address <address>', 'grpc address')

program.parse()

interface ServerOptions {
  address: string
}

const options = cliOptions(program.opts())

export { options }

// builder fns

function cliOptions(maybeOptions: OptionValues): ServerOptions {
  return {
    address: address(maybeOptions.address),
  }
}

function address(maybeAddress: string | undefined): string {
  if (maybeAddress) {
    return maybeAddress
  }
  throw new Error('address missing from options')
}
