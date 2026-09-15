ALTER TABLE "cms_posts" ALTER COLUMN "post_author" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "cms_posts" ALTER COLUMN "post_author" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_comments" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "cms_comments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_links" ALTER COLUMN "link_owner" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "cms_links" ALTER COLUMN "link_owner" DROP NOT NULL;--> statement-breakpoint
UPDATE "cms_posts" SET "post_author" = NULL WHERE "post_author" = '';--> statement-breakpoint
UPDATE "cms_comments" SET "user_id" = NULL WHERE "user_id" = '';--> statement-breakpoint
UPDATE "cms_links" SET "link_owner" = NULL WHERE "link_owner" = '';--> statement-breakpoint
ALTER TABLE "cms_links" ALTER COLUMN "link_rating" DROP DEFAULT;--> statement-breakpoint
DROP SEQUENCE "cms_links_link_rating_seq";--> statement-breakpoint
ALTER TABLE "cms_links" ALTER COLUMN "link_rating" SET DATA TYPE integer USING "link_rating"::integer;--> statement-breakpoint
ALTER TABLE "cms_links" ALTER COLUMN "link_rating" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cms_comments" ADD CONSTRAINT "cms_comments_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms_links" ADD CONSTRAINT "cms_links_link_owner_user_id_fkey" FOREIGN KEY ("link_owner") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms_menu_items" ADD CONSTRAINT "cms_menu_items_post_id_cms_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "cms_posts"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms_posts" DROP CONSTRAINT "cms_posts_post_author_user_id_fkey", ADD CONSTRAINT "cms_posts_post_author_user_id_fkey" FOREIGN KEY ("post_author") REFERENCES "user"("id") ON DELETE SET NULL;