"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
}

export function DateTimePicker({
  date,
  onSelect,
  placeholder = "Pick a date and time",
  className,
  disabled,
  minDate
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState(
    date ? format(date, "HH:mm") : "12:00"
  )

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      newDate.setHours(hours, minutes)
      setSelectedDate(newDate)
      onSelect?.(newDate)
    } else {
      setSelectedDate(undefined)
      onSelect?.(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setTimeValue(time)
    
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours, minutes)
      setSelectedDate(newDate)
      onSelect?.(newDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP 'at' HH:mm")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => {
              if (minDate) {
                return date < minDate
              }
              return false
            }}
          />
          <div className="mt-3 flex items-center gap-2 px-3">
            <Clock className="h-4 w-4 text-zinc-400" />
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="flex-1 bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}