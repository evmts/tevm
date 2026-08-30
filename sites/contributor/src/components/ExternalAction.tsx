import { Button, type ButtonProps } from '@smthrs/ui'
import type { ReactNode } from 'react'
import { externalLinkProps } from '../data'

type ExternalActionProps = Pick<ButtonProps, 'className' | 'size' | 'variant'> & {
	href: string
	children: ReactNode
}

export const ExternalAction = ({ href, children, ...buttonProps }: ExternalActionProps) => (
	<Button asChild {...buttonProps}>
		<a {...externalLinkProps(href)}>
			{children}
			<span aria-hidden="true">↗</span>
		</a>
	</Button>
)

export const ExternalTextLink = ({ href, children }: { href: string; children: ReactNode }) => (
	<a className="tevm-text-link" {...externalLinkProps(href)}>
		{children}
		<span aria-hidden="true">↗</span>
	</a>
)
