'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function GoBackButton() {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
    >
      <ArrowLeft data-icon="inline-start" aria-hidden="true" />
      Go back
    </Button>
  )
}
