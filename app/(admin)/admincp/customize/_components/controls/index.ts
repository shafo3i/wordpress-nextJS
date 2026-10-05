import type { ComponentType } from "react";
import type { ControlType } from "@/lib/customizer/types";
import type { ControlProps } from "./types";
import { ColorControl } from "./color";
import { ToggleControl } from "./toggle";
import { ButtonGroupControl, RadioCardsControl, SelectControl } from "./choice";
import { RangeControl, TextControl, TextareaControl } from "./inputs";

/** One component per control type. Add a type to `ControlType` and register it here. */
export const CONTROL_REGISTRY: Record<ControlType, ComponentType<ControlProps>> = {
  color: ColorControl,
  toggle: ToggleControl,
  select: SelectControl,
  "button-group": ButtonGroupControl,
  "radio-cards": RadioCardsControl,
  range: RangeControl,
  text: TextControl,
  image: TextControl,
  textarea: TextareaControl,
  code: TextareaControl,
};

export type { ControlProps };
