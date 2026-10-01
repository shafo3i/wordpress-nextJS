import { addFilter } from "@/lib/plugins/hooks";
import { getPluginConfig } from "@/lib/plugins/config";

export function init() {
  addFilter("the_content", async (content: string, context?: any) => {
    if (!content) return content;

    const config = await getPluginConfig("article-audio");
    const audioUrl = config.audioUrl || "";
    const stationName = config.stationName || "Newsroom Daily Audio";
    const host = config.host || "Editorial Desk";
    const duration = config.duration || "03:45";
    const uniqueId = `audio-player-${Math.random().toString(36).substring(2, 7)}`;

    const audioWidget = `
<div class="wp-plugin-audio not-prose my-5 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900 to-slate-800 p-3.5 text-white shadow-sm" id="${uniqueId}">
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <button
        type="button"
        id="${uniqueId}-btn"
        class="flex size-9 items-center justify-center rounded-full bg-[#2271b1] text-sm text-white hover:bg-[#135e96] transition-transform hover:scale-105 cursor-pointer shadow"
        onclick="
          var btn = this;
          var audioEl = document.getElementById('${uniqueId}-audio');
          if (audioEl) {
            if (audioEl.paused) {
              audioEl.play();
              btn.innerText = '⏸';
            } else {
              audioEl.pause();
              btn.innerText = '▶';
            }
          } else if ('speechSynthesis' in window) {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.cancel();
              btn.innerText = '▶';
            } else {
              var articleText = document.querySelector('article') ? document.querySelector('article').innerText : document.body.innerText;
              var snippet = articleText.substring(0, 1500);
              var utter = new SpeechSynthesisUtterance(snippet);
              utter.rate = 1.0;
              utter.onend = function() { btn.innerText = '▶'; };
              window.speechSynthesis.speak(utter);
              btn.innerText = '⏸';
            }
          }
        "
      >
        ▶
      </button>
      <div>
        <span class="block text-xs font-semibold text-white">Listen to this story</span>
        <span class="block text-[10px] text-slate-400 font-mono">${stationName} • ${host} • ${duration}</span>
      </div>
    </div>
    <div class="hidden sm:flex items-center gap-2">
      <span class="text-[10px] uppercase tracking-wider font-semibold rounded bg-slate-700/60 px-2 py-0.5 text-slate-300">
        ${audioUrl ? "Live Audio Feed" : "Speech Narration"}
      </span>
    </div>
  </div>
  ${audioUrl ? `<audio id="${uniqueId}-audio" src="${audioUrl}" preload="none" onended="document.getElementById('${uniqueId}-btn').innerText='▶'"></audio>` : ""}
</div>`;

    return audioWidget + content;
  }, 4);
}
