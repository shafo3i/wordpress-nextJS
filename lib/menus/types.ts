export type MenuItem = {
  id: string;
  title: string;
  url: string;
  order: number;
  target?: string;
  type?: "page" | "category" | "custom";
};

export type Menu = {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
  locations: string[];
};

export type MenuLocation = {
  key: string;
  label: string;
};
