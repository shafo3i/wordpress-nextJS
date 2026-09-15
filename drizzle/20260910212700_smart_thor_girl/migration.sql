ALTER TABLE "cms_plugin_options" DROP CONSTRAINT "cms_plugin_options_plugin_name_unique";--> statement-breakpoint
ALTER TABLE "cms_plugin_options" ADD COLUMN "blog_id" bigint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_comments" ALTER COLUMN "comment_post_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "cms_comments" ALTER COLUMN "comment_post_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_plugin_options" ADD CONSTRAINT "cms_plugin_options_blog_plugin_name_unique" UNIQUE("blog_id","plugin_id","option_name");--> statement-breakpoint
CREATE INDEX "cms_plugin_options_blog_id_idx" ON "cms_plugin_options" ("blog_id");--> statement-breakpoint
ALTER TABLE "cms_plugin_options" ADD CONSTRAINT "cms_plugin_options_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;