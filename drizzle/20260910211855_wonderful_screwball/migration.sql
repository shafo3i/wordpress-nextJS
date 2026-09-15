ALTER TABLE "cms_terms" DROP CONSTRAINT "cms_terms_slug_key";--> statement-breakpoint
ALTER TABLE "cms_options" DROP CONSTRAINT "cms_options_option_name_key";--> statement-breakpoint
ALTER TABLE "cms_posts" ADD COLUMN "blog_id" bigint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_terms" ADD COLUMN "blog_id" bigint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_links" ADD COLUMN "blog_id" bigint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_options" ADD COLUMN "blog_id" bigint DEFAULT 1 NOT NULL;--> statement-breakpoint
INSERT INTO "cms_sites" ("id", "domain", "path") VALUES (1, '', '/') ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "cms_blogs" ("blog_id", "site_id", "domain", "path") VALUES (1, 1, '', '/') ON CONFLICT ("blog_id") DO NOTHING;--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('cms_sites', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "cms_sites"), 1), true);--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('cms_blogs', 'blog_id'), GREATEST((SELECT COALESCE(MAX("blog_id"), 1) FROM "cms_blogs"), 1), true);--> statement-breakpoint
ALTER TABLE "cms_terms" ADD CONSTRAINT "cms_terms_blog_slug_unique" UNIQUE("blog_id","slug");--> statement-breakpoint
ALTER TABLE "cms_options" ADD CONSTRAINT "cms_options_blog_name_unique" UNIQUE("blog_id","option_name");--> statement-breakpoint
CREATE INDEX "cms_posts_blog_id_idx" ON "cms_posts" ("blog_id");--> statement-breakpoint
CREATE INDEX "cms_terms_blog_id_idx" ON "cms_terms" ("blog_id");--> statement-breakpoint
CREATE INDEX "cms_links_blog_id_idx" ON "cms_links" ("blog_id");--> statement-breakpoint
CREATE INDEX "cms_options_blog_id_idx" ON "cms_options" ("blog_id");--> statement-breakpoint
ALTER TABLE "cms_posts" ADD CONSTRAINT "cms_posts_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_terms" ADD CONSTRAINT "cms_terms_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_links" ADD CONSTRAINT "cms_links_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_options" ADD CONSTRAINT "cms_options_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;