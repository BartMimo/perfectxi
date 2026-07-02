function Icon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconBall({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 7 16 10 14.5 15 9.5 15 8 10" fill="currentColor" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="16" y1="10" x2="21" y2="8" />
      <line x1="8" y1="10" x2="3" y2="8" />
      <line x1="14.5" y1="15" x2="17.5" y2="19.5" />
      <line x1="9.5" y1="15" x2="6.5" y2="19.5" />
    </Icon>
  );
}

export function IconGlobe({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Icon>
  );
}

export function IconStar({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </Icon>
  );
}

export function IconBolt({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" />
    </Icon>
  );
}

export function IconTrophy({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Icon>
  );
}

export function IconShirt({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </Icon>
  );
}

export function IconChart({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </Icon>
  );
}

export function IconUser({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}

export function IconClock({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

export function IconPlay({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <polygon points="6 3 20 12 6 21" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconPause({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="5" y="4" width="4.5" height="16" rx="1.5" fill="currentColor" stroke="none" />
      <rect x="14.5" y="4" width="4.5" height="16" rx="1.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconPencil({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </Icon>
  );
}

export function IconChevronRight({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <polyline points="9 18 15 12 9 6" />
    </Icon>
  );
}
