import { useAuth } from '@/hooks/useAuth'
import { User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b bg-background px-4">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <span className="font-medium">{user?.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md border bg-popover p-1 shadow-lg">
            <button
              onClick={() => {
                setShowDropdown(false)
                navigate('/profile')
              }}
              className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              个人资料
            </button>
            <div className="my-1 border-t" />
            <button
              onClick={handleLogout}
              className="w-full rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
