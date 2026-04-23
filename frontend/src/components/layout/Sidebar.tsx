import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Activity,
  Settings,
  LogOut,
  User
} from 'lucide-react'

const menuItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/customers', label: '客户管理', icon: Users },
  { path: '/opportunities', label: '商机管理', icon: Briefcase },
  { path: '/contracts', label: '合同管理', icon: FileText },
  { path: '/payments', label: '回款管理', icon: CreditCard },
  { path: '/activities', label: '业务活动', icon: Activity },
]

const adminMenuItems = [
  { path: '/settings/users', label: '用户管理', icon: User },
  { path: '/settings/dict', label: '数据字典', icon: Settings },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <h1 className="text-lg font-semibold text-sidebar-foreground">CRM 系统</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <>
              <div className="my-4 border-t border-sidebar-border" />
              <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                系统管理
              </p>
              <div className="space-y-1">
                {adminMenuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between rounded-md bg-sidebar-accent p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role === 'admin' ? '管理员' : '普通用户'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
