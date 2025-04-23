import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  View,
} from "react-native";
import React from "react";
import { cva, VariantProps } from "class-variance-authority";
import { cn, extractTextClasses } from "@/utils";

import { Href, router } from "expo-router";
import { Text } from "./text";

const buttonVariant = cva(
  "flex flex-row items-center justify-center  overflow-hidden  rounded-lg gap-x-2  capitalize",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white",
        destructive: "bg-danger text-white",
        outline: "border border-gray-300 text-gray-800",
        secondary: "bg-blue-100 text-blue-600",
        ghost: "text-gray-800 normal-case",
        gray: "text-gray-900 normal-case bg-gray-100",
        white: "text-gray-900 normal-case bg-white",
        link: "underline",
      },
      full: {
        true: "w-full my-1",
        false: "self-start",
      },
      size: {
        default: "px-3.5 h-14 text-base",
        sm: "px-2 h-12 text-base",
        lg: "px-4 h-16",
        xs: "px-5 h-10 text-sm",
        icon: "size-14 w-auto self-start",
        "icon-sm": "size-12 w-auto self-start",
        "icon-xs": "size-8 w-auto self-start",
      },

      disabled: {
        true: "opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      full: true,
    },
  },
);

export type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariant> & {
    children?: React.ReactNode;
    loading?: boolean;
    href?: Href;
    icon?: React.ReactNode;
    iconRight?: React.ReactNode;
    textClassName?: string;
  };

const Button = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      className,
      children,
      loading,
      disabled,
      href,
      onPress,
      icon: Icon = null,
      iconRight: IconRight = null,
      full,
      size = "default",
      textClassName,
      ...props
    },
    ref,
  ) => {
    const classes = buttonVariant({
      ...props,
      disabled,
      className,
      full: size.includes("icon") ? false : full,
      size,
    });
    const textClasses = extractTextClasses(classes);
    const handlePress = React.useCallback(
      (event: GestureResponderEvent) => {
        if (href) {
          navigate(href);
        } else {
          onPress && onPress(event);
        }
      },
      [href, onPress],
    );

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={loading || disabled}
        className={cn(classes)}
        {...props}
      >
        {loading && (
          <View className="absolute flex items-center justify-center">
            <ActivityIndicator size="small" color={"#fff"} />
          </View>
        )}
        {Icon && Icon}
        {!!children && (
          <Text
            numberOfLines={1}
            className={cn(
              "w-fit text-center align-middle font-semibold",
              textClasses,
              textClassName,
              {
                "text-transparent": loading,
                underline: props.variant === "link",
              },
            )}
          >
            {children}
          </Text>
        )}
        {IconRight && IconRight}
      </Pressable>
    );
  },
);

Button.displayName = "Button";

export { Button };

const navigate = (href: Href) => {
  // @ts-ignore
  if (href === "-1" || href === "back") {
    router.back();
  } else {
    router.push(href);
  }
};
