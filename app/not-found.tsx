import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4 bg-white dark:bg-[#313338] text-center">
      <div className="relative">
        <h1 className="text-9xl font-bold text-indigo-500/10 dark:text-indigo-500/20 select-none">
          404
        </h1>
      </div>
      
      <div className="max-w-xs mx-auto space-y-2">
        <p className="text-zinc-500 dark:text-zinc-400">
          You look lost, stranger. You know what helps when you are lost? A map. Or in this case, a link back to the home page.
        </p>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          (Or you can just go back home.)
        </p>
      </div>

      <Button asChild className="bg-indigo-500 hover:bg-indigo-500/90 text-white mt-8">
        <Link href="/setup">
          Return Home
        </Link>
      </Button>
    </div>
  )
}
