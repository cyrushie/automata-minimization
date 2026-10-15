import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const strokeProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function PanelLeftIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  )
}

export function PanelRightIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M7 5.5v13a.6.6 0 0 0 .92.5l10.4-6.5a.6.6 0 0 0 0-1L7.92 5a.6.6 0 0 0-.92.5Z" fill="currentColor" />
    </svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <rect x="6.5" y="5" width="3.5" height="14" rx="1.1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="3.5" height="14" rx="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PrevIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M18.5 6.2v11.6a.6.6 0 0 1-.93.5L9.5 12.6v5.2a.6.6 0 0 1-.93.5L4 12.5a.6.6 0 0 1 0-1l4.57-2.8a.6.6 0 0 1 .93.5v5.2l8.07-5.7a.6.6 0 0 1 .93.5Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function NextIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M5.5 6.2v11.6a.6.6 0 0 0 .93.5l8.07-5.7v5.2a.6.6 0 0 0 .93.5l4.57-2.8a.6.6 0 0 0 0-1l-4.57-2.8a.6.6 0 0 0-.93.5v5.2L6.43 5.7a.6.6 0 0 0-.93.5Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ResetIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M5 5v6h6" />
      <path d="M5.1 11a7.5 7.5 0 1 1 1.9 6" />
    </svg>
  )
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 20h14" />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}

export function MaximizeIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9" />
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9" />
      <path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function LogoIcon(props: IconProps) {
  return (
    <svg {...strokeProps} {...props} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 10.5 14.5 8M14.5 8 13 14M13 14 9 10.5" strokeWidth={1.5} opacity={0.9} />
      <circle cx="9" cy="10.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="8" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="13" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
