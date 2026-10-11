'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface SpendPoint {
  label: string
  value: number
}

export function SpendChart({ data, currency }: { data: SpendPoint[]; currency: string }) {
  const formatValue = (v: number) =>
    `${v.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ${currency}`
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 4, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e9871" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#0e9871" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={60}
            tickFormatter={(v: number) => v.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid #e6ecea',
              borderRadius: 8,
              fontSize: 11,
              boxShadow: '0 4px 12px rgba(0,0,0,.06)',
            }}
            formatter={(v) => [formatValue(Number(v)), 'Gider']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0e9871"
            strokeWidth={2}
            fill="url(#fillGreen)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
