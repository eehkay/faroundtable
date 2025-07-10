'use client'

import { Line } from 'react-chartjs-2'
import { ChartData, ChartOptions } from 'chart.js'
import { baseChartOptions, chartColors } from './chartConfig'
import { ChartSkeleton } from '../LoadingSkeleton'

interface LineChartProps {
  data: ChartData<'line'>
  options?: ChartOptions<'line'>
  height?: string | number
  loading?: boolean
}

export function LineChart({ 
  data, 
  options = {}, 
  height = '300px',
  loading = false 
}: LineChartProps) {
  if (loading) {
    return <ChartSkeleton />
  }

  const mergedOptions: ChartOptions<'line'> = {
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

  // Apply default colors and styling if not specified
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || [
        chartColors.primary,
        chartColors.secondary,
        chartColors.tertiary,
        chartColors.danger,
        chartColors.neutral
      ][index % 5],
      backgroundColor: dataset.backgroundColor || 'transparent',
      borderWidth: dataset.borderWidth || 2,
      tension: dataset.tension || 0.4,
      pointRadius: dataset.pointRadius || 4,
      pointHoverRadius: dataset.pointHoverRadius || 6,
      pointBackgroundColor: dataset.pointBackgroundColor || dataset.borderColor || chartColors.primary,
      pointBorderColor: dataset.pointBorderColor || '#000000',
      pointBorderWidth: dataset.pointBorderWidth || 2
    }))
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={mergedOptions} />
    </div>
  )
}