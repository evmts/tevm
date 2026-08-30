import type { ReactNode } from 'react'

/**
 * @smthrs/ui intends SectionHeader.title to accept ReactNode, but 0.33.0
 * intersects it with the native div `title?: string` prop. Preserve semantic
 * headings at runtime until that published type intersection is fixed.
 */
export const sectionTitle = (node: ReactNode): string => node as unknown as string
