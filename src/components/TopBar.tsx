import type { Playback } from '../hooks/usePlayback'
import { DownloadIcon, PanelLeftIcon, PanelRightIcon } from './icons'
import { StepControls } from './StepControls'

interface TopBarProps {
  playback: Playback
  total: number
  canPlay: boolean
  onOpenDrawer: () => void
  leftOpen: boolean
  rightOpen: boolean
  onToggleLeft: () => void
  onToggleRight: () => void
}

const toggleButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-1 text-ink-muted shadow-sm transition hover:border-line-strong hover:bg-elevated hover:text-ink'

export function TopBar({
  playback,
  total,
  canPlay,
  onOpenDrawer,
  leftOpen,
  rightOpen,
  onToggleLeft,
  onToggleRight,
}: TopBarProps) {
  return (
    <nav className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface/80 px-4 py-2.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={onToggleLeft}
        aria-label="Toggle definitions panel"
        aria-pressed={leftOpen}
        title="Toggle definitions panel (Ctrl+B)"
        className={`${toggleButton} ${leftOpen ? '' : 'text-ink-faint'}`}
      >
        <PanelLeftIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onOpenDrawer}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-muted shadow-sm transition hover:border-line-strong hover:bg-elevated hover:text-ink"
      >
        <DownloadIcon className="h-4 w-4" />
        Download
      </button>

      <div className="ml-auto min-w-0">
        <StepControls playback={playback} total={total} disabled={!canPlay} />
      </div>

      <button
        type="button"
        onClick={onToggleRight}
        aria-label="Toggle animation panel"
        aria-pressed={rightOpen}
        title="Toggle animation panel (Ctrl+Shift+B)"
        className={`${toggleButton} ${rightOpen ? '' : 'text-ink-faint'}`}
      >
        <PanelRightIcon className="h-4 w-4" />
      </button>
    </nav>
  )
}
