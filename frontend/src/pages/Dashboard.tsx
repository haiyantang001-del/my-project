import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { useDict } from '@/hooks/useDict'
import type { DashboardStats } from '@/types'
import { Users, Briefcase, FileText, CreditCard, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/MotionPrimitives'

export default function DashboardPage() {
  const { user } = useAuth()
  const { getLabel } = useDict()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/stats/dashboard')
      return response.data.data as DashboardStats
    }
  })

  if (isLoading) {
    return <div className="text-muted-foreground">加载中...</div>
  }

  const statCards = [
    { title: '总客户数', value: stats?.totalCustomers || 0, icon: Users, color: 'text-primary' },
    { title: '总商机数', value: stats?.totalOpportunities || 0, icon: Briefcase, color: 'text-info' },
    { title: '总合同数', value: stats?.totalContracts || 0, icon: FileText, color: 'text-success' },
    { title: '活跃用户', value: stats?.activeUsers || 0, icon: Activity, color: 'text-warning' },
  ]

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">仪表盘</h1>
            <p className="text-muted-foreground">欢迎回来，{user?.name}</p>
          </div>
        </div>
      </FadeIn>

      {/* Stats Cards */}
      <FadeIn delay={0.1}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeIn>

      {/* Amount Stats */}
      <FadeIn delay={0.2}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                合同总金额
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{Number(stats?.totalContractAmount || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                本月新增 {stats?.newContractsThisMonth || 0} 份合同
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                回款总金额
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{Number(stats?.totalPaymentAmount || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                本月回款 ¥{Number(stats?.paymentsThisMonth || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Distribution Charts */}
      <FadeIn delay={0.3}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">客户状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.customerByStatus?.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm">{getLabel('customer_status', item.status)}</span>
                    <span className="text-sm font-medium">{item._count.id}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">商机阶段分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.opportunityByStage?.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between">
                    <span className="text-sm">{getLabel('opportunity_stage', item.stage)}</span>
                    <span className="text-sm font-medium">{item._count.id}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Recent Activities */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentActivities?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无活动记录</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentActivities?.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.customer?.name} · {activity.createdBy?.name}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
