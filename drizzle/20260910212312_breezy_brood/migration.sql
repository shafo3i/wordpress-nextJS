CREATE TABLE "cms_theme_activations" (
	"blog_id" bigint PRIMARY KEY,
	"theme_id" bigint NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "cms_theme_activations" ("blog_id", "theme_id")
SELECT 1, "theme_id"
FROM "cms_themes"
WHERE "is_active" = true
ORDER BY "theme_id"
LIMIT 1;
--> statement-breakpoint
ALTER TABLE "cms_menus" DROP CONSTRAINT "cms_menus_slug_key";--> statement-breakpoint
ALTER TABLE "cms_widget_areas" DROP CONSTRAINT "cms_widget_areas_slug_key";--> statement-breakpoint
DROP INDEX "cms_themes_active_idx";--> statement-breakpoint
ALTER TABLE "cms_menus" ADD COLUMN "blog_id" bigint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_widget_areas" ADD COLUMN "blog_id" bigint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms_themes" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "cms_menus" ADD CONSTRAINT "cms_menus_blog_slug_unique" UNIQUE("blog_id","slug");--> statement-breakpoint
ALTER TABLE "cms_widget_areas" ADD CONSTRAINT "cms_widget_areas_blog_slug_unique" UNIQUE("blog_id","slug");--> statement-breakpoint
CREATE INDEX "cms_menus_blog_id_idx" ON "cms_menus" ("blog_id");--> statement-breakpoint
CREATE INDEX "cms_theme_activations_theme_idx" ON "cms_theme_activations" ("theme_id");--> statement-breakpoint
CREATE INDEX "cms_widget_areas_blog_id_idx" ON "cms_widget_areas" ("blog_id");--> statement-breakpoint
ALTER TABLE "cms_menus" ADD CONSTRAINT "cms_menus_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_theme_activations" ADD CONSTRAINT "cms_theme_activations_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_theme_activations" ADD CONSTRAINT "cms_theme_activations_theme_id_cms_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "cms_themes"("theme_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "cms_widget_areas" ADD CONSTRAINT "cms_widget_areas_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;