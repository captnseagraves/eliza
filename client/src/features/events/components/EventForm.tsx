import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Event } from "@/types/event";
import { LocationPicker } from "@/components/ui/location-picker";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.object({
    address: z.string().min(1, "Location is required"),
    lat: z.number(),
    lng: z.number(),
  }),
  dateTime: z.date(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  onSubmit: (data: EventFormData) => void;
  initialData?: Event;
  isLoading?: boolean;
}

export function EventForm({ onSubmit, initialData, isLoading }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          dateTime: new Date(initialData.dateTime),
        }
      : {
          dateTime: new Date(),
          location: {
            address: "",
            lat: 0,
            lng: 0,
          },
        },
  });

  const selectedDate = watch("dateTime");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Event title"
          className={cn(errors.title && "border-red-500")}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Event description"
          className={cn(errors.description && "border-red-500")}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <LocationPicker
          onLocationSelect={(location) => {
            setValue("location", location);
          }}
          className="w-full"
        />
        {errors.location && (
          <p className="text-sm text-red-500">{errors.location.address?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Date and Time</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setValue("dateTime", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : initialData ? "Update Event" : "Create Event"}
      </Button>
    </form>
  );
}
