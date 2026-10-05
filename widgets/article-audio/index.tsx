"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause, Radio, Disc } from "lucide-react";
import manifest from "./widget.json";
import type { WidgetModule, WidgetAdminFormProps, WidgetRenderProps } from "../types";

export function ArticleAudioAdminForm({ item, onChange, dict, direction }: WidgetAdminFormProps) {
  const isRtl = direction === "rtl";
  const audioUrl = item.config?.audioUrl || "";
  const stationName = item.config?.stationName || (isRtl ? "إذاعة غرفة الأخبار" : "Newsroom Daily Brief");
  const episodeTitle = item.config?.episodeTitle || (isRtl ? "الموجز الإخباري الصباحي" : "Morning Intelligence Brief");
  const host = item.config?.host || (isRtl ? "فريق التحرير" : "Editorial Desk");
  const duration = item.config?.duration || "08:45";
  const isLiveStream = Boolean(item.config?.isLiveStream);

  return (
    <div className="space-y-3 text-start">
      <div>
        <label className="block text-[0.75rem] font-medium text-[#50575e] mb-1">
          {dict?.["admin.widgets.widget_title"] || (isRtl ? "عنوان الأداة" : "Widget Title")}
        </label>
        <input
          type="text"
          value={item.title || ""}
          placeholder={dict?.["admin.widgets.descriptor.plugin_audio.name"] || manifest.name}
          onChange={(e) => onChange({ title: e.target.value })}
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[0.8125rem] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
          {isRtl ? "رابط ملف الصوت أو البث المباشر (MP3 / Audio URL)" : "Audio Stream / MP3 File URL"}
        </label>
        <input
          type="url"
          value={audioUrl}
          placeholder="https://example.com/audio/podcast-episode.mp3"
          onChange={(e) =>
            onChange({
              config: { ...item.config, audioUrl: e.target.value },
            })
          }
          className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
        />
        <p className="text-[0.625rem] text-[#646970] mt-0.5">
          {isRtl
            ? "يدعم روابط MP3 و M4A وبث راديو Icecast/HLS المباشر."
            : "Supports MP3, M4A, and live radio Icecast/HLS streams."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "اسم المحطة / البودكاست" : "Show / Station Name"}
          </label>
          <input
            type="text"
            value={stationName}
            onChange={(e) =>
              onChange({
                config: { ...item.config, stationName: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "عنوان الحلقة أو الفقرة" : "Episode / Segment Title"}
          </label>
          <input
            type="text"
            value={episodeTitle}
            onChange={(e) =>
              onChange({
                config: { ...item.config, episodeTitle: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "المقدم / المذيع" : "Presenter / Host"}
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) =>
              onChange({
                config: { ...item.config, host: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
        <div>
          <label className="block text-[0.6875rem] font-medium text-[#50575e] mb-1">
            {isRtl ? "مدة التسجيل التقديرية" : "Duration Display"}
          </label>
          <input
            type="text"
            value={duration}
            placeholder="08:45"
            onChange={(e) =>
              onChange({
                config: { ...item.config, duration: e.target.value },
              })
            }
            className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
          />
        </div>
      </div>

      <div className="pt-1">
        <label className="flex items-center gap-2 text-xs text-[#2c3338] font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={isLiveStream}
            onChange={(e) =>
              onChange({
                config: { ...item.config, isLiveStream: e.target.checked },
              })
            }
            className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          />
          <span>{isRtl ? "شارة بث إذاعي مباشر (Live Stream)" : "Mark as Live Broadcast Stream"}</span>
        </label>
      </div>
    </div>
  );
}

export function ArticleAudioRender({ item, theme }: WidgetRenderProps) {
  const isRtl = theme?.direction === "rtl";
  const audioUrl = item.config?.audioUrl;
  const stationName = item.config?.stationName || (isRtl ? "إذاعة غرفة الأخبار" : "Newsroom Daily Brief");
  const episodeTitle = item.config?.episodeTitle || item.title || (isRtl ? "الموجز الإخباري" : "Daily Broadcast");
  const host = item.config?.host || (isRtl ? "فريق التحرير" : "Editorial Desk");
  const durationText = item.config?.duration || "08:45";
  const isLiveStream = Boolean(item.config?.isLiveStream);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn("Audio play prevented or unavailable", e);
        setIsPlaying(true); // visual toggle fallback
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatSecs = (sec: number) => {
    if (!sec || isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="theme-widget rounded-xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-[var(--theme-widget-text,var(--theme-text))] p-4 shadow-sm text-start">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isLiveStream ? (
            <span className="flex items-center gap-1 rounded bg-theme-danger px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider text-white animate-pulse">
              <Radio className="size-3" /> {isRtl ? "مباشر" : "Live"}
            </span>
          ) : (
            <span
              className="theme-btn flex items-center gap-1 rounded px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider "
            >
              <Disc className={`size-3 ${isPlaying ? "animate-spin" : ""}`} /> {isRtl ? "صوت" : "Audio"}
            </span>
          )}
          <span className="text-[0.625rem] text-[var(--theme-muted)] font-medium truncate max-w-[140px]">
            {stationName}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="text-[var(--theme-muted)] hover:text-[var(--theme-text)] transition-colors cursor-pointer"
          title={isMuted ? (isRtl ? "إلغاء الكتم" : "Unmute") : (isRtl ? "كتم الصوت" : "Mute")}
        >
          {isMuted ? <VolumeX className="size-3.5 text-theme-danger" /> : <Volume2 className="size-3.5" />}
        </button>
      </div>

      {/* Title & Host */}
      <div className="my-2">
        <h4 className="theme-widget-title text-sm font-bold font-serif leading-snug line-clamp-2 text-[var(--theme-widget-title-color,var(--theme-heading))]">
          {episodeTitle}
        </h4>
        <span className="text-[0.6875rem] text-[var(--theme-muted)] block mt-0.5">
          {isRtl ? `تقديم: ${host}` : `Hosted by ${host}`}
        </span>
      </div>

      {/* Waveform Animation & Progress */}
      <div className="flex items-center gap-1 h-6 my-2 px-1">
        {[40, 75, 20, 90, 60, 30, 85, 45, 100, 65, 30, 80, 50, 95, 40].map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? "bg-[var(--theme-primary)] animate-pulse"
                : "bg-[var(--theme-border)]"
            }`}
            style={{
              height: isPlaying ? `${Math.max(15, (h * (i % 2 === 0 ? 1 : 0.7)))}%` : "20%",
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--theme-border)]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="theme-btn size-8 rounded-full  flex items-center justify-center transition-all shadow-sm hover:opacity-90 hover:scale-105 cursor-pointer"
            title={isPlaying ? (isRtl ? "إيقاف مؤقت" : "Pause") : (isRtl ? "تشغيل" : "Play")}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
          </button>
          <span className="text-[0.6875rem] text-[var(--theme-text)] font-mono font-medium">
            {isPlaying && duration > 0 ? formatSecs(currentTime) : durationText}
          </span>
        </div>

        <span className="text-[0.625rem] text-[var(--theme-muted)] font-mono">
          {isLiveStream ? "320 kbps HD" : "Stereo 48kHz"}
        </span>
      </div>
    </div>
  );
}

export const articleAudioWidgetModule: WidgetModule = {
  manifest: manifest as any,
  AdminForm: ArticleAudioAdminForm,
  render: ArticleAudioRender,
};

export default articleAudioWidgetModule;
