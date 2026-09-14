import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border-l-4 border p-4 shadow-md transition-all duration-200 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-5 [&>svg]:w-5",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-l-primary/50 hover:shadow-lg hover:border-l-primary",
        destructive: "bg-gradient-to-r from-destructive/5 to-transparent border-l-destructive text-destructive-foreground dark:border-destructive [&>svg]:text-destructive hover:shadow-lg hover:shadow-destructive/10 hover:from-destructive/10",
        warning: "bg-gradient-to-r from-warning/5 to-transparent border-l-warning text-warning-foreground dark:border-warning [&>svg]:text-warning hover:shadow-lg hover:shadow-warning/10 hover:from-warning/10",
        success: "bg-gradient-to-r from-success/5 to-transparent border-l-success text-success-foreground dark:border-success [&>svg]:text-success hover:shadow-lg hover:shadow-success/10 hover:from-success/10",
        info: "bg-gradient-to-r from-primary/5 to-transparent border-l-primary text-foreground dark:border-primary [&>svg]:text-primary hover:shadow-lg hover:shadow-primary/10 hover:from-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
