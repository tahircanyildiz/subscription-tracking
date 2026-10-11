import { cn } from '@/lib/utils'

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-[12px] font-medium text-[#4a5568]', className)}
      {...props}
    />
  )
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-[#dbe4e1] bg-white px-3 text-[13px] text-[#102a43] placeholder:text-[#a0aec0] outline-none transition focus:border-[#0e7c66] focus:ring-2 focus:ring-[#0e7c66]/15 disabled:cursor-not-allowed disabled:bg-[#f5f8f7]',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full appearance-none rounded-lg border border-[#dbe4e1] bg-white px-3 text-[13px] text-[#102a43] outline-none transition focus:border-[#0e7c66] focus:ring-2 focus:ring-[#0e7c66]/15 disabled:cursor-not-allowed disabled:bg-[#f5f8f7]',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-[#dbe4e1] bg-white px-3 py-2.5 text-[13px] text-[#102a43] placeholder:text-[#a0aec0] outline-none transition focus:border-[#0e7c66] focus:ring-2 focus:ring-[#0e7c66]/15',
        className,
      )}
      {...props}
    />
  )
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn('size-4 accent-[#0e7c66]', className)}
      {...props}
    />
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] font-medium text-[#dc2626]">{message}</p>
}

export function FormMessage({
  error,
  success,
}: {
  error?: string | null
  success?: string | null
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[12px] font-medium text-[#b91c1c]"
      >
        {error}
      </div>
    )
  }
  if (success) {
    return (
      <div
        role="status"
        className="rounded-lg border border-[#c9ded7] bg-[#f4fbf8] px-3.5 py-2.5 text-[12px] font-medium text-[#0e7c66]"
      >
        {success}
      </div>
    )
  }
  return null
}
