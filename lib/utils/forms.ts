import { FormField } from "@/components/form/form-dynamic"

export function openDrawerForm<T>(
  setState: React.Dispatch<React.SetStateAction<{
    open: boolean
    title: string
    fields: FormField[]
    onSubmit: (data: Partial<T>) => void
    defaultValues?: Partial<T>
  }>>,
  config: {
    title: string
    fields: FormField[]
    onSubmit: (data: Partial<T>) => void
    defaultValues?: Partial<T>
  }
) {
  setState({
    open: true,
    title: config.title,
    fields: config.fields,
    onSubmit: config.onSubmit,
    defaultValues: config.defaultValues,
  })
}