import { ARABIC_FONTS, BODY_FONTS, HEADING_FONTS, LATIN_FONTS } from "../fonts";
import type { CustomizerSection, SettingOption } from "../types";

const WEIGHTS: SettingOption[] = [
  { value: "400", label: "Regular 400" },
  { value: "600", label: "Semi-Bold 600" },
  { value: "700", label: "Bold 700" },
  { value: "800", label: "Extra Bold 800" },
  { value: "900", label: "Black 900" },
];

const TRANSFORMS: SettingOption[] = [
  { value: "none", label: "Normal Case" },
  { value: "uppercase", label: "UPPERCASE" },
  { value: "capitalize", label: "Capitalize" },
];

const fontOption = (f: { id: string; label: string }): SettingOption => ({ value: f.id, label: f.label });

/** Roles can follow the headline / body font or use any font of their own. */
const roleFonts: SettingOption[] = [
  { value: "heading", label: "Same as headlines" },
  { value: "body", label: "Same as body text" },
  ...LATIN_FONTS.map(fontOption),
];

export const typographySection: CustomizerSection = {
  id: "typography",
  title: "Typography Engine",
  titleKey: "admin.customizer.section.typography",
  icon: "Type",
  priority: 30,
  groups: [
    {
      id: "body",
      title: "Body Text",
      settings: [
        {
          id: "bodyFontFamily",
          type: "select",
          label: "Body & Story Font Family",
          default: "inter",
          options: BODY_FONTS.map((f) => ({ value: f.id, label: `${f.label} (${f.note})` })),
        },
        {
          id: "baseFontSize",
          type: "range",
          label: "Global Text Size",
          description: "Scales all text and spacing on the site. Raise it to make everything bigger.",
          default: 17,
          min: 14,
          max: 24,
          step: 1,
          unit: "px",
          cssVar: "--theme-base-font-size",
          cssUnit: "px",
        },
      ],
    },
    {
      id: "headlines",
      title: "Headlines",
      settings: [
        {
          id: "headingFontFamily",
          type: "radio-cards",
          label: "Headline Font Family",
          default: "playfair",
          options: HEADING_FONTS.map((f) => ({ value: f.id, label: f.label, note: f.note, fontKind: f.kind })),
        },
        { id: "headingFontWeight", type: "select", label: "Headline Weight", default: "700", options: WEIGHTS },
        { id: "headingTransform", type: "select", label: "Text Transform", default: "none", options: TRANSFORMS },
        {
          id: "headingScale",
          type: "range",
          label: "Headline Size",
          description: "Scales titles on cards, articles and sliders.",
          default: 100,
          min: 80,
          max: 160,
          step: 5,
          unit: "%",
          cssVar: "--theme-heading-scale",
          cssFactor: 0.01,
        },
      ],
    },
    {
      id: "masthead",
      title: "Site Title (Masthead)",
      settings: [
        { id: "siteTitleFontFamily", type: "select", label: "Site Title Font", default: "heading", options: roleFonts },
        {
          id: "siteTitleScale",
          type: "range",
          label: "Site Title Size",
          default: 100,
          min: 50,
          max: 180,
          step: 5,
          unit: "%",
          cssVar: "--theme-site-title-scale",
          cssFactor: 0.01,
        },
      ],
    },
    {
      id: "widgets",
      title: "Widget Titles",
      settings: [
        { id: "widgetTitleFontFamily", type: "select", label: "Widget Title Font", default: "heading", options: roleFonts },
        {
          id: "widgetTitleSize",
          type: "range",
          label: "Widget Title Size",
          default: 0.85,
          min: 0.7,
          max: 1.8,
          step: 0.05,
          unit: "rem",
          cssVar: "--theme-widget-title-size",
          cssUnit: "rem",
        },
        {
          id: "widgetTitleWeight",
          type: "select",
          label: "Widget Title Weight",
          default: "700",
          options: WEIGHTS,
          cssVar: "--theme-widget-title-weight",
        },
        {
          id: "widgetTitleTransform",
          type: "select",
          label: "Widget Title Case",
          default: "uppercase",
          options: TRANSFORMS,
          cssVar: "--theme-widget-title-transform",
        },
      ],
    },
    {
      id: "navigation",
      title: "Navigation Menu",
      settings: [
        { id: "navFontFamily", type: "select", label: "Menu Font", default: "body", options: roleFonts },
        {
          id: "navFontSize",
          type: "range",
          label: "Menu Text Size",
          default: 0.8,
          min: 0.7,
          max: 1.5,
          step: 0.05,
          unit: "rem",
          cssVar: "--theme-nav-size",
          cssUnit: "rem",
        },
      ],
    },
    {
      id: "arabic",
      title: "Arabic / RTL Fonts",
      settings: [
        {
          id: "arabicHeadingFontFamily",
          type: "select",
          label: "Arabic Headline Font",
          default: "cairo",
          options: ARABIC_FONTS.filter((f) => f.heading).map((f) => ({ value: f.id, label: `${f.label} (${f.note})` })),
        },
        {
          id: "arabicBodyFontFamily",
          type: "select",
          label: "Arabic Body Font",
          default: "cairo",
          options: ARABIC_FONTS.filter((f) => f.body).map((f) => ({ value: f.id, label: `${f.label} (${f.note})` })),
        },
      ],
    },
  ],
};