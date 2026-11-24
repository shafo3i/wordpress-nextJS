import { ShowPagination } from "../../shows/_components/show-pagination"
export function EpisodePagination(
  props: Omit<Parameters<typeof ShowPagination>[0], "basePath">
) {
  return <ShowPagination {...props} basePath="/admincp/podcasts/episodes" />
}
