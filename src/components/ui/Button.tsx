import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { Icon } from './Icon'

/** Varianti M3 (common buttons) + `danger`/`success` come filled sui colori error/success. */
export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'danger' | 'success'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  filled: 'bg-primary text-on-primary hover:shadow-elev-1',
  tonal: 'bg-secondary-container text-on-secondary-container hover:shadow-elev-1',
  outlined: 'border border-outline text-primary',
  text: 'text-primary',
  elevated: 'bg-surface-container-low text-primary shadow-elev-1 hover:shadow-elev-2',
  danger: 'bg-error text-on-error hover:shadow-elev-1',
  success: 'bg-success text-on-success hover:shadow-elev-1',
}

// Disabilitato M3: contenitore on-surface 12%, contenuto on-surface 38%.
const DISABLED_CLASSES: Record<ButtonVariant, string> = {
  filled: 'disabled:bg-on-surface/12 aria-disabled:bg-on-surface/12',
  tonal: 'disabled:bg-on-surface/12 aria-disabled:bg-on-surface/12',
  outlined: 'disabled:border-on-surface/12 aria-disabled:border-on-surface/12',
  text: '',
  elevated: 'disabled:bg-on-surface/12 disabled:shadow-none',
  danger: 'disabled:bg-on-surface/12',
  success: 'disabled:bg-on-surface/12',
}

type Size = 'md' | 'lg'

interface CommonProps {
  variant?: ButtonVariant
  /** `md` = 40dp (standard M3), `lg` = 56dp per il kiosk touch. */
  size?: Size
  /** Nome icona Material Symbols (leading). */
  icon?: string
  trailingIcon?: string
  className?: string
  children?: ReactNode
}

function classi({ variant = 'filled', size = 'md', icon, className = '' }: CommonProps) {
  const padding =
    size === 'lg'
      ? `min-h-14 py-3 gap-3 text-title-m ${variant === 'text' ? 'px-5' : icon ? 'pl-6 pr-8' : 'px-8'}`
      : `min-h-10 py-2 gap-2 text-label-l ${variant === 'text' ? 'px-3' : icon ? 'pl-4 pr-6' : 'px-6'}`
  return [
    'state-layer touch-target inline-flex shrink-0 items-center justify-center rounded-full text-center select-none',
    'transition-shadow duration-150 ease-standard',
    'disabled:cursor-not-allowed disabled:text-on-surface/38 disabled:shadow-none',
    'aria-disabled:pointer-events-none aria-disabled:text-on-surface/38',
    padding,
    VARIANT_CLASSES[variant],
    DISABLED_CLASSES[variant],
    className,
  ].join(' ')
}

function Contenuto({ icon, trailingIcon, size, children }: CommonProps) {
  const s = size === 'lg' ? 24 : 18
  return (
    <>
      {icon && <Icon name={icon} size={s} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={s} />}
    </>
  )
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined; href?: undefined }
type ButtonAsLink = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: To; href?: undefined }
type ButtonAsAnchor = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; to?: undefined }

/**
 * Pulsante M3. Con `to` rende un `<Link>` del router, con `href` un `<a>` esterno: mai annidare
 * `<Button>` dentro `<Link>` (HTML non valido).
 */
export function Button(props: ButtonAsButton | ButtonAsLink | ButtonAsAnchor) {
  const { variant, size, icon, trailingIcon, className, children, ...rest } = props
  const cls = classi({ variant, size, icon, className })
  const inner = (
    <Contenuto icon={icon} trailingIcon={trailingIcon} size={size}>
      {children}
    </Contenuto>
  )
  if (rest.to !== undefined) {
    const { to, ...a } = rest as ButtonAsLink
    return (
      <Link to={to} className={cls} {...a}>
        {inner}
      </Link>
    )
  }
  if (rest.href !== undefined) {
    return (
      <a className={cls} {...(rest as ButtonAsAnchor)}>
        {inner}
      </a>
    )
  }
  const b = rest as ButtonAsButton
  return (
    <button type="button" className={cls} {...b}>
      {inner}
    </button>
  )
}

type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined'

const ICON_VARIANT: Record<IconButtonVariant, string> = {
  standard: 'text-on-surface-variant',
  filled: 'bg-primary text-on-primary',
  tonal: 'bg-secondary-container text-on-secondary-container',
  outlined: 'border border-outline text-on-surface-variant',
}

/** Icon button M3: 40dp visivi, 48dp di area di tocco, `aria-label` obbligatorio. */
export function IconButton({
  icon,
  label,
  variant = 'standard',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string; variant?: IconButtonVariant }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`state-layer touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:text-on-surface/38 ${ICON_VARIANT[variant]} ${className}`}
      {...props}
    >
      <Icon name={icon} />
    </button>
  )
}

/** FAB esteso M3 (azione principale di schermata su mobile). */
export function Fab({
  icon,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`state-layer inline-flex h-14 items-center gap-3 rounded-lg bg-primary-container pl-4 pr-5 text-label-l text-on-primary-container shadow-elev-3 disabled:opacity-60 ${className}`}
      {...props}
    >
      <Icon name={icon} />
      {children}
    </button>
  )
}
