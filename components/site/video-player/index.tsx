"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Play, RefreshCw } from "lucide-react"
import { featuredVideoUrl } from "@/lib/featured-video"
import { videoEmbedUrl } from "@/lib/post-media"
import { VideoControls } from "./controls"
import styles from "./player.module.css"

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export function LocalVideoPlayer({
  url,
  poster,
  title,
  dict,
}: {
  url: string
  poster?: string
  title: string
  dict: Record<string, string>
}) {
  const video = useRef<HTMLVideoElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const hydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  )
  const enhanced = hydrated && Boolean(dict["site.video.play"])
  const [playing, setPlaying] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [failed, setFailed] = useState(false)
  const [playFailed, setPlayFailed] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const t = (key: string) => dict[`site.video.${key}`] || ""
  useEffect(() => {
    const element = video.current
    const source = featuredVideoUrl(url)
    // Restore after React's development setup/cleanup check as well as URL changes.
    if (element && source) element.setAttribute("src", source)
    return () => {
      if (!element) return
      element.pause()
      element.removeAttribute("src")
      element.load()
    }
  }, [url])
  useEffect(() => {
    const change = () =>
      setFullscreen(document.fullscreenElement === wrapper.current)
    document.addEventListener("fullscreenchange", change)
    return () => document.removeEventListener("fullscreenchange", change)
  }, [])
  const safe = featuredVideoUrl(url)
  if (!safe || videoEmbedUrl(safe)) return null
  const toggle = async () => {
    const element = video.current
    if (!element) return
    if (!element.paused) {
      element.pause()
      return
    }
    setPlayFailed(false)
    try {
      await element.play()
    } catch {
      setPlayFailed(true)
    }
  }
  const seek = (time: number) => {
    if (video.current && duration > 0)
      video.current.currentTime = Math.max(0, Math.min(duration, time))
  }
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === wrapper.current)
        await document.exitFullscreen()
      else if (wrapper.current?.requestFullscreen)
        await wrapper.current.requestFullscreen()
      else
        (
          video.current as HTMLVideoElement & {
            webkitEnterFullscreen?: () => void
          }
        )?.webkitEnterFullscreen?.()
    } catch {
      /* Browser may refuse fullscreen; playback remains available. */
    }
  }
  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture()
      else await video.current?.requestPictureInPicture()
    } catch {
      /* Optional browser feature; never interrupt playback. */
    }
  }
  return (
    <div
      ref={wrapper}
      className={styles.player}
      data-video-player
      role="region"
      aria-label={title || t("player")}
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.target !== event.currentTarget &&
          event.target !== video.current
        )
          return
        if ([" ", "k", "ArrowLeft", "ArrowRight", "m", "f"].includes(event.key))
          event.preventDefault()
        if (event.key === " " || event.key === "k") void toggle()
        if (event.key === "ArrowLeft") seek(current - 10)
        if (event.key === "ArrowRight") seek(current + 10)
        if (event.key === "m" && video.current)
          video.current.muted = !video.current.muted
        if (event.key === "f") void toggleFullscreen()
      }}
    >
      <video
        ref={video}
        src={safe}
        poster={poster}
        controls={!enhanced}
        playsInline
        preload="none"
        aria-label={title || t("player")}
        onClick={() => void toggle()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => {
          setWaiting(false)
          setFailed(false)
        }}
        onError={() => {
          setFailed(true)
          setWaiting(false)
        }}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onDurationChange={(event) =>
          setDuration(
            Number.isFinite(event.currentTarget.duration)
              ? event.currentTarget.duration
              : 0
          )
        }
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume)
          setMuted(
            event.currentTarget.muted || event.currentTarget.volume === 0
          )
        }}
        onRateChange={(event) => setRate(event.currentTarget.playbackRate)}
      />
      {enhanced && (
        <>
          {!playing && !failed && (
            <button
              type="button"
              className={styles.bigPlay}
              onClick={() => void toggle()}
              aria-label={t("play")}
            >
              <Play fill="currentColor" />
            </button>
          )}
          {waiting && playing && (
            <span role="status" className={styles.message}>
              {t("loading")}
            </span>
          )}
          {failed && (
            <div className={styles.error}>
              <p role="alert">{t("error")}</p>
              <button
                type="button"
                onClick={() => {
                  setFailed(false)
                  video.current?.load()
                }}
              >
                <RefreshCw />
                {t("retry")}
              </button>
            </div>
          )}
          {playFailed && !failed && (
            <p role="status" className={styles.message}>
              {t("play_error")}
            </p>
          )}
          <VideoControls
            playing={playing}
            muted={muted}
            volume={volume}
            current={current}
            duration={duration}
            rate={rate}
            fullscreen={fullscreen}
            pip={enhanced && Boolean(document.pictureInPictureEnabled)}
            dict={dict}
            toggle={() => void toggle()}
            seek={seek}
            setVolume={(value) => {
              if (video.current) {
                video.current.volume = value
                video.current.muted = value === 0
              }
            }}
            setRate={(value) => {
              if (video.current) video.current.playbackRate = value
            }}
            toggleMute={() => {
              if (video.current) video.current.muted = !video.current.muted
            }}
            toggleFullscreen={() => void toggleFullscreen()}
            togglePip={() => void togglePip()}
          />
        </>
      )}
    </div>
  )
}
