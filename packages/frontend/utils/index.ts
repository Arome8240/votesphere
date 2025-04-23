import { type ClassValue, clsx } from "clsx";

import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const textClassRegex =
  /(\b(text|font|leading|tracking|letter|italic|underline|line|no-underline|whitespace|decoration|normal)-\S+\b)|(uppercase|lowercase|capitalize|normal-case|truncate)/g;

const classNameCache = new Map<string, string>();

export const extractTextClasses = (className: string) => {
  if (classNameCache.has(className)) return classNameCache.get(className);
  const matches = className.match(textClassRegex);
  const matchedClasses = matches ? matches.join(" ") : "";
  classNameCache.set(className, matchedClasses);
  return matchedClasses;
};
