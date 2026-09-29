import Link from "next/link";
import { createCommentAction, updateCommentAction } from "../action";
import { SelectComment } from "@/db/schema/cms-comments";

type PostOption = {
    id: bigint;
    title: string;
};

type Props = {
    defaultValues?: Partial<SelectComment> & {
        id?: number | string | bigint;
    };
    postOptions?: PostOption[];
    dict?: Record<string, string>;
};

export default function CommentForm({ defaultValues, postOptions = [], dict = {} }: Props) {
    const isUpdate = Boolean(defaultValues?.id ?? defaultValues?.commentId);
    const id = (defaultValues?.id ?? defaultValues?.commentId)?.toString();

    return (
        <form
            action={isUpdate ? updateCommentAction : createCommentAction}
            className="mb-4 max-w-2xl border border-[#c3c4c7] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-[13px]"
        >
            <div className="mb-3 flex items-center justify-between border-b border-[#c3c4c7] pb-2">
                <h2 className="text-[14px] font-semibold text-[#1d2327]">
                    {isUpdate
                        ? dict["admin.comments.form.edit_title"] || `Edit Comment #${id}`
                        : dict["admin.comments.form.create_title"] || "Add New Comment"}
                </h2>
                <Link
                    href="/admincp/comments"
                    className="text-[13px] text-[#2271b1] hover:underline"
                >
                    {dict["admin.comments.form.back"] || "Back to Comments"}
                </Link>
            </div>

            {isUpdate && id !== undefined && (
                <>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="commentId" value={id} />
                </>
            )}

            <div className="flex flex-col gap-3">
                {/* Associated Post */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="commentPostId" className="font-semibold text-[#1d2327]">
                        {dict["admin.comments.form.post"] || "Associated Post"}
                    </label>
                    {postOptions.length > 0 ? (
                        <select
                            name="commentPostId"
                            id="commentPostId"
                            defaultValue={defaultValues?.commentPostId?.toString() ?? postOptions[0]?.id.toString()}
                            required
                            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        >
                            {postOptions.map((p) => (
                                <option key={p.id.toString()} value={p.id.toString()}>
                                    #{p.id.toString()} — {p.title || "(Untitled Post)"}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            name="commentPostId"
                            id="commentPostId"
                            placeholder="Enter target Post ID"
                            required
                            defaultValue={defaultValues?.commentPostId?.toString() ?? ""}
                            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Author */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="commentAuthor" className="font-semibold text-[#1d2327]">
                            {dict["admin.comments.form.author"] || "Author Name"}
                        </label>
                        <input
                            type="text"
                            name="commentAuthor"
                            id="commentAuthor"
                            placeholder="Author Name"
                            required
                            defaultValue={defaultValues?.commentAuthor ?? ""}
                            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="commentAuthorEmail" className="font-semibold text-[#1d2327]">
                            {dict["admin.comments.form.email"] || "Author Email"}
                        </label>
                        <input
                            type="email"
                            name="commentAuthorEmail"
                            id="commentAuthorEmail"
                            placeholder="email@example.com"
                            defaultValue={defaultValues?.commentAuthorEmail ?? ""}
                            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* URL */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="commentAuthorUrl" className="font-semibold text-[#1d2327]">
                            {dict["admin.comments.form.url"] || "Author URL"}
                        </label>
                        <input
                            type="url"
                            name="commentAuthorUrl"
                            id="commentAuthorUrl"
                            placeholder="https://example.com"
                            defaultValue={defaultValues?.commentAuthorUrl ?? ""}
                            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1">
                        <label htmlFor="commentApproved" className="font-semibold text-[#1d2327]">
                            {dict["admin.comments.form.status"] || "Status"}
                        </label>
                        <select
                            name="commentApproved"
                            id="commentApproved"
                            defaultValue={defaultValues?.commentApproved ?? "1"}
                            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        >
                            <option value="1">Approved</option>
                            <option value="0">Pending</option>
                            <option value="spam">Spam</option>
                            <option value="trash">Trash</option>
                        </select>
                    </div>
                </div>

                {/* Comment Content */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="commentContent" className="font-semibold text-[#1d2327]">
                        {dict["admin.comments.form.content"] || "Comment"}
                    </label>
                    <textarea
                        name="commentContent"
                        id="commentContent"
                        placeholder="Comment text..."
                        required
                        defaultValue={defaultValues?.commentContent ?? ""}
                        rows={4}
                        className="rounded-[3px] border border-[#8c8f94] bg-white p-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] resize-y"
                    />
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="submit"
                        className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 text-[13px] font-normal text-white hover:border-[#0a4b78] hover:bg-[#135e96] cursor-pointer"
                    >
                        {isUpdate
                            ? dict["admin.comments.form.update"] || "Update Comment"
                            : dict["admin.comments.form.create"] || "Submit Comment"}
                    </button>
                    <Link
                        href="/admincp/comments"
                        className="h-[30px] inline-flex items-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-3 text-[13px] text-[#2c3338] hover:bg-[#f0f0f1]"
                    >
                        {dict["admin.comments.form.cancel"] || "Cancel"}
                    </Link>
                </div>
            </div>
        </form>
    );
}
