import Link from "next/link";

export function PageListHeader({
  title = "Pages",
  addNewHref = "/admincp/pages/new",
  dict = {},
  direction = "ltr",
}: {
  title?: string;
  addNewHref?: string;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-2 text-start"
      dir={direction}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
          {title}
        </h1>
        <Link
          href={addNewHref}
          className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-0.5 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
        >
          {dict["admin.menu.add_new"] || "Add New Page"}
        </Link>
      </div>

      <div className="flex items-center gap-1 text-[13px]">
        <button
          type="button"
          className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
        >
          {dict["admin.common.screen_options"] || "Screen Options"}
          <span className="text-[9px]">▼</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
        >
          {dict["admin.common.help"] || "Help"}
          <span className="text-[9px]">▼</span>
        </button>
      </div>
    </div>
  );
}
