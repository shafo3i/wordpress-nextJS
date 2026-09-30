import React from "react";
import { BlockDisplayStyle, HomepageBlockType } from "@/lib/themes/homepage-types";

interface WireframeProps {
  className?: string;
  active?: boolean;
}

/**
 * Visual Layout Wireframe Diagrams for WordPress Magazine Blocks
 * These render geometric layout wireframes showing exact article placement
 */

// Bento 1+4 (1 Giant Hero Left + 4 Cards 2x2 Right)
export function BentoWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const heroFill = active ? "#bfdbfe" : "#cbd5e1";
  const cardFill = active ? "#dbeafe" : "#e2e8f0";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* 1 Big Lead on Left */}
      <rect x="3" y="3" width="18" height="18" rx="1" fill={heroFill} />
      {/* 4 Grid Cards on Right */}
      <rect x="23" y="3" width="10" height="8" rx="1" fill={cardFill} />
      <rect x="23" y="13" width="10" height="8" rx="1" fill={cardFill} />
    </svg>
  );
}

// 1 Big Lead Left + 3 Stacked Side Thumbnails Right
export function LeadSideListWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const heroFill = active ? "#bfdbfe" : "#cbd5e1";
  const cardFill = active ? "#dbeafe" : "#e2e8f0";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* Big Lead on Left */}
      <rect x="3" y="3" width="18" height="18" rx="1" fill={heroFill} />
      {/* 3 Horizontal Stacked Rows on Right */}
      <rect x="23" y="3" width="10" height="4.5" rx="1" fill={cardFill} />
      <rect x="23" y="9.5" width="10" height="4.5" rx="1" fill={cardFill} />
      <rect x="23" y="16" width="10" height="4.5" rx="1" fill={cardFill} />
    </svg>
  );
}

// 3 Stacked Side Thumbnails Left + 1 Big Lead Right
export function LeadRightSideListWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const heroFill = active ? "#bfdbfe" : "#cbd5e1";
  const cardFill = active ? "#dbeafe" : "#e2e8f0";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* 3 Stacked Rows on Left */}
      <rect x="3" y="3" width="10" height="4.5" rx="1" fill={cardFill} />
      <rect x="3" y="9.5" width="10" height="4.5" rx="1" fill={cardFill} />
      <rect x="3" y="16" width="10" height="4.5" rx="1" fill={cardFill} />
      {/* Big Lead on Right */}
      <rect x="15" y="3" width="18" height="18" rx="1" fill={heroFill} />
    </svg>
  );
}

// 3-Column Grid
export function Grid3Wireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const fill = active ? "#bfdbfe" : "#cbd5e1";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      <rect x="3" y="3" width="9" height="18" rx="1" fill={fill} />
      <rect x="13.5" y="3" width="9" height="18" rx="1" fill={fill} />
      <rect x="24" y="3" width="9" height="18" rx="1" fill={fill} />
    </svg>
  );
}

// 4-Column Grid
export function Grid4Wireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const fill = active ? "#bfdbfe" : "#cbd5e1";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      <rect x="3" y="3" width="6.5" height="18" rx="1" fill={fill} />
      <rect x="11" y="3" width="6.5" height="18" rx="1" fill={fill} />
      <rect x="19" y="3" width="6.5" height="18" rx="1" fill={fill} />
      <rect x="27" y="3" width="6" height="18" rx="1" fill={fill} />
    </svg>
  );
}

// List View (Thumbnail Left + Headline Lines Right)
export function ListThumbLeftWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const thumbFill = active ? "#bfdbfe" : "#94a3b8";
  const lineFill = active ? "#93c5fd" : "#cbd5e1";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* Row 1 */}
      <rect x="3" y="3" width="8" height="4.5" rx="1" fill={thumbFill} />
      <rect x="13" y="3.5" width="19" height="1.5" rx="0.5" fill={lineFill} />
      <rect x="13" y="5.5" width="13" height="1.2" rx="0.5" fill={lineFill} />
      {/* Row 2 */}
      <rect x="3" y="9.5" width="8" height="4.5" rx="1" fill={thumbFill} />
      <rect x="13" y="10" width="19" height="1.5" rx="0.5" fill={lineFill} />
      <rect x="13" y="12" width="13" height="1.2" rx="0.5" fill={lineFill} />
      {/* Row 3 */}
      <rect x="3" y="16" width="8" height="4.5" rx="1" fill={thumbFill} />
      <rect x="13" y="16.5" width="19" height="1.5" rx="0.5" fill={lineFill} />
      <rect x="13" y="18.5" width="13" height="1.2" rx="0.5" fill={lineFill} />
    </svg>
  );
}

// List View (Headline Lines Left + Thumbnail Right)
export function ListThumbRightWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const thumbFill = active ? "#bfdbfe" : "#94a3b8";
  const lineFill = active ? "#93c5fd" : "#cbd5e1";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* Row 1 */}
      <rect x="3" y="3.5" width="20" height="1.5" rx="0.5" fill={lineFill} />
      <rect x="3" y="5.5" width="14" height="1.2" rx="0.5" fill={lineFill} />
      <rect x="25" y="3" width="8" height="4.5" rx="1" fill={thumbFill} />
      {/* Row 2 */}
      <rect x="3" y="10" width="20" height="1.5" rx="0.5" fill={lineFill} />
      <rect x="3" y="12" width="14" height="1.2" rx="0.5" fill={lineFill} />
      <rect x="25" y="9.5" width="8" height="4.5" rx="1" fill={thumbFill} />
      {/* Row 3 */}
      <rect x="3" y="16.5" width="20" height="1.5" rx="0.5" fill={lineFill} />
      <rect x="3" y="18.5" width="14" height="1.2" rx="0.5" fill={lineFill} />
      <rect x="25" y="16" width="8" height="4.5" rx="1" fill={thumbFill} />
    </svg>
  );
}

// Broadsheet 3-Column Wire (Column 1 Briefs | Column 2 Feature | Column 3 Live Wire)
export function Broadsheet3ColWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const centerFill = active ? "#bfdbfe" : "#cbd5e1";
  const sideFill = active ? "#dbeafe" : "#e2e8f0";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* Col 1 Left */}
      <rect x="3" y="3" width="7" height="7" rx="1" fill={sideFill} />
      <rect x="3" y="12" width="7" height="2" rx="0.5" fill={sideFill} />
      <rect x="3" y="16" width="7" height="2" rx="0.5" fill={sideFill} />
      {/* Divider */}
      <line x1="11.5" y1="2" x2="11.5" y2="22" stroke={stroke} strokeWidth="0.5" strokeDasharray="1 1" />
      {/* Col 2 Center Feature */}
      <rect x="13.5" y="3" width="12" height="10" rx="1" fill={centerFill} />
      <rect x="13.5" y="14.5" width="12" height="2" rx="0.5" fill={centerFill} />
      <rect x="13.5" y="17.5" width="9" height="1.5" rx="0.5" fill={centerFill} />
      {/* Divider */}
      <line x1="27" y1="2" x2="27" y2="22" stroke={stroke} strokeWidth="0.5" strokeDasharray="1 1" />
      {/* Col 3 Right Wire */}
      <rect x="28.5" y="4" width="5" height="2" rx="0.5" fill={sideFill} />
      <rect x="28.5" y="8" width="5" height="2" rx="0.5" fill={sideFill} />
      <rect x="28.5" y="12" width="5" height="2" rx="0.5" fill={sideFill} />
      <rect x="28.5" y="16" width="5" height="2" rx="0.5" fill={sideFill} />
    </svg>
  );
}

// Hero Slider with filmstrip
export function HeroSliderWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const mainFill = active ? "#bfdbfe" : "#cbd5e1";
  const stripFill = active ? "#93c5fd" : "#94a3b8";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* Main Slide Screen */}
      <rect x="3" y="3" width="30" height="12" rx="1" fill={mainFill} />
      {/* Navigation Arrows */}
      <path d="M5 9L7 7M5 9L7 11" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      <path d="M31 9L29 7M31 9L29 11" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
      {/* Filmstrip Ticker below */}
      <rect x="3" y="16.5" width="6.5" height="4" rx="0.5" fill={stripFill} />
      <rect x="11" y="16.5" width="6.5" height="4" rx="0.5" fill={stripFill} />
      <rect x="19" y="16.5" width="6.5" height="4" rx="0.5" fill={stripFill} />
      <rect x="27" y="16.5" width="6" height="4" rx="0.5" fill={stripFill} />
    </svg>
  );
}

// Overlay Full-Bleed Cards (Dark Gradient Overlays)
export function OverlayCardsWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const fill = active ? "#3b82f6" : "#475569";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      <rect x="3" y="3" width="9" height="18" rx="1" fill={fill} />
      <rect x="13.5" y="3" width="9" height="18" rx="1" fill={fill} />
      <rect x="24" y="3" width="9" height="18" rx="1" fill={fill} />
      {/* Overlay text simulation lines at bottom of cards */}
      <line x1="4.5" y1="16" x2="10.5" y2="16" stroke="#ffffff" strokeWidth="1" />
      <line x1="15" y1="16" x2="21" y2="16" stroke="#ffffff" strokeWidth="1" />
      <line x1="25.5" y1="16" x2="31.5" y2="16" stroke="#ffffff" strokeWidth="1" />
    </svg>
  );
}

// Minimal Text / Broadsheet Newsprint
export function MinimalTextWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const lineFill = active ? "#3b82f6" : "#64748b";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      <rect x="3" y="4" width="30" height="2" rx="0.5" fill={lineFill} />
      <rect x="3" y="8" width="24" height="1.5" rx="0.5" fill={lineFill} opacity="0.7" />
      <rect x="3" y="12" width="30" height="2" rx="0.5" fill={lineFill} />
      <rect x="3" y="16" width="20" height="1.5" rx="0.5" fill={lineFill} opacity="0.7" />
    </svg>
  );
}

// Tabbed Topic Switcher (Tabs at top + 2x2 grid below)
export function TabbedWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const tabFill = active ? "#2271b1" : "#64748b";
  const gridFill = active ? "#bfdbfe" : "#cbd5e1";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* 3 Tabs at top */}
      <rect x="3" y="3" width="7" height="2.5" rx="1" fill={tabFill} />
      <rect x="12" y="3" width="6" height="2.5" rx="1" fill={stroke} opacity="0.4" />
      <rect x="20" y="3" width="6" height="2.5" rx="1" fill={stroke} opacity="0.4" />
      {/* 2x2 cards below */}
      <rect x="3" y="7.5" width="14" height="6" rx="1" fill={gridFill} />
      <rect x="19" y="7.5" width="14" height="6" rx="1" fill={gridFill} />
      <rect x="3" y="14.5" width="14" height="6" rx="1" fill={gridFill} />
      <rect x="19" y="14.5" width="14" height="6" rx="1" fill={gridFill} />
    </svg>
  );
}

// Ranked 01-05 Trending Leaderboard
export function TrendingWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const numFill = active ? "#2271b1" : "#e11d48";
  const lineFill = active ? "#93c5fd" : "#cbd5e1";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* 5 Vertical Slots with Number Accents */}
      <rect x="3" y="3" width="5" height="7" rx="0.5" fill={numFill} />
      <rect x="3" y="12" width="5" height="2" rx="0.5" fill={lineFill} />
      <rect x="3" y="15" width="4" height="1.5" rx="0.5" fill={lineFill} />

      <rect x="10" y="3" width="5" height="7" rx="0.5" fill={numFill} opacity="0.8" />
      <rect x="10" y="12" width="5" height="2" rx="0.5" fill={lineFill} />
      <rect x="10" y="15" width="4" height="1.5" rx="0.5" fill={lineFill} />

      <rect x="17" y="3" width="5" height="7" rx="0.5" fill={numFill} opacity="0.6" />
      <rect x="17" y="12" width="5" height="2" rx="0.5" fill={lineFill} />
      <rect x="17" y="15" width="4" height="1.5" rx="0.5" fill={lineFill} />

      <rect x="24" y="3" width="5" height="7" rx="0.5" fill={numFill} opacity="0.4" />
      <rect x="24" y="12" width="5" height="2" rx="0.5" fill={lineFill} />
      <rect x="24" y="15" width="4" height="1.5" rx="0.5" fill={lineFill} />
    </svg>
  );
}

// Opinion Columnist Deck (Avatars + Speech quotes)
export function OpinionWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const avatarFill = active ? "#2271b1" : "#64748b";
  const cardFill = active ? "#dbeafe" : "#f1f5f9";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" stroke={stroke} strokeWidth="1" />
      {/* 3 Columnist cards */}
      <rect x="3" y="3" width="9" height="18" rx="1" fill={cardFill} />
      <circle cx="7.5" cy="7" r="2.5" fill={avatarFill} />
      <line x1="5" y1="12" x2="10" y2="12" stroke={avatarFill} strokeWidth="1" />
      <line x1="5" y1="15" x2="9" y2="15" stroke={avatarFill} strokeWidth="1" />

      <rect x="13.5" y="3" width="9" height="18" rx="1" fill={cardFill} />
      <circle cx="18" cy="7" r="2.5" fill={avatarFill} />
      <line x1="15.5" y1="12" x2="20.5" y2="12" stroke={avatarFill} strokeWidth="1" />
      <line x1="15.5" y1="15" x2="19.5" y2="15" stroke={avatarFill} strokeWidth="1" />

      <rect x="24" y="3" width="9" height="18" rx="1" fill={cardFill} />
      <circle cx="28.5" cy="7" r="2.5" fill={avatarFill} />
      <line x1="26" y1="12" x2="31" y2="12" stroke={avatarFill} strokeWidth="1" />
      <line x1="26" y1="15" x2="30" y2="15" stroke={avatarFill} strokeWidth="1" />
    </svg>
  );
}

// Broadcast Studio & Multimedia Equalizer
export function MultimediaWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const darkBg = "#0f172a";
  const waveFill = active ? "#38bdf8" : "#e11d48";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" fill={darkBg} stroke={stroke} strokeWidth="1" />
      {/* Play circle */}
      <circle cx="8" cy="12" r="4" fill={waveFill} />
      <polygon points="7,10 7,14 10,12" fill="#ffffff" />
      {/* Sound waves */}
      <rect x="15" y="10" width="1.5" height="4" rx="0.5" fill={waveFill} />
      <rect x="18" y="7" width="1.5" height="10" rx="0.5" fill={waveFill} />
      <rect x="21" y="5" width="1.5" height="14" rx="0.5" fill={waveFill} />
      <rect x="24" y="8" width="1.5" height="8" rx="0.5" fill={waveFill} />
      <rect x="27" y="6" width="1.5" height="12" rx="0.5" fill={waveFill} />
      <rect x="30" y="10" width="1.5" height="4" rx="0.5" fill={waveFill} />
    </svg>
  );
}

// Newsletter Subscription Strip
export function NewsletterWireframe({ className = "w-9 h-6", active = false }: WireframeProps) {
  const stroke = active ? "#2271b1" : "#64748b";
  const fill = active ? "#1e293b" : "#334155";

  return (
    <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="34" height="22" rx="2" fill={fill} stroke={stroke} strokeWidth="1" />
      {/* Mail Envelope Outline */}
      <rect x="5" y="5" width="10" height="7" rx="0.5" stroke="#ffffff" strokeWidth="0.8" />
      <path d="M5 5L10 9L15 5" stroke="#ffffff" strokeWidth="0.8" />
      {/* Input box & button */}
      <rect x="5" y="15" width="16" height="4" rx="1" fill="#ffffff" />
      <rect x="22" y="15" width="9" height="4" rx="1" fill="#2271b1" />
    </svg>
  );
}

/**
 * Helper to render the appropriate wireframe for a block type or display style
 */
export function BlockWireframeIcon({
  type,
  displayStyle,
  className = "w-9 h-6",
  active = false,
}: {
  type: HomepageBlockType;
  displayStyle?: BlockDisplayStyle;
  className?: string;
  active?: boolean;
}) {
  const style = displayStyle || (type as unknown as BlockDisplayStyle);

  switch (style) {
    case "bento":
    case "magazine_bento" as unknown:
      return <BentoWireframe className={className} active={active} />;
    case "lead_side_list":
    case "big_lead_side_list" as unknown:
    case "hero" as unknown:
      return <LeadSideListWireframe className={className} active={active} />;
    case "lead_right_side_list":
      return <LeadRightSideListWireframe className={className} active={active} />;
    case "grid_3":
    case "category_grid" as unknown:
      return <Grid3Wireframe className={className} active={active} />;
    case "grid_4":
      return <Grid4Wireframe className={className} active={active} />;
    case "list_thumb_left":
    case "news_list" as unknown:
      return <ListThumbLeftWireframe className={className} active={active} />;
    case "list_thumb_right":
      return <ListThumbRightWireframe className={className} active={active} />;
    case "broadsheet_wire":
    case "broadsheet_3col" as unknown:
      return <Broadsheet3ColWireframe className={className} active={active} />;
    case "hero_slider":
      return <HeroSliderWireframe className={className} active={active} />;
    case "overlay_cards":
    case "visual_grid" as unknown:
      return <OverlayCardsWireframe className={className} active={active} />;
    case "minimal_text":
      return <MinimalTextWireframe className={className} active={active} />;
    case "tabbed_block" as unknown:
      return <TabbedWireframe className={className} active={active} />;
    case "trending" as unknown:
      return <TrendingWireframe className={className} active={active} />;
    case "opinion" as unknown:
      return <OpinionWireframe className={className} active={active} />;
    case "multimedia" as unknown:
      return <MultimediaWireframe className={className} active={active} />;
    case "newsletter" as unknown:
      return <NewsletterWireframe className={className} active={active} />;
    default:
      return <Grid3Wireframe className={className} active={active} />;
  }
}
