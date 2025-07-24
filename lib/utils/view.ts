import type { ViewField } from '@/components/view/view-dynamic'

export function openViewDrawer<T>(
  setState: React.Dispatch<React.SetStateAction<{
    open: boolean
    title: string
    data: Partial<T>
  }>>,
  config: {
    title: string
    data: Partial<T>
  }
) {
  setState({
    open: true,
    title: config.title,
    data: config.data,
  })
}
