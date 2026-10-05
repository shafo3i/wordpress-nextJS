import type { CustomizerSection } from "../types";
import { identitySection } from "./identity";
import { colorsSection } from "./colors";
import { typographySection } from "./typography";
import { headerSection } from "./header";
import { navigationSection } from "./navigation";
import { layoutSection } from "./layout";
import { singleSection } from "./single";
import { footerSection } from "./footer";
import { cssSection } from "./css";

export const CORE_SECTIONS: CustomizerSection[] = [
  identitySection,
  colorsSection,
  typographySection,
  headerSection,
  navigationSection,
  layoutSection,
  singleSection,
  footerSection,
  cssSection,
];
