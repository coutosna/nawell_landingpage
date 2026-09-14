interface NaWellMarkProps {
  className?: string;
}

export function NaWellMark({ className }: NaWellMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="10" r="2.5" fill="currentColor" opacity="0.45" />
      <circle cx="24" cy="10" r="2.5" fill="currentColor" opacity="0.75" />
      <circle cx="42" cy="10" r="2.5" fill="currentColor" opacity="0.45" />

      <path
        d="M6 10 L24 32"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M42 10 L24 32"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M24 10 L24 32"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M6 10 L42 10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.2"
      />

      <path
        d="M24 26 L31 32 L24 38 L17 32 Z"
        fill="currentColor"
      />
      <circle cx="24" cy="32" r="2.4" fill="currentColor" />
    </svg>
  );
}

interface NaWellLogoProps {
  className?: string;
  monogramClassName?: string;
  reverse?: boolean;
}

export function NaWellLogo({ className, monogramClassName, reverse }: NaWellLogoProps) {
  const textColor = reverse ? "text-white" : "text-foreground";
  const mutedColor = reverse ? "text-white/70" : "text-muted-foreground";

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <div
        className={`flex items-center justify-center rounded-2xl ${
          reverse ? "bg-white/10" : "bg-primary/10"
        }`}
      >
        <NaWellMark className={`h-9 w-9 m-1.5 ${reverse ? "text-white" : "text-primary"} ${monogramClassName ?? ""}`} />
      </div>
      <div className="leading-none">
        <p className={`font-manrope text-xl font-extrabold tracking-tight ${textColor}`}>
          NAWELL
        </p>
        <p className={`mt-1 text-[11px] font-medium ${mutedColor}`}>
          Transformamos Complexidade em Clareza.
        </p>
      </div>
    </div>
  );
}