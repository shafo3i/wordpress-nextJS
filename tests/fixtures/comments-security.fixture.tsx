import { createRoot } from "react-dom/client";
import CommentTable from "../../app/(admin)/admincp/comments/_components/comment-table";

export function mount(dict: Record<string, string>) {
  const row = {
    commentPostId: BigInt(2), commentParent: BigInt(0),
    commentAuthor: '<img src=x onerror="window.commentXss=true">',
    commentAuthorEmail: "reader@example.com", commentAuthorUrl: "javascript:alert(1)",
    commentAuthorIp: "", commentAgent: "", commentKarma: 0,
    commentContent: "<script>window.commentXss=true</script>",
    commentApproved: "0", commentType: "comment", userId: null,
    commentDate: new Date(), commentDateGmt: new Date(),
    postTitle: "Article", postSlug: "news?injected=1", postType: "post",
  };
  createRoot(document.getElementById("fixture")!).render(
    <CommentTable rows={[{ ...row, commentId: BigInt(1) }, { ...row, commentId: BigInt(3) }]} dict={dict} totalItems={2} />
  );
}
