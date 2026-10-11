'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface CategorySlice {
  name: string
  value: number
  color: string
}

export function CategoryChart({
  data,
  currency,
}: {
  data: CategorySlice[]
  currency: string
}) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              border: '1px solid #e6ecea',
              borderRadius: 8,
              fontSize: 11,
              boxShadow: '0 4px 12px rgba(0,0,0,.06)',
            }}
            formatter={(v, name) => [
              `${Number(v).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ${currency}/ay`,
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
