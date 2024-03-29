/* eslint-disable @typescript-eslint/no-var-requires */
const { rm } = require('fs/promises')
const { resolve, join } = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const generatedDir = resolve(join('src', '__generated__'))

async function main() {
  // delete existing generated files
  await rm(generatedDir, { recursive: true, force: true })

  const npmBin = resolve('node_modules', '.bin')
  const bin = resolve(npmBin, 'proto-loader-gen-types')
  const protosDir = resolve('src', 'protos')
  const dcsProtoFile = resolve(protosDir, 'dcs', 'dcs.proto')

  const args = [
    '-I',
    protosDir,
    '-O',
    generatedDir,
    '--oneofs',
    '--grpcLib=@grpc/grpc-js',
    dcsProtoFile,
  ]
    .map(arg => `"${arg}"`)
    .join(' ')

  await exec(`"${bin}" ${args}`)

  console.log(`generated types in ${generatedDir}`)
}

main().catch(error => {
  console.error('failed', error)
})
