import React from "react";
import { WidgetType } from "@/lib/widgets/db";

interface WidgetWireframeProps {
  className?: string;
  active?: boolean;
}

/**
 * Visual Layout Wireframe Diagrams for WordPress Widgets
 * Renders authentic geometric sidebar wireframe icons showing the layout structure.
 */

// Search Widget Wireframe (Search input bar + mini submit button)
export function SearchWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const bg = active ? "#f0f6fc" : "#f8fafc";
  const bar = active ? "#bfdbfe" : "#cbd5e1";
  const btn = active ? "#2271b1" : "#94a3b8";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Title wire */}
      <rect x="4" y="4" width="12" height="2.5" rx="0.5" fill={bar} />
      {/* Search Input Box */}
      <rect x="4" y="10" width="18" height="8" rx="1.5" stroke={stroke} strokeWidth="0.8" fill="#ffffff" />
      {/* Submit Button */}
      <rect x="23" y="10" width="5" height="8" rx="1.5" fill={btn} />
      {/* Magnifier glass */}
      <circle cx="9" cy="14" r="2" stroke={stroke} strokeWidth="0.8" />
      <line x1="10.5" y1="15.5" x2="12" y2="17" stroke={stroke} strokeWidth="0.8" />
    </svg>
  );
}

// Recent Stories Widget Wireframe (3-4 horizontal news rows with mini thumbnails)
export function RecentPostsWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const bg = active ? "#f0f6fc" : "#f8fafc";
  const thumb = active ? "#93c5fd" : "#cbd5e1";
  const line = active ? "#bfdbfe" : "#e2e8f0";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Title wire */}
      <rect x="4" y="3" width="14" height="2" rx="0.5" fill="#64748b" />
      {/* Row 1 */}
      <rect x="4" y="7" width="5" height="4" rx="0.5" fill={thumb} />
      <rect x="10.5" y="7.5" width="17" height="1.5" rx="0.5" fill={line} />
      <rect x="10.5" y="9.5" width="11" height="1.5" rx="0.5" fill={line} />
      {/* Row 2 */}
      <rect x="4" y="12.5" width="5" height="4" rx="0.5" fill={thumb} />
      <rect x="10.5" y="13" width="17" height="1.5" rx="0.5" fill={line} />
      <rect x="10.5" y="15" width="9" height="1.5" rx="0.5" fill={line} />
      {/* Row 3 */}
      <rect x="4" y="18" width="5" height="3" rx="0.5" fill={thumb} />
      <rect x="10.5" y="18.5" width="14" height="1.5" rx="0.5" fill={line} />
    </svg>
  );
}

// Categories Widget Wireframe (List of topic tags / pills)
export function CategoriesWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const bg = active ? "#f0f6fc" : "#f8fafc";
  const tag = active ? "#dbeafe" : "#e2e8f0";
  const tagBorder = active ? "#93c5fd" : "#cbd5e1";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Title */}
      <rect x="4" y="3" width="13" height="2" rx="0.5" fill="#64748b" />
      {/* Category Pills */}
      <rect x="4" y="7" width="11" height="4.5" rx="1.5" fill={tag} stroke={tagBorder} strokeWidth="0.5" />
      <rect x="17" y="7" width="11" height="4.5" rx="1.5" fill={tag} stroke={tagBorder} strokeWidth="0.5" />
      <rect x="4" y="13" width="13" height="4.5" rx="1.5" fill={tag} stroke={tagBorder} strokeWidth="0.5" />
      <rect x="19" y="13" width="9" height="4.5" rx="1.5" fill={tag} stroke={tagBorder} strokeWidth="0.5" />
      <rect x="4" y="19" width="10" height="3" rx="1" fill={tag} stroke={tagBorder} strokeWidth="0.5" />
    </svg>
  );
}

// Author Bio Widget Wireframe (Avatar circle + byline credentials + text)
export function AuthorBioWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const bg = active ? "#f0f6fc" : "#f8fafc";
  const circleFill = active ? "#bfdbfe" : "#cbd5e1";
  const line = active ? "#93c5fd" : "#cbd5e1";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Avatar Circle */}
      <circle cx="8" cy="8" r="4" fill={circleFill} stroke={stroke} strokeWidth="0.6" />
      {/* Author Name */}
      <rect x="14" y="5.5" width="14" height="2.5" rx="0.5" fill={stroke} />
      {/* Title */}
      <rect x="14" y="9.5" width="9" height="1.8" rx="0.5" fill={line} />
      {/* Bio lines */}
      <rect x="4" y="15" width="24" height="1.8" rx="0.5" fill={line} />
      <rect x="4" y="18.5" width="18" height="1.8" rx="0.5" fill={line} />
    </svg>
  );
}

// Custom HTML / Code Widget Wireframe (Code brackets and stylized markup tags)
export function CustomHtmlWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const bg = active ? "#1e293b" : "#334155";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Terminal header dots */}
      <circle cx="4.5" cy="4.5" r="1" fill="#f87171" />
      <circle cx="7.5" cy="4.5" r="1" fill="#fbbf24" />
      <circle cx="10.5" cy="4.5" r="1" fill="#34d399" />
      {/* < / > code brackets */}
      <path d="M9 10L6 14L9 18" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 19L18 9" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M23 10L26 14L23 18" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Newsletter Signup Plugin Widget Wireframe (Envelope + subscribe input)
export function NewsletterWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#7c3aed" : "#8b5cf6";
  const bg = active ? "#faf5ff" : "#f5f3ff";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Envelope */}
      <rect x="4" y="4" width="9" height="6.5" rx="0.8" fill="#ffffff" stroke={stroke} strokeWidth="0.7" />
      <path d="M4 4.5L8.5 8L13 4.5" stroke={stroke} strokeWidth="0.7" />
      {/* Headline */}
      <rect x="15" y="5" width="13" height="2.2" rx="0.5" fill={stroke} />
      <rect x="15" y="8.5" width="9" height="1.8" rx="0.5" fill="#c4b5fd" />
      {/* Input box */}
      <rect x="4" y="13.5" width="16" height="6.5" rx="1" fill="#ffffff" stroke="#c4b5fd" strokeWidth="0.7" />
      {/* Button */}
      <rect x="21.5" y="13.5" width="6.5" height="6.5" rx="1" fill={stroke} />
    </svg>
  );
}

// Audio Stream Plugin Widget Wireframe (Play button + audio wave bars)
export function AudioWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const bg = "#0f172a";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Play button circle */}
      <circle cx="8" cy="12" r="4.5" fill="#f43f5e" />
      <polygon points="7,10 7,14 10.5,12" fill="#ffffff" />
      {/* Waveform bars */}
      <rect x="15" y="11" width="1.8" height="2" rx="0.5" fill="#f43f5e" />
      <rect x="18" y="8" width="1.8" height="8" rx="0.5" fill="#f43f5e" />
      <rect x="21" y="6" width="1.8" height="12" rx="0.5" fill="#f43f5e" />
      <rect x="24" y="9" width="1.8" height="6" rx="0.5" fill="#f43f5e" />
      <rect x="27" y="11" width="1.8" height="2" rx="0.5" fill="#f43f5e" />
    </svg>
  );
}

// Breaking Alert Plugin Widget Wireframe (Urgent beacon + pulse ticker)
export function BreakingWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#dc2626" : "#e11d48";
  const bg = active ? "#fef2f2" : "#fff1f2";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Urgent Alert Badge */}
      <rect x="4" y="4" width="12" height="4" rx="1" fill="#dc2626" />
      {/* Flash line */}
      <line x1="18" y1="6" x2="28" y2="6" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
      {/* Ticker lines */}
      <rect x="4" y="11" width="24" height="2.2" rx="0.5" fill="#991b1b" />
      <rect x="4" y="15" width="20" height="2" rx="0.5" fill="#f87171" />
      <rect x="4" y="18.5" width="14" height="1.8" rx="0.5" fill="#fca5a5" />
    </svg>
  );
}

// Fact Check Scorecard Plugin Widget Wireframe (Shield + Verdict stamp)
export function FactCheckWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#059669" : "#10b981";
  const bg = active ? "#ecfdf5" : "#f0fdf4";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Verified Shield */}
      <path d="M7 4L12 6V11C12 14 7 16 7 16C7 16 2 14 2 11V6L7 4Z" transform="translate(2, 0)" fill="#059669" />
      <path d="M7 10L8.5 11.5L11 8.5" transform="translate(2, 0)" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* Verdict Stamp */}
      <rect x="18" y="4.5" width="10" height="5" rx="1" fill="#059669" />
      {/* Claim rows */}
      <rect x="4" y="13" width="24" height="2" rx="0.5" fill="#065f46" />
      <rect x="4" y="16.5" width="18" height="1.8" rx="0.5" fill="#6ee7b7" />
    </svg>
  );
}

// Social Channels Plugin Widget Wireframe (Network link boxes)
export function SocialWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#0284c7" : "#0ea5e9";
  const bg = active ? "#f0f9ff" : "#f8fafc";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Social Box 1 */}
      <rect x="4" y="5" width="11" height="6" rx="1.5" fill="#ffffff" stroke="#bae6fd" strokeWidth="0.8" />
      <circle cx="7" cy="8" r="1.5" fill="#0284c7" />
      <rect x="10" y="7" width="3.5" height="2" rx="0.5" fill="#94a3b8" />
      {/* Social Box 2 */}
      <rect x="17" y="5" width="11" height="6" rx="1.5" fill="#ffffff" stroke="#bae6fd" strokeWidth="0.8" />
      <circle cx="20" cy="8" r="1.5" fill="#0284c7" />
      <rect x="23" y="7" width="3.5" height="2" rx="0.5" fill="#94a3b8" />
      {/* Social Box 3 */}
      <rect x="4" y="13" width="11" height="6" rx="1.5" fill="#ffffff" stroke="#bae6fd" strokeWidth="0.8" />
      {/* Social Box 4 */}
      <rect x="17" y="13" width="11" height="6" rx="1.5" fill="#ffffff" stroke="#bae6fd" strokeWidth="0.8" />
    </svg>
  );
}

// Sponsor Ad Unit Plugin Widget Wireframe (Dashed ad box + Sponsor label)
export function AdWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#d97706" : "#b45309";
  const bg = active ? "#fffbeb" : "#fefce8";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" strokeDasharray="2 2" />
      {/* AD TAG */}
      <rect x="9" y="4" width="14" height="3" rx="0.5" fill="#d97706" />
      {/* Banner graphic */}
      <rect x="5" y="10" width="22" height="8" rx="1" fill="#fde68a" />
      <rect x="8" y="13" width="16" height="2" rx="0.5" fill="#b45309" />
    </svg>
  );
}

// Reading Time & Speed Plugin Widget Wireframe (Clock/Timer + word count bar)
export function ReadingTimeWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#2563eb" : "#3b82f6";
  const bg = active ? "#eff6ff" : "#f0fdf4";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Clock icon */}
      <circle cx="8" cy="8" r="4.5" stroke={stroke} strokeWidth="0.8" />
      <polyline points="8,5.5 8,8 10,8" stroke={stroke} strokeWidth="0.8" strokeLinecap="round" />
      {/* Read Time badge */}
      <rect x="15" y="6" width="13" height="3.5" rx="1" fill="#3b82f6" />
      {/* Speedometer / Word meter */}
      <rect x="4" y="15" width="24" height="4" rx="1" fill="#e2e8f0" />
      <rect x="4" y="15" width="16" height="4" rx="1" fill="#60a5fa" />
    </svg>
  );
}

// Related Stories Plugin Widget Wireframe (2 recommended follow-up cards)
export function RelatedPostsWidgetWireframe({ className = "w-8 h-6", active = false }: WidgetWireframeProps) {
  const stroke = active ? "#0284c7" : "#0ea5e9";
  const bg = active ? "#f0f9ff" : "#f8fafc";

  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="30" height="22" rx="2" fill={bg} stroke={stroke} strokeWidth="1" />
      {/* Pin / Header bar */}
      <rect x="4" y="3.5" width="11" height="2" rx="0.5" fill="#0284c7" />
      {/* Card 1 */}
      <rect x="4" y="7" width="11" height="13" rx="1" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="0.6" />
      <rect x="6" y="9" width="7" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="6" y="15" width="7" height="1.5" rx="0.5" fill="#0369a1" />
      {/* Card 2 */}
      <rect x="17" y="7" width="11" height="13" rx="1" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="0.6" />
      <rect x="19" y="9" width="7" height="4" rx="0.5" fill="#38bdf8" />
      <rect x="19" y="15" width="7" height="1.5" rx="0.5" fill="#0369a1" />
    </svg>
  );
}

/**
 * Dispatcher to render the appropriate widget layout wireframe
 */
export function WidgetWireframeIcon({
  type,
  className = "w-8 h-6",
  active = false,
}: {
  type: WidgetType;
  className?: string;
  active?: boolean;
}) {
  switch (type) {
    case "search":
      return <SearchWidgetWireframe className={className} active={active} />;
    case "recent_posts":
      return <RecentPostsWidgetWireframe className={className} active={active} />;
    case "categories":
      return <CategoriesWidgetWireframe className={className} active={active} />;
    case "author_bio":
      return <AuthorBioWidgetWireframe className={className} active={active} />;
    case "custom_html":
      return <CustomHtmlWidgetWireframe className={className} active={active} />;
    case "plugin_newsletter":
      return <NewsletterWidgetWireframe className={className} active={active} />;
    case "plugin_audio":
      return <AudioWidgetWireframe className={className} active={active} />;
    case "plugin_breaking":
      return <BreakingWidgetWireframe className={className} active={active} />;
    case "plugin_factcheck":
      return <FactCheckWidgetWireframe className={className} active={active} />;
    case "plugin_social":
      return <SocialWidgetWireframe className={className} active={active} />;
    case "plugin_ad":
      return <AdWidgetWireframe className={className} active={active} />;
    case "plugin_reading_time":
      return <ReadingTimeWidgetWireframe className={className} active={active} />;
    case "plugin_related_posts":
      return <RelatedPostsWidgetWireframe className={className} active={active} />;
    default:
      return <RecentPostsWidgetWireframe className={className} active={active} />;
  }
}
