"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { Counts, UserRoleOption } from "@/services/user.service";

interface UserFilterProps {
  counts: Counts;
  roles: UserRoleOption[];
  currentRole?: string;
  searchQuery?: string;
  dict?: Record<string, string>;
}

export function UserFilter({
  counts,
  roles,
  currentRole = "all",
  searchQuery = "",
  dict = {},
}: UserFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/admincp/users?${params.toString()}`);
  };

  const buildRoleHref = (roleValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (roleValue === "all") {
      params.delete("role");
    } else {
      params.set("role", roleValue);
    }
    params.set("page", "1");
    return `/admincp/users?${params.toString()}`;
  };

  const getRoleLabel = (role: UserRoleOption) => {
    const key = `admin.roles.${role.value.toLowerCase()}`;
    return dict[key] || role.label || role.value;
  };

  // Build filter list starting with "All"
  const filterList: { key: string; label: string; count: number }[] = [
    {
      key: "all",
      label: dict["admin.roles.all"] || dict["common.all"] || "All",
      count: counts.all,
    },
  ];

  roles.forEach((r) => {
    const roleKey = r.value.toLowerCase();
    const count = counts.byRole[roleKey] || 0;
    if (count > 0 || ["admin", "editor", "author", "subscriber"].includes(roleKey)) {
      filterList.push({
        key: roleKey,
        label: getRoleLabel(r),
        count,
      });
    }
  });

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
      {/* Role Filter Tabs */}
      <ul className="flex flex-wrap items-center gap-1.5 text-[#646970]">
        {filterList.map((item, idx) => {
          const isActive =
            (currentRole === "all" && item.key === "all") ||
            currentRole.toLowerCase() === item.key;
          return (
            <li key={item.key} className="flex items-center">
              {idx > 0 && <span className="me-1.5 text-[#c3c4c7]">|</span>}
              <Link
                href={buildRoleHref(item.key)}
                className={
                  isActive
                    ? "font-semibold text-[#1d2327]"
                    : "text-[#2271b1] hover:text-[#135e96] hover:underline"
                }
              >
                {item.label}{" "}
                <span className="text-[#646970]">({item.count})</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Search Users Form */}
      <form onSubmit={handleSearch} className="flex items-center gap-1">
        <input
          type="search"
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict["admin.users.search_placeholder"] || "Search users..."}
          aria-label={dict["admin.users.search_placeholder"] || "Search users"}
          className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
        />
        <button
          type="submit"
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
        >
          {dict["admin.users.search_button"] || dict["admin.users.search_users"] || "Search Users"}
        </button>
      </form>
    </div>
  );
}
