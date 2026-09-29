"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "cn";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  direction?: "ltr" | "rtl" | string;
  dict?: Record<string, string>;
  variant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  direction,
  dict,
  variant = "destructive",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  // Detect direction from prop or document root
  const [resolvedDir, setResolvedDir] = React.useState<"ltr" | "rtl">("ltr");

  React.useEffect(() => {
    if (direction === "ltr" || direction === "rtl") {
      setResolvedDir(direction as "ltr" | "rtl");
    } else if (typeof document !== "undefined") {
      const docDir = (document.documentElement.getAttribute("dir") ||
        document.body.getAttribute("dir")) as "ltr" | "rtl";
      if (docDir === "rtl" || docDir === "ltr") {
        setResolvedDir(docDir);
      }
    }
  }, [direction]);

  const effectiveDir = (direction as "ltr" | "rtl") || resolvedDir;
  const isRtl = effectiveDir === "rtl";

  const defaultConfirmText = isRtl
    ? variant === "destructive"
      ? "حذف"
      : "تأكيد"
    : variant === "destructive"
      ? "Delete"
      : "Confirm";

  const defaultCancelText = isRtl ? "إلغاء" : "Cancel";

  const finalConfirmText =
    confirmText ||
    (dict
      ? variant === "destructive"
        ? dict["admin.common.delete"] || dict["common.delete"]
        : dict["admin.common.confirm"] || dict["common.confirm"]
      : undefined) ||
    defaultConfirmText;

  const finalCancelText =
    cancelText ||
    (dict
      ? dict["admin.common.cancel"] || dict["common.cancel"]
      : undefined) ||
    defaultCancelText;

  const RTL_TITLE_MAP: Record<string, string> = {
    "Delete Tag": "حذف الوسم",
    "Delete Tags": "حذف الوسوم",
    "Delete Category": "حذف التصنيف",
    "Delete Categories": "حذف التصنيفات",
    "Delete Plugin": "حذف الإضافة",
    "Delete Plugins": "حذف الإضافات",
    "Delete Language": "حذف اللغة",
    "Delete Menu": "حذف القائمة",
    "Reset Homepage Blocks": "إعادة تعيين كتل الصفحة الرئيسية",
  };

  const finalTitle = isRtl && RTL_TITLE_MAP[title] ? RTL_TITLE_MAP[title] : title;
  const loadingText = isRtl ? "جارٍ المعالجة..." : "Processing...";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={effectiveDir} className="text-start">
        <AlertDialogHeader className="text-start items-start">
          <AlertDialogTitle className="text-start w-full font-semibold">
            {finalTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-start w-full text-[#646970]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-end">
          <AlertDialogCancel disabled={isLoading} className="cursor-pointer">
            {finalCancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            disabled={isLoading}
            className={cn(
              "cursor-pointer",
              variant === "destructive" &&
                "bg-[#d63638] text-white hover:bg-[#b32d2e]"
            )}
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {isLoading ? loadingText : finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
