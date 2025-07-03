// page.tsx

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')  // o la pagina che vuoi

  return null  // Non serve renderizzare nulla
}
