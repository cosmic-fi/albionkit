"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  Settings, 
  User, 
  Search,
  Sword,
  Shield,
  Coins,
  Hammer,
  TrendingUp,
  Map,
  X,
  Sprout,
  Utensils,
  Skull,
  Box,
  Loader2,
  LineChart,
  FlaskConical,
  Rabbit,
  Sparkles,
  HardHat,
  Crown,
  Users,
  Swords
} from "lucide-react"
import { globalSearch, SearchResult } from "@/app/actions/search"

interface CommandMenuProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandMenu({ open, setOpen }: CommandMenuProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      return
    }
  }, [open])

  React.useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const data = await globalSearch(query)
        setResults(data)
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(search, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [setOpen])

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Coins': return <Coins className="mr-2 h-4 w-4" />
      case 'Sword': return <Sword className="mr-2 h-4 w-4" />
      case 'Shield': return <Shield className="mr-2 h-4 w-4" />
      case 'Hammer': return <Hammer className="mr-2 h-4 w-4" />
      case 'Sprout': return <Sprout className="mr-2 h-4 w-4" />
      case 'Utensils': return <Utensils className="mr-2 h-4 w-4" />
      case 'User': return <User className="mr-2 h-4 w-4" />
      case 'Skull': return <Skull className="mr-2 h-4 w-4" />
      case 'Box': return <Box className="mr-2 h-4 w-4" />
      case 'LineChart': return <LineChart className="mr-2 h-4 w-4" />
      case 'FlaskConical': return <FlaskConical className="mr-2 h-4 w-4" />
      case 'Rabbit': return <Rabbit className="mr-2 h-4 w-4" />
      case 'Sparkles': return <Sparkles className="mr-2 h-4 w-4" />
      case 'HardHat': return <HardHat className="mr-2 h-4 w-4" />
      case 'Crown': return <Crown className="mr-2 h-4 w-4" />
      case 'Users': return <Users className="mr-2 h-4 w-4" />
      case 'Swords': return <Swords className="mr-2 h-4 w-4" />
      case 'Settings': return <Settings className="mr-2 h-4 w-4" />
      default: return <Search className="mr-2 h-4 w-4" />
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <Command className="w-full bg-transparent" shouldFilter={false}>
          <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <Command.Input 
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              value={query}
              onValueChange={setQuery}
            />
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />}
            <button 
              onClick={() => setOpen(false)}
              className="ml-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            {!loading && query.length > 0 && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            )}

            {results.length > 0 ? (
              <>
                {/* Pages & Tools Group */}
                {results.some(r => r.type === 'page' || r.type === 'tool') && (
                  <Command.Group heading="Pages & Tools" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                    {results.filter(r => r.type === 'page' || r.type === 'tool').map((result) => (
                      <Command.Item
                        key={result.id}
                        onSelect={() => runCommand(() => router.push(result.href))}
                        className="flex items-center gap-2 px-2 py-2 text-sm text-foreground rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                      >
                        {getIcon(result.icon)}
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && <span className="text-xs text-muted-foreground">{result.subtitle}</span>}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Builds Group */}
                {results.some(r => r.type === 'build') && (
                  <Command.Group heading="Builds" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                    {results.filter(r => r.type === 'build').map((result) => (
                      <Command.Item
                        key={result.id}
                        onSelect={() => runCommand(() => router.push(result.href))}
                        className="flex items-center gap-2 px-2 py-2 text-sm text-foreground rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                      >
                        {getIcon(result.icon)}
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && <span className="text-xs text-muted-foreground">{result.subtitle}</span>}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
                
                {/* Items Group */}
                {results.some(r => r.type === 'item') && (
                  <Command.Group heading="Items" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                    {results.filter(r => r.type === 'item').map((result) => (
                      <Command.Item
                        key={result.id}
                        onSelect={() => runCommand(() => router.push(result.href))}
                        className="flex items-center gap-2 px-2 py-2 text-sm text-foreground rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                      >
                        {getIcon(result.icon)}
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && <span className="text-xs text-muted-foreground">{result.subtitle}</span>}
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </>
            ) : (
              query.length === 0 && (
                <Command.Group heading="Quick Access" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/tools/market-flipper'))}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-foreground rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                  >
                    <Coins className="mr-2 h-4 w-4" />
                    <span>Market Flipper</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/tools/pvp-intel'))}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-foreground rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                  >
                    <Sword className="mr-2 h-4 w-4" />
                    <span>PvP Intel</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => router.push('/tools/zvz-tracker'))}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-foreground rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>ZvZ Tracker</span>
                  </Command.Item>
                </Command.Group>
              )
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
