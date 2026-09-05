// A real native upstream in another process: the embedded client uses sync HTTP.
const {createServer} = require('node:http')
const {NativeNode} = require('@evmts/zevm')
const node = new NativeNode()
const call = (method,params) => JSON.parse(node.rpc(JSON.stringify({jsonrpc:'2.0',id:1,method,params})))
call('anvil_setBalance',['0x0000000000000000000000000000000000000123','0x2a'])
call('anvil_setCode',['0x0000000000000000000000000000000000000123','0x602a60005260206000f3'])
call('anvil_setStorageAt',['0x0000000000000000000000000000000000000123','0x0','0x2a'])
call('evm_mine',[])
const server = createServer(async (req,res) => {
 let body = ''
 for await (const chunk of req) body += chunk
 const response = node.rpc(body)
 res.writeHead(response === null ? 204 : 200, {'content-type':'application/json'}).end(response)
})
server.listen(0,'127.0.0.1', () => process.send({url:`http://127.0.0.1:${server.address().port}`}))
process.on('SIGTERM', () => server.close(() => {node.close(); process.disconnect()}))
