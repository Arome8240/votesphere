import React from "react";
import { Button, ButtonProps } from "./button";
import DatePickerNative from "react-native-date-picker";
import { format } from "date-fns";
import { cn } from "@/utils";

interface DatePickerProps extends ButtonProps {
  value?: Date;
  onValueChange?: (date: Date) => void;
  placeholder?: string;
  mode?: "date" | "time" | "datetime";
}

const DatePicker = ({
  value,
  onValueChange,
  placeholder = "Select date",
  className,
  mode = "date",
  ...props
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        onPress={() => setOpen(true)}
        variant="outline"
        className={cn(
          "mt-0 justify-start border-gray-200 bg-gray-50 normal-case",
          {
            "text-gray-400": !value,
          },
          className
        )}
        {...props}
      >
        {value ? format(value, mode === "date" ? "PPP" : "p") : placeholder}
      </Button>
      <DatePickerNative
        modal
        open={open}
        mode={mode}
        date={value || new Date()}
        onConfirm={(date) => {
          setOpen(false);
          onValueChange?.(date);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </>
  );
};

export default DatePicker;
