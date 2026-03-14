import { useRef, useEffect, useState, memo } from "react";
import clsx from "clsx";
import { useAnimatedValue } from "../../hooks/use-animated-value.ts";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const display = useAnimatedValue(value);
  const prevRef = useRef(value);
  const [flashKey, setFlashKey] = useState(0);
  const [direction, setDirection] = useState<"up" | "down" | "neutral">(
    "neutral",
  );

  useEffect(() => {
    const prev = prevRef.current;
    if (value > prev) {
      setDirection("up");
      setFlashKey((k) => k + 1);
    } else if (value < prev) {
      setDirection("down");
      setFlashKey((k) => k + 1);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <span
      key={flashKey}
      className={clsx(
        "tabular-nums transition-colors duration-500",
        direction === "up" && "animate-flash-green",
        direction === "down" && "animate-flash-red",
        className,
      )}
    >
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
});
