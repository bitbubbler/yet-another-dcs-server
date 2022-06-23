/* eslint-disable @typescript-eslint/no-var-requires */
const { rm } = require('fs/promises')
const { resolve } = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec);

const generatedDir = resolve('generated')

async function main() {
    // delete existing generated files
    await rm(generatedDir, { recursive: true, force: true })

    const pwd = resolve('.')
    const npmBin = resolve('node_modules', '.bin')

    const generateTypes = `${npmBin}/proto-loader-gen-types -I ${pwd}/src/proto/ -O generated/ --oneofs --grpcLib=@grpc/grpc-js ${pwd}/src/proto/dcs/dcs.proto`

    exec(generateTypes)
}

main()

