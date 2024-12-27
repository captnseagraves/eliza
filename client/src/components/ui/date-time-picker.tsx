import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker.css";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";

interface DateTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  className?: string;
}

export function DateTimePicker({ date, setDate, className }: DateTimePickerProps) {
  return (
    <div className={cn("relative", className)}>
      <DatePicker
        selected={date}
        onChange={(date: Date) => setDate(date)}
        showTimeSelect
        timeFormat="h:mm aa"
        timeIntervals={15}
        dateFormat="EEEE, MMM d, h:mm aa"
        timeCaption="Time"
        showPopperArrow={false}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        customInput={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold">
                  {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-sm text-muted-foreground">
                  {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            ) : (
              <span>Pick a date and time</span>
            )}
          </Button>
        }
      />
    </div>
  );
}
