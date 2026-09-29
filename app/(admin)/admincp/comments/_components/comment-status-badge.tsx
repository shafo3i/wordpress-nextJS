type Props = {
    status: string;
    dict?: Record<string, string>;
};

export function CommentStatusBadge({ status, dict = {} }: Props) {
    switch (status) {
        case "1":
            return (
                <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {dict["admin.comments.filter.approved"] || "Approved"}
                </span>
            );
        case "0":
            return (
                <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    {dict["admin.comments.filter.pending"] || "Pending"}
                </span>
            );
        case "spam":
            return (
                <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {dict["admin.comments.filter.spam"] || "Spam"}
                </span>
            );
        case "trash":
            return (
                <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    {dict["admin.comments.filter.trash"] || "Trash"}
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {status}
                </span>
            );
    }
}
