
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// This is placeholder data. In a real app, you would fetch this based on the agency's properties.
const chartData = [
  { month: "Janvier", views: 112 },
  { month: "Février", views: 187 },
  { month: "Mars", views: 150 },
  { month: "Avril", views: 220 },
  { month: "Mai", views: 341 },
  { month: "Juin", views: 380 },
]

const chartConfig = {
  views: {
    label: "Vues",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function AgencyPerformanceChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 0, left: -12, bottom: 0}}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar dataKey="views" fill="var(--color-views)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
