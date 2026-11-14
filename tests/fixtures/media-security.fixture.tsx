import { createRoot } from "react-dom/client";
import { useState } from "react";
import { AttachmentDetailsModal } from "../../app/(admin)/admincp/media/_components/attachment-details-modal";
import { MediaLibraryView } from "../../app/(admin)/admincp/media/_components/media-library-view";
function Fixture({ dict, kind }: { dict: Record<string, string>; kind: string }) {
  const [updates, setUpdates] = useState(0);
  if (kind === "library") return <MediaLibraryView dict={dict} direction="ltr" initialData={{ items: [], total: 0, totalPages: 1, currentPage: 1, availableMonths: [] }} />;
  return <>
    <output data-updates={updates}>{updates}</output>
    <AttachmentDetailsModal dict={dict} direction="ltr" item={{ id: 1, title: '<img src=x onerror="alert(1)">', filename: "file.pdf", url: "javascript:alert(1)", thumbnailUrl: "", mimeType: "application/pdf", sizeBytes: 20, altText: "", caption: "", description: "", uploadedAt: "2026-11-01T00:00:00Z", authorName: "Editor" }} onUpdate={() => setUpdates(count => count + 1)} onDelete={async () => false} onClose={() => { document.getElementById("fixture")!.dataset.closed = "true"; }} />
  </>;
}
export function mount(dict: Record<string, string>, kind = "modal") { createRoot(document.getElementById("fixture")!).render(<Fixture dict={dict} kind={kind} />); }
