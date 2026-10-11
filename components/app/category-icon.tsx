import {
  Clapperboard,
  Cloud,
  Code,
  Dumbbell,
  Gamepad2,
  Layers,
  Music2,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  clapperboard: Clapperboard,
  music: Music2,
  code: Code,
  cloud: Cloud,
  gamepad: Gamepad2,
  newspaper: Newspaper,
  dumbbell: Dumbbell,
  layers: Layers,
}

export function CategoryIcon({
  icon,
  color,
  size = 15,
}: {
  icon: string | null | undefined
  color: string | null | undefined
  size?: number
}) {
  const Icon = (icon && ICONS[icon]) || Layers
  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-lg"
      style={{
        backgroundColor: color ? `${color}1a` : '#f1f5f9',
        color: color ?? '#64748b',
      }}
    >
      <Icon size={size} />
    </div>
  )
}

export function CategoryDot({ color }: { color: string | null | undefined }) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? '#94a3b8' }}
    />
  )
}
