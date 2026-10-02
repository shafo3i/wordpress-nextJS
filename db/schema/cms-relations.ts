import { defineRelations } from "drizzle-orm";
import { user, session, account, twoFactor, rateLimit } from "./auth-schema";
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
  twoFactor,
  rateLimit,
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

export const cmsRelations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    twoFactors: r.many.twoFactor({
      from: r.user.id,
      to: r.twoFactor.userId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  twoFactor: {
    user: r.one.user({
      from: r.twoFactor.userId,
      to: r.user.id,
    }),
  },
}));
