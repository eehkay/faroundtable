"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface RangeSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string
  formatValue?: (value: number) => string
  showValues?: boolean
  prefix?: string
  suffix?: string
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(
  ({ 
    className, 
    label, 
    formatValue = (v) => {
      if (v === undefined || v === null) return '0'
      return v.toString()
    }, 
    showValues = true,
    prefix = "",
    suffix = "",
    defaultValue,
    value,
    ...props 
  }, ref) => {
    const currentValue = React.useMemo(() => {
      const val = value || defaultValue || [0, 100]
      return Array.isArray(val) ? val : [val]
    }, [value, defaultValue])
    
    return (
      <div className="w-full space-y-2">
        {(label || showValues) && (
          <div className="flex items-center justify-between text-sm">
            {label && (
              <span className="font-medium text-gray-700 dark:text-gray-100">
                {label}
              </span>
            )}
            {showValues && currentValue && currentValue.length > 0 && (
              <span className="text-gray-600 dark:text-gray-400">
                {currentValue.length === 1 
                  ? `${prefix}${formatValue(currentValue[0])}${suffix}`
                  : currentValue.length >= 2
                    ? `${prefix}${formatValue(currentValue[0])}${suffix} - ${prefix}${formatValue(currentValue[1])}${suffix}`
                    : ''
                }
              </span>
            )}
          </div>
        )}
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          defaultValue={defaultValue}
          value={value}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#141414] dark:bg-[#141414]">
            <SliderPrimitive.Range className="absolute h-full bg-[#3b82f6] dark:bg-[#3b82f6]" />
          </SliderPrimitive.Track>
          {currentValue.map((_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              className="block h-5 w-5 rounded-full border-2 border-[#3b82f6] bg-white dark:bg-[#1f1f1f] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:border-[#2563eb] hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]"
            />
          ))}
        </SliderPrimitive.Root>
      </div>
    )
  }
)

RangeSlider.displayName = "RangeSlider"

export { RangeSlider }