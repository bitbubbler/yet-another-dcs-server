/* eslint-disable @typescript-eslint/no-var-requires */
const { rm } = require('fs/promises')
const { resolve } = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec);

const generatedDir = resolve('generated')

async function main() {
    // delete existing generated files
    await rm(generatedDir, { recursive: true, force: true })

    const npmBin = resolve('node_modules', '.bin')
    const bin = resolve(npmBin, 'proto-loader-gen-types')
    const protoDir = resolve('src', 'proto')
    const dcsProtoFile = resolve(protoDir, 'dcs', 'dcs.proto')

    const generateTypes = `${bin} -I ${protoDir} -O ${generatedDir} --oneofs --grpcLib=@grpc/grpc-js ${dcsProtoFile}`

    exec(generateTypes)
}

main()

