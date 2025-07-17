'use client'

import { Pie } from 'react-chartjs-2'
import { ChartData, ChartOptions } from 'chart.js'
import { baseChartOptions, chartColors } from './chartConfig'
import { ChartSkeleton } from '../LoadingSkeleton'

interface PieChartProps {
  data: ChartData<'pie'>
  options?: ChartOptions<'pie'>
  height?: string | number
  loading?: boolean
}

export function PieChart({ 
  data, 
  options = {}, 
  height = '300px',
  loading = false 
}: PieChartProps) {
  if (loading) {
    return <ChartSkeleton />
  }

  const mergedOptions: ChartOptions<'pie'> = {
    ...baseChartOptions,
    ...options,
    plugins: {
      ...baseChartOptions.plugins,
      ...options.plugins,
      legend: {
        ...baseChartOptions.plugins?.legend,
        ...options.plugins?.legend,
        position: 'right'
      }
    }
  }

  // Apply default colors if not specified
  const chartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || [
        chartColors.primary,
        chartColors.secondary,
        chartColors.tertiary,
        chartColors.danger,
        chartColors.neutral,
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#84cc16', // lime
        '#f97316'  // orange
      ],
      borderColor: dataset.borderColor || '#000000',
      borderWidth: dataset.borderWidth || 2
    }))
  }

  return (
    <div style={{ height }}>
      <Pie data={chartData} options={mergedOptions} />
    </div>
  )
}