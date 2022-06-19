To run this repo:

- make an empty mission (any map)
- modify your dcs to run [dcs-grpc](https://github.com/DCS-gRPC/rust-server)
- clone this repo
- install deps with `npm install`
- create generated code with `npm run codegen`
- start the server with a grpc address `GRPC_ADDRESS=localhost:50051 npm start`
