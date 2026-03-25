// app/page.tsx
// Root route — redirect to login. Auth check happens in app/(app)/layout.tsx.
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
