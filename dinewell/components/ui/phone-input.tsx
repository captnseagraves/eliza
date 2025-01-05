"use client"

import { forwardRef } from "react"
import { Input } from "./input"

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, onChange, value, ...props }, ref) => {
    const formatPhoneNumber = (input: string) => {
      // Remove the "+1 " prefix if it exists
      const withoutPrefix = input.startsWith("+1 ") ? input.slice(3) : input
      
      // Remove all non-digits and limit to 10 digits
      const digits = withoutPrefix.replace(/\D/g, "").slice(0, 10)
      
      // Format the number
      if (digits.length === 0) return "+1 "
      if (digits.length <= 3) return `+1 (${digits}`
      if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      
      // If user is deleting and at the base "+1 ", don't format
      if (rawValue === "+1 " || rawValue === "+1" || rawValue === "+") {
        onChange?.({ ...e, target: { ...e.target, value: "+1 " } })
        return
      }
      
      // If backspacing from "+1 ", keep it at "+1 "
      if (!rawValue) {
        onChange?.({ ...e, target: { ...e.target, value: "+1 " } })
        return
      }

      const formattedValue = formatPhoneNumber(rawValue)
      
      // Create a new event with the formatted value
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: formattedValue,
        },
      }
      
      onChange?.(newEvent as React.ChangeEvent<HTMLInputElement>)
    }

    // Ensure the initial value is formatted
    const displayValue = value ? formatPhoneNumber(value as string) : "+1 "

    return (
      <Input
        ref={ref}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        className={className}
        {...props}
      />
    )
  }
)

PhoneInput.displayName = "PhoneInput"
