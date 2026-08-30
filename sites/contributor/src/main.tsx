import { SmithersUiStyles } from '@smthrs/ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'
import { tevmThemeCss } from './theme'

const root = document.getElementById('root')
if (!root) throw new Error('index.html is missing #root')

createRoot(root).render(
	<StrictMode>
		<SmithersUiStyles withTheme extra={tevmThemeCss} />
		<App />
	</StrictMode>,
)
