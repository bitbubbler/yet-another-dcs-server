/* eslint-disable @typescript-eslint/no-var-requires */
const { rm, readdir } = require('fs/promises')
const { resolve } = require('path')
const util = require('util')
const execFile = util.promisify(require('child_process').execFile);

const generatedDir = resolve('generated')

async function main() {
    // delete existing generated files
    await rm(generatedDir, { recursive: true, force: true })

    const npmBin = resolve('node_modules', '.bin')
    const bin = resolve(npmBin, 'proto-loader-gen-types')
    const protoDir = resolve('src', 'proto')
    const dcsProtoFile = resolve(protoDir, 'dcs', 'dcs.proto')

    console.log(await readdir(npmBin))

    const args = ['-I', protoDir, '-O', generatedDir, '--oneofs', '--grpcLib=@grpc/grpc-js', dcsProtoFile]

    await execFile(bin, args)
}

main().catch(error => {
    console.error('failed', error)
})

