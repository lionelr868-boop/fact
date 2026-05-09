'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  ResponsiveContainer, RadialBarChart, RadialBar
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
}

interface SeasonalBarChartProps {
  data: { season: string; income: number; expense: number }[]
}

const seasonalConfig: ChartConfig = {
  income: { label: 'المداخيل', color: COLORS.green },
  expense: { label: 'المصاريف', color: COLORS.rose },
}

export function SeasonalBarChart({ data }: SeasonalBarChartProps) {
  return (
    <ChartContainer config={seasonalConfig} className="min-h-[250px] w-full">
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="season" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="income" name="المداخيل" fill={COLORS.green} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="المصاريف" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

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
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  )
}

interface CategoryPieChartProps {
  data: { name: string; value: number; color?: string }[]
}

const pieColors = [COLORS.green, COLORS.golden, COLORS.purple, COLORS.blue, COLORS.rose, COLORS.teal, COLORS.amber, COLORS.olive]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const config: ChartConfig = {}
  data.forEach((d, i) => {
    config[d.name] = { label: d.name, color: d.color || pieColors[i % pieColors.length] }
  })

  return (
    <ChartContainer config={config} className="min-h-[250px] w-full">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ChartContainer>
  )
}

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
    <ChartContainer config={inventoryConfig} className="min-h-[250px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="qtyIn" name="الكمية الداخلة" fill={COLORS.green} radius={[4, 4, 0, 0]} />
        <Bar dataKey="qtyOut" name="الكمية الخارجة" fill={COLORS.rose} radius={[4, 4, 0, 0]} />
        <Bar dataKey="balance" name="الرصيد" fill={COLORS.golden} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

interface MonthlyAreaChartProps {
  data: { month: string; income: number; expense: number }[]
}

const monthlyConfig: ChartConfig = {
  income: { label: 'المداخيل', color: COLORS.green },
  expense: { label: 'المصاريف', color: COLORS.rose },
}

export function MonthlyAreaChart({ data }: MonthlyAreaChartProps) {
  return (
    <ChartContainer config={monthlyConfig} className="min-h-[250px] w-full">
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
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="income" name="المداخيل" stroke={COLORS.green} fill="url(#incomeGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="expense" name="المصاريف" stroke={COLORS.rose} fill="url(#expenseGrad)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  )
}

export { COLORS }
