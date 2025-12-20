"use client";

import { useEffect, useState } from "react";

interface FormattedDateProps {
  date: Date | string | null | undefined;
  fallback?: string;
}

/**
 * Client-side date formatting component to avoid hydration mismatch
 * Server renders the fallback, client renders the localized date
 */
export function FormattedDate({ date, fallback = "-" }: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string>(fallback);

  useEffect(() => {
    if (date) {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      setFormatted(dateObj.toLocaleString());
    }
  }, [date]);

  return <span suppressHydrationWarning>{formatted}</span>;
}
