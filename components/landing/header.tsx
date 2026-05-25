'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

export function Header () {
  const router = useRouter()
  const [isSignInLoading, setIsSignInLoading] = useState(false)
  const [isGetStartedLoading, setIsGetStartedLoading] = useState(false)

  // scroll tới section với offset để header fixed không che
  const handleScroll = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -64 // chiều cao header = 16 * 4 = 64px
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleSignIn = () => {
    setIsSignInLoading(true)
    router.push('/setup')
  }

  const handleGetStarted = () => {
    setIsGetStartedLoading(true)
    router.push('/setup')
  }

  return (
    <header className='fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--primary-main)] text-[var(--foreground)] transition-colors'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <div className='flex items-center gap-2 cursor-pointer'>
            <MessageSquare className='h-6 w-6 text-[var(--primary-accent)]' />
            <span className='text-xl font-bold text-[var(--foreground)]'>
              CampusFlow
            </span>
          </div>

          {/* Navigation */}
          <div className='hidden md:!flex items-center gap-8'>
            {[
              { label: 'Overview', id: 'hero' },
              { label: 'Impact', id: 'stats' },
              { label: 'Features', id: 'features' },
              { label: 'Get Started', id: 'cta' }
            ].map(section => (
              <button
                key={section.id}
                onClick={() => handleScroll(section.id)}
                className='mx-5 text-lg font-bold text-white hover:text-[var(--primary-accent)] transition-colors'
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className='flex items-center gap-4'>
            <Button
              onClick={handleSignIn}
              disabled={isSignInLoading || isGetStartedLoading}
              variant='ghost'
              className='text-md text-white bg-gradient-to-r from-[#cc707033] to-[var(--primary-accent)] 
                  hover:from-[var(--primary-accent)] hover:to-[#5341a233] transition-all duration-1000'
            >
              {isSignInLoading ? 'Loading...' : 'Sign In'}
            </Button>
            <Button
              onClick={handleGetStarted}
              disabled={isSignInLoading || isGetStartedLoading}
              className='sm:!inline-flex text-md text-white bg-gradient-to-r from-[#cc707033] to-[var(--primary-accent)] 
                  hover:from-[var(--primary-accent)] hover:to-[#5341a233] transition-all duration-1000'
            >
              {isGetStartedLoading ? 'Loading...' : 'Get Started'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
