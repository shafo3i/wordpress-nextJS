import { defineRelations } from "drizzle-orm";
import { user, session, account } from "./auth-schema";
import { wpUsermeta, wpPosts, wpPostmeta } from "./cms-posts";
import {
  wpTerms,
  wpTermmeta,
  wpTermTaxonomy,
  wpTermRelationships,
} from "./cms-taxonomy";
import { wpComments, wpCommentmeta } from "./cms-comments";
import { wpLinks, wpOptions } from "./cms-options";
import { languagesTable, translationsTable, postTranslationsTable } from "./cms-languages";

const schema = {
  user,
  session,
  account,
  wpUsermeta,
  wpPosts,
  wpPostmeta,
  wpOptions,
  wpTerms,
  wpTermmeta,
  wpTermTaxonomy,
  wpTermRelationships,
  wpComments,
  wpCommentmeta,
  wpLinks,
  languagesTable,
  translationsTable,
  postTranslationsTable,
} as const;

export const cmsRelations = defineRelations(schema);
