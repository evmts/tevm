import { createConnection, createServer, createSimpleProject } from '@volar/language-server/node.js'
import { plugin } from './plugin.js'

const connection = createConnection()
const server = createServer(connection)
const configuration = plugin()

connection.onInitialize((params) =>
	server.initialize(params, createSimpleProject(configuration.languagePlugins), configuration.servicePlugins),
)
connection.onInitialized(() => {
	server.initialized()
	void server.fileWatcher.watchFiles(configuration.watchFileExtensions.map((extension) => `**/*.${extension}`))
})
connection.onShutdown(() => server.shutdown())
connection.listen()
