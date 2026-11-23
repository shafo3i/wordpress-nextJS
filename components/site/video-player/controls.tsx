import {
  Expand,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react"
import styles from "./player.module.css"

export function mediaTime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function VideoControls({
  playing,
  muted,
  volume,
  current,
  duration,
  rate,
  fullscreen,
  pip,
  dict,
  toggle,
  seek,
  setVolume,
  setRate,
  toggleMute,
  toggleFullscreen,
  togglePip,
}: {
  playing: boolean
  muted: boolean
  volume: number
  current: number
  duration: number
  rate: number
  fullscreen: boolean
  pip: boolean
  dict: Record<string, string>
  toggle: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setRate: (rate: number) => void
  toggleMute: () => void
  toggleFullscreen: () => void
  togglePip: () => void
}) {
  const t = (key: string) => dict[`site.video.${key}`] || ""
  return (
    <div className={styles.controls} dir="ltr">
      <input
        className={styles.seek}
        style={{ backgroundImage: `linear-gradient(to right, var(--theme-primary, #fff) ${duration ? Math.min(100, current / duration * 100) : 0}%, #ffffff50 0)` }}
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(current, duration || 0)}
        disabled={!duration}
        aria-label={t("seek")}
        aria-valuetext={`${mediaTime(current)} / ${mediaTime(duration)}`}
        onChange={(event) => seek(Number(event.target.value))}
      />
      <div className={styles.row}>
        <button
          type="button"
          onClick={toggle}
          aria-label={t(playing ? "pause" : "play")}
          title={t(playing ? "pause" : "play")}
        >
          {playing ? <Pause /> : <Play />}
        </button>
        <button
          type="button"
          className={styles.skip}
          onClick={() => seek(current - 10)}
          disabled={!duration}
          aria-label={t("back")}
          title={t("back")}
        >
          <RotateCcw />
          <span>10</span>
        </button>
        <button
          type="button"
          className={styles.skip}
          onClick={() => seek(current + 10)}
          disabled={!duration}
          aria-label={t("forward")}
          title={t("forward")}
        >
          <RotateCw />
          <span>10</span>
        </button>
        <span className={styles.time}>
          {mediaTime(current)} <span>/ {mediaTime(duration)}</span>
        </span>
        <div className={styles.spacer} />
        <button
          type="button"
          onClick={toggleMute}
          aria-label={t(muted ? "unmute" : "mute")}
          title={t(muted ? "unmute" : "mute")}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <input
          className={styles.volume}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          aria-label={t("volume")}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <select
          className={styles.speed}
          aria-label={t("speed")}
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
        >
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
        {pip && (
          <button
            type="button"
            className={styles.pip}
            onClick={togglePip}
            aria-label={t("pip")}
            title={t("pip")}
          >
            <PictureInPicture2 />
          </button>
        )}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={t(fullscreen ? "exit_fullscreen" : "fullscreen")}
          title={t(fullscreen ? "exit_fullscreen" : "fullscreen")}
        >
          {fullscreen ? <Minimize /> : <Expand />}
        </button>
      </div>
    </div>
  )
}
