import { useState, type InputHTMLAttributes } from 'react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function PasswordInput({
  className = '',
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ariaLabel = isVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? 'text' : 'password'}
        className={`${className} w-full pr-12`}
      />

      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={isVisible}
        aria-controls={props.id}
        disabled={props.disabled}
        onClick={() => setIsVisible((visible) => !visible)}
        onMouseDown={(event) => event.preventDefault()}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-zinc-500 transition hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        {isVisible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.7A9.1 9.1 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.8 17.8 0 0 1-2.8 3.7" />
      <path d="M6.6 6.9C4 8.6 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4.5-1.2" />
    </svg>
  )
}
