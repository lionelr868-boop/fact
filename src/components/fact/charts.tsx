'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  ResponsiveContainer, RadialBarChart, RadialBar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

const COLORS = {
  green: '#388E3C',
  greenDark: '#1B5E20',
  golden: '#b8860b',
  goldenLight: '#fbbf24',
  purple: '#7B1FA2',
  purpleLight: '#CE93D8',
  blue: '#4A148C',
  rose: '#c62828',
  emerald: '#2E7D32',
  teal: '#14b8a6',
  amber: '#d4a017',
  orange: '#f97316',
  olive: '#827717',
  violet: '#6d28d9',
  cyan: '#0891b2',
  lime: '#65a30d',
}

// ==================== SEASONAL BAR CHART ====================

interface SeasonalBarChartProps {
  data: { season: string; income: number; expense: number; profitability: number }[]
}

const seasonalConfig: ChartConfig = {
  income: { label: 'المداخيل', color: COLORS.green },
  expense: { label: 'المصاريف', color: COLORS.rose },
  profitability: { label: 'الربحية %', color: COLORS.golden },
}

export function SeasonalBarChart({ data }: SeasonalBarChartProps) {
  return (
    <ChartContainer config={seasonalConfig} className="min-h-[280px] w-full">
      <ComposedChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="season" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          formatter={(value: number, name: string) => {
            if (name === 'الربحية %') return [`${value.toFixed(1)}%`, name]
            return [new Intl.NumberFormat('en-US').format(value) + ' دج', name]
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="income" name="المداخيل" fill={COLORS.green} radius={[4, 4, 0, 0]} />
        <Bar yAxisId="left" dataKey="expense" name="المصاريف" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="profitability" name="الربحية %" stroke={COLORS.golden} strokeWidth={2} dot={{ fill: COLORS.golden, r: 4 }} />
      </ComposedChart>
    </ChartContainer>
  )
}

// ==================== PROFITABILITY GAUGE ====================

interface ProfitabilityGaugeProps {
  value: number
  label: string
  size?: number
}

export function ProfitabilityGauge({ value, label, size = 160 }: ProfitabilityGaugeProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const color = clampedValue > 30 ? COLORS.green : clampedValue > 15 ? COLORS.golden : COLORS.rose
  const data = [{ name: label, value: clampedValue, fill: color }]

  return (
    <div className="flex flex-col items-center gap-2">
      <ResponsiveContainer width={size} height={size}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          data={data}
          startAngle={180}
          endAngle={0}
          barSize={12}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background={{ fill: '#e5e7eb30' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center -mt-8">
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(clampedValue)}%</span>
        {label && <p className="text-xs text-muted-foreground mt-1">{label}</p>}
      </div>
    </div>
  )
}

// ==================== CATEGORY PIE CHART ====================

interface CategoryPieChartProps {
  data: { name: string; value: number; color?: string }[]
}

const pieColors = [COLORS.green, COLORS.golden, COLORS.purple, COLORS.blue, COLORS.rose, COLORS.teal, COLORS.amber, COLORS.olive, COLORS.violet, COLORS.cyan, COLORS.lime, COLORS.orange]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const config: ChartConfig = {}
  data.forEach((d, i) => {
    config[d.name] = { label: d.name, color: d.color || pieColors[i % pieColors.length] }
  })

  return (
    <ChartContainer config={config} className="min-h-[280px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          formatter={(value: number) => new Intl.NumberFormat('en-US').format(value) + ' دج'}
        />
        <Legend />
      </PieChart>
    </ChartContainer>
  )
}

// ==================== TREND LINE CHART ====================

interface TrendLineChartProps {
  data: { season: string; profitability: number }[]
}

const trendConfig: ChartConfig = {
  profitability: { label: 'الربحية', color: COLORS.purple },
}

export function TrendLineChart({ data }: TrendLineChartProps) {
  return (
    <ChartContainer config={trendConfig} className="min-h-[200px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="season" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="profitability"
          name="الربحية"
          stroke={COLORS.purple}
          strokeWidth={2}
          dot={{ fill: COLORS.purple, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

// ==================== INVENTORY BAR CHART ====================

interface InventoryBarChartProps {
  data: { name: string; qtyIn: number; qtyOut: number; balance: number }[]
}

const inventoryConfig: ChartConfig = {
  qtyIn: { label: 'الكمية الداخلة', color: COLORS.green },
  qtyOut: { label: 'الكمية الخارجة', color: COLORS.rose },
  balance: { label: 'الرصيد', color: COLORS.golden },
}

export function InventoryBarChart({ data }: InventoryBarChartProps) {
  return (
    <ChartContainer config={inventoryConfig} className="min-h-[280px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        />
        <Legend />
        <Bar dataKey="qtyIn" name="الكمية الداخلة" fill={COLORS.green} radius={[4, 4, 0, 0]} />
        <Bar dataKey="qtyOut" name="الكمية الخارجة" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
        <Bar dataKey="balance" name="الرصيد" fill={COLORS.golden} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

// ==================== MONTHLY AREA CHART ====================

interface MonthlyAreaChartProps {
  data: { month: string; income: number; expense: number }[]
}

const monthlyConfig: ChartConfig = {
  income: { label: 'المداخيل', color: COLORS.green },
  expense: { label: 'المصاريف', color: COLORS.rose },
}

export function MonthlyAreaChart({ data }: MonthlyAreaChartProps) {
  return (
    <ChartContainer config={monthlyConfig} className="min-h-[280px] w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          formatter={(value: number) => new Intl.NumberFormat('en-US').format(value) + ' دج'}
        />
        <Legend />
        <Area type="monotone" dataKey="income" name="المداخيل" stroke={COLORS.green} fill="url(#incomeGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="expense" name="المصاريف" stroke={COLORS.rose} fill="url(#expenseGrad)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  )
}

// ==================== CASH FLOW CHART (NEW) ====================

interface CashFlowChartProps {
  data: { month: string; income: number; expense: number; net: number }[]
}

const cashFlowConfig: ChartConfig = {
  income: { label: 'المداخيل', color: COLORS.green },
  expense: { label: 'المصاريف', color: COLORS.rose },
  net: { label: 'صافي التدفق', color: COLORS.purple },
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <ChartContainer config={cashFlowConfig} className="min-h-[280px] w-full">
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          formatter={(value: number) => new Intl.NumberFormat('en-US').format(value) + ' دج'}
        />
        <Legend />
        <Bar dataKey="income" name="المداخيل" fill={COLORS.green} radius={[4, 4, 0, 0]} opacity={0.7} />
        <Bar dataKey="expense" name="المصاريف" fill={COLORS.rose} radius={[4, 4, 0, 0]} opacity={0.7} />
        <Line type="monotone" dataKey="net" name="صافي التدفق" stroke={COLORS.purple} strokeWidth={3} dot={{ fill: COLORS.purple, r: 5 }} activeDot={{ r: 7 }} />
      </ComposedChart>
    </ChartContainer>
  )
}

// ==================== INVENTORY MOVEMENT CHART (NEW) ====================

interface InventoryMovementChartProps {
  data: { category: string; qtyIn: number; qtyOut: number }[]
}

const invMoveConfig: ChartConfig = {
  qtyIn: { label: 'الوارد', color: COLORS.green },
  qtyOut: { label: 'الصادر', color: COLORS.rose },
}

export function InventoryMovementChart({ data }: InventoryMovementChartProps) {
  return (
    <ChartContainer config={invMoveConfig} className="min-h-[280px] w-full">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        />
        <Legend />
        <Bar dataKey="qtyIn" name="الوارد" fill={COLORS.green} radius={[0, 4, 4, 0]} />
        <Bar dataKey="qtyOut" name="الصادر" fill={COLORS.rose} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

// ==================== GOVERNANCE RADAR CHART (NEW) ====================

interface GovernanceRadarProps {
  kpis: { id: string; name: string; value: number; type: string }[]
}

export function GovernanceRadarChart({ kpis }: GovernanceRadarProps) {
  const radarData = kpis
    .filter(k => k.id !== 'kpi08')
    .map(k => ({
      indicator: k.name.replace('نسبة ', '').replace('الموسمية ', '').substring(0, 15),
      value: k.type === 'trend' ? Math.max(0, Math.min(100, 50 + k.value)) :
             k.type === 'icons' ? Math.min(100, (k.value / 16) * 100 * 3) :
             k.type === 'number' ? Math.min(100, k.value / 2000) :
             Math.min(100, k.value),
      fullMark: 100,
    }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e5e7eb40" />
        <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
        <Radar
          name="الحوكمة"
          dataKey="value"
          stroke={COLORS.purple}
          fill={COLORS.purple}
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          formatter={(value: number) => `${Math.round(value)}%`}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ==================== INVENTORY VALUE BY TYPE (NEW) ====================

interface InventoryTypeChartProps {
  data: { type: string; value: number; count: number; balance: number }[]
}

const typeLabels: Record<string, string> = {
  input: 'مدخلات الإنتاج',
  crop: 'محاصيل',
  animal_product: 'منتجات حيوانية',
  equipment: 'معدات',
  feed: 'أعلاف',
  medication: 'أدوية بيطرية',
}

const typeConfig: ChartConfig = {
  value: { label: 'القيمة', color: COLORS.golden },
}

export function InventoryTypeChart({ data }: InventoryTypeChartProps) {
  const chartData = data.map(d => ({
    type: typeLabels[d.type] || d.type,
    value: d.value,
    count: d.count,
  }))

  return (
    <ChartContainer config={typeConfig} className="min-h-[280px] w-full">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="type" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          formatter={(value: number, name: string) => {
            if (name === 'القيمة') return new Intl.NumberFormat('en-US').format(value) + ' دج'
            return value
          }}
        />
        <Legend />
        <Bar dataKey="value" name="القيمة" fill={COLORS.golden} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

export { COLORS }
