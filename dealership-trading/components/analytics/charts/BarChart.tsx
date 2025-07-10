'use client'

import { Bar } from 'react-chartjs-2'
import { ChartData, ChartOptions } from 'chart.js'
import { baseChartOptions, chartColors } from './chartConfig'
import { ChartSkeleton } from '../LoadingSkeleton'

interface BarChartProps {
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
  height?: string | number
  loading?: boolean
}

export function BarChart({ 
  data, 
  options = {}, 
  height = '300px',
  loading = false 
}: BarChartProps) {
  if (loading) {
    return <ChartSkeleton />
  }

  const mergedOptions: ChartOptions<'bar'> = {
    ...baseChartOptions,
    ...options,
    plugins: {
      ...baseChartOptions.plugins,
      ...options.plugins
    },
    scales: {
      ...baseChartOptions.scales,
      ...options.scales
    }
  }

  // Apply default colors if not specified
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        chartColors.primary,
        chartColors.secondary,
        chartColors.tertiary,
        chartColors.danger,
        chartColors.neutral
      ][index % 5],
      borderColor: dataset.borderColor || 'transparent',
      borderWidth: dataset.borderWidth || 0
    }))
  }

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={mergedOptions} />
    </div>
  )
}