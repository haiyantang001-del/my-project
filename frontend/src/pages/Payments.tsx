import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useDict } from '@/hooks/useDict'
import type { Payment, Contract, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/MotionPrimitives'

export default function PaymentsPage() {
  const { getOptions, getLabel } = useDict()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState({
    contractId: '',
    amount: 0,
    paymentDate: '',
    paymentMethod: '',
    referenceNo: '',
    notes: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      const response = await apiClient.get(`/payments?${params}`)
      return response.data.data as PaginatedResponse<Payment>
    }
  })

  const { data: contracts } = useQuery({
    queryKey: ['contracts-for-select'],
    queryFn: async () => {
      const response = await apiClient.get('/contracts?pageSize=1000')
      return response.data.data.items as Contract[]
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/payments', {
        ...data,
        amount: Number(data.amount)
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('回款记录创建成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiClient.put(`/payments/${id}`, {
        ...data,
        amount: Number(data.amount)
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('回款记录更新成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('回款记录已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    }
  })

  const resetForm = () => {
    setFormData({
      contractId: '',
      amount: 0,
      paymentDate: '',
      paymentMethod: '',
      referenceNo: '',
      notes: ''
    })
    setEditingPayment(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment)
    setFormData({
      contractId: payment.contractId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate.split('T')[0],
      paymentMethod: payment.paymentMethod || '',
      referenceNo: payment.referenceNo || '',
      notes: payment.notes || ''
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.contractId) {
      toast.error('请选择关联合同')
      return
    }
    if (formData.amount <= 0) {
      toast.error('回款金额必须大于 0')
      return
    }
    if (!formData.paymentDate) {
      toast.error('请选择回款日期')
      return
    }
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此回款记录吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const paymentMethodOptions = getOptions('payment_method')

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">回款管理</h1>
            <p className="text-muted-foreground">管理合同回款记录</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增回款
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>合同编号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>回款金额</TableHead>
                  <TableHead>回款日期</TableHead>
                  <TableHead>付款方式</TableHead>
                  <TableHead>收款人</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">加载中...</TableCell>
                  </TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">暂无数据</TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.contract?.contractNo}</TableCell>
                      <TableCell>{payment.contract?.customer?.name || '-'}</TableCell>
                      <TableCell className="text-primary font-medium">¥{Number(payment.amount).toLocaleString()}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.paymentMethod ? getLabel('payment_method', payment.paymentMethod) : '-'}</TableCell>
                      <TableCell>{payment.receivedBy?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(payment)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(payment.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {data && data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
                <span className="text-sm text-muted-foreground">第 {page} / {data.totalPages} 页</span>
                <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPayment ? '编辑回款' : '新增回款'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>关联合同 *</Label>
              <Select value={formData.contractId} onValueChange={(v) => setFormData({ ...formData, contractId: v })} disabled={!!editingPayment}>
                <SelectTrigger><SelectValue placeholder="请选择合同" /></SelectTrigger>
                <SelectContent>
                  {contracts?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.contractNo} - {c.name} ({c.customer?.name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>回款金额 *</Label>
                <Input type="number" min={0.01} step={0.01} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>回款日期 *</Label>
                <Input type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>付款方式</Label>
                <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                  <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>参考编号</Label>
                <Input value={formData.referenceNo} onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
