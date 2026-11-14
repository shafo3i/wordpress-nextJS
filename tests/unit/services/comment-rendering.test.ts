import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
import ar from "@/templates/language/ar.json";
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/(admin)/admincp/comments/action", () => ({ createCommentAction: vi.fn(), updateCommentAction: vi.fn(), bulkDeleteComments: vi.fn(), bulkUpdateCommentStatus: vi.fn(), deleteCommentAction: vi.fn(), updateCommentStatusAction: vi.fn() }));
import CommentTable from "@/app/(admin)/admincp/comments/_components/comment-table";
import CommentForm from "@/app/(admin)/admincp/comments/_components/comment-form";
const row = { commentId: BigInt(1), commentPostId: BigInt(2), commentParent: BigInt(0), commentAuthor: "<img src=x onerror=alert(1)>", commentAuthorEmail: "reader@example.com?subject=injected", commentAuthorUrl: "javascript:alert(1)", commentAuthorIp: "", commentAgent: "", commentKarma: 0, commentContent: "<script>alert(1)</script>", commentApproved: "0", commentType: "comment", userId: null, commentDate: new Date(), commentDateGmt: new Date(), postTitle: "<svg onload=alert(1)>", postSlug: "news?injected=1#fragment" };
describe("comment rendering safety", () => {
  it.each([en, ar])("escapes imported HTML and blocks dangerous author links", dict => {
    const html = renderToStaticMarkup(createElement(CommentTable, { rows: [row], dict }));
    expect(html).not.toContain("<script>alert(1)</script>"); expect(html).not.toContain("<img"); expect(html).not.toContain("<svg onload");
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain('href="javascript:');
    expect(html).toContain("/posts/news%3Finjected%3D1%23fragment");
    expect(html).toContain("mailto:reader%40example.com%3Fsubject%3Dinjected");
  });
  it("uses safe HTTP links with UGC restrictions", () => {
    const html = renderToStaticMarkup(createElement(CommentTable, { rows: [{ ...row, commentAuthorUrl: "https://example.com/" }], dict: en }));
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain('rel="ugc nofollow noopener noreferrer"');
  });
  it("localizes moderation statuses in Arabic forms", () => {
    const html = renderToStaticMarkup(createElement(CommentForm, { dict: ar, postOptions: [] }));
    expect(html).toContain(ar["admin.comments.filter.approved"]);
    expect(html).not.toContain(">Approved</option>");
  });
});
