/** Shared class names so every control looks the same and can be restyled in one place. */
export const INPUT_CLASS =
  "w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]";

export const LABEL_CLASS = "block text-[12px] font-medium text-[#50575e] mb-1";

export const HINT_CLASS = "text-[10px] text-[#646970] leading-tight";

const OPTION_BASE = "rounded border text-center transition-colors";

export const optionClass = (active: boolean) =>
  `${OPTION_BASE} ${
    active
      ? "border-[#2271b1] bg-[#f0f6fc] font-bold text-[#2271b1] ring-1 ring-[#2271b1]"
      : "border-[#dcdcde] bg-white text-slate-700 hover:border-slate-300"
  }`;
