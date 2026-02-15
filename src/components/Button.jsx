import React from 'react'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'sc-btn'
  const variantClasses = {
    primary: 'sc-btn--primary',
    secondary: 'sc-btn--secondary',
    success: 'sc-btn--success',
    danger: 'sc-btn--danger',
    ghost: 'sc-btn--ghost',
  }

  const sizeClasses = {
    sm: 'sc-btn--sm',
    md: '',
    lg: 'sc-btn--lg',
  }

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'sc-btn--block',
    disabled && 'opacity-50 cursor-not-allowed',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  )
}
