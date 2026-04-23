import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'

async function main() {
  console.log('开始初始化数据库...')

  // 创建默认管理员用户
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123', 10)
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        email: 'admin@example.com',
        role: 'admin',
        isActive: true
      }
    })
    console.log('创建默认管理员用户: admin / Admin123')
  }

  // 创建字典数据
  const dictData = [
    // 客户来源
    { category: 'customer_source', code: 'online', label: '线上渠道', sortOrder: 1 },
    { category: 'customer_source', code: 'offline', label: '线下渠道', sortOrder: 2 },
    { category: 'customer_source', code: 'referral', label: '客户转介绍', sortOrder: 3 },
    { category: 'customer_source', code: 'exhibition', label: '展会', sortOrder: 4 },
    { category: 'customer_source', code: 'other', label: '其他', sortOrder: 5 },

    // 客户行业
    { category: 'industry', code: 'it', label: 'IT/互联网', sortOrder: 1 },
    { category: 'industry', code: 'finance', label: '金融', sortOrder: 2 },
    { category: 'industry', code: 'manufacture', label: '制造业', sortOrder: 3 },
    { category: 'industry', code: 'retail', label: '零售', sortOrder: 4 },
    { category: 'industry', code: 'education', label: '教育', sortOrder: 5 },
    { category: 'industry', code: 'healthcare', label: '医疗健康', sortOrder: 6 },
    { category: 'industry', code: 'realestate', label: '房地产', sortOrder: 7 },
    { category: 'industry', code: 'other', label: '其他', sortOrder: 8 },

    // 公司规模
    { category: 'company_size', code: '1-50', label: '1-50人', sortOrder: 1 },
    { category: 'company_size', code: '51-200', label: '51-200人', sortOrder: 2 },
    { category: 'company_size', code: '201-500', label: '201-500人', sortOrder: 3 },
    { category: 'company_size', code: '501-1000', label: '501-1000人', sortOrder: 4 },
    { category: 'company_size', code: '1000+', label: '1000人以上', sortOrder: 5 },

    // 客户状态
    { category: 'customer_status', code: 'potential', label: '潜在客户', sortOrder: 1 },
    { category: 'customer_status', code: 'following', label: '跟进中', sortOrder: 2 },
    { category: 'customer_status', code: 'interested', label: '有意向', sortOrder: 3 },
    { category: 'customer_status', code: 'closed', label: '已成交', sortOrder: 4 },
    { category: 'customer_status', code: 'dormant', label: '休眠', sortOrder: 5 },
    { category: 'customer_status', code: 'lost', label: '已流失', sortOrder: 6 },

    // 商机阶段
    { category: 'opportunity_stage', code: 'initial', label: '初步接洽', sortOrder: 1 },
    { category: 'opportunity_stage', code: 'requirement', label: '需求确认', sortOrder: 2 },
    { category: 'opportunity_stage', code: 'proposal', label: '方案报价', sortOrder: 3 },
    { category: 'opportunity_stage', code: 'negotiation', label: '商务谈判', sortOrder: 4 },
    { category: 'opportunity_stage', code: 'contract', label: '合同准备', sortOrder: 5 },
    { category: 'opportunity_stage', code: 'closed_won', label: '已成交', sortOrder: 6 },
    { category: 'opportunity_stage', code: 'closed_lost', label: '已流失', sortOrder: 7 },

    // 商机优先级
    { category: 'opportunity_priority', code: 'low', label: '低', sortOrder: 1 },
    { category: 'opportunity_priority', code: 'medium', label: '中', sortOrder: 2 },
    { category: 'opportunity_priority', code: 'high', label: '高', sortOrder: 3 },

    // 合同状态
    { category: 'contract_status', code: 'draft', label: '草稿', sortOrder: 1 },
    { category: 'contract_status', code: 'pending', label: '待审核', sortOrder: 2 },
    { category: 'contract_status', code: 'active', label: '已生效', sortOrder: 3 },
    { category: 'contract_status', code: 'fulfilled', label: '履行中', sortOrder: 4 },
    { category: 'contract_status', code: 'completed', label: '已完成', sortOrder: 5 },
    { category: 'contract_status', code: 'terminated', label: '已终止', sortOrder: 6 },

    // 付款方式
    { category: 'payment_method', code: 'bank_transfer', label: '银行转账', sortOrder: 1 },
    { category: 'payment_method', code: 'cash', label: '现金', sortOrder: 2 },
    { category: 'payment_method', code: 'check', label: '支票', sortOrder: 3 },
    { category: 'payment_method', code: 'alipay', label: '支付宝', sortOrder: 4 },
    { category: 'payment_method', code: 'wechat', label: '微信支付', sortOrder: 5 },
    { category: 'payment_method', code: 'other', label: '其他', sortOrder: 6 },

    // 活动类型
    { category: 'activity_type', code: 'phone', label: '电话', sortOrder: 1 },
    { category: 'activity_type', code: 'meeting', label: '会议', sortOrder: 2 },
    { category: 'activity_type', code: 'email', label: '邮件', sortOrder: 3 },
    { category: 'activity_type', code: 'visit', label: '拜访', sortOrder: 4 },
    { category: 'activity_type', code: 'demo', label: '演示', sortOrder: 5 },
    { category: 'activity_type', code: 'other', label: '其他', sortOrder: 6 },
  ]

  for (const item of dictData) {
    const existing = await prisma.dictItem.findUnique({
      where: {
        category_code: {
          category: item.category,
          code: item.code
        }
      }
    })

    if (!existing) {
      await prisma.dictItem.create({
        data: item
      })
    }
  }

  console.log('字典数据初始化完成')
  console.log('数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
