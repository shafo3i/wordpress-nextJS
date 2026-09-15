CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_postmeta" (
	"meta_id" bigserial PRIMARY KEY,
	"post_id" bigint NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "cms_posts" (
	"id" bigserial PRIMARY KEY,
	"post_author" text DEFAULT '' NOT NULL,
	"post_date" timestamp DEFAULT now() NOT NULL,
	"post_date_gmt" timestamp DEFAULT now() NOT NULL,
	"post_content" text DEFAULT '' NOT NULL,
	"post_title" text DEFAULT '' NOT NULL,
	"post_excerpt" text DEFAULT '' NOT NULL,
	"post_status" varchar(20) DEFAULT 'publish' NOT NULL,
	"comment_status" varchar(20) DEFAULT 'open' NOT NULL,
	"ping_status" varchar(20) DEFAULT 'open' NOT NULL,
	"post_password" varchar(255) DEFAULT '' NOT NULL,
	"post_name" varchar(200) DEFAULT '' NOT NULL,
	"to_ping" text DEFAULT '' NOT NULL,
	"pinged" text DEFAULT '' NOT NULL,
	"post_modified" timestamp DEFAULT now() NOT NULL,
	"post_modified_gmt" timestamp DEFAULT now() NOT NULL,
	"post_content_filtered" text DEFAULT '' NOT NULL,
	"post_parent" bigint DEFAULT 0 NOT NULL,
	"guid" varchar(255) DEFAULT '' NOT NULL,
	"menu_order" integer DEFAULT 0 NOT NULL,
	"post_type" varchar(20) DEFAULT 'post' NOT NULL,
	"post_mime_type" varchar(100) DEFAULT '' NOT NULL,
	"comment_count" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_usermeta" (
	"umeta_id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "cms_term_relationships" (
	"object_id" bigint,
	"term_taxonomy_id" bigint,
	"term_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "cms_term_relationships_pkey" PRIMARY KEY("object_id","term_taxonomy_id")
);
--> statement-breakpoint
CREATE TABLE "cms_term_taxonomy" (
	"term_taxonomy_id" bigserial PRIMARY KEY,
	"term_id" bigint NOT NULL,
	"taxonomy" varchar(32) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"parent" bigint DEFAULT 0 NOT NULL,
	"count" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "cms_term_taxonomy_term_taxonomy_unique" UNIQUE("term_id","taxonomy")
);
--> statement-breakpoint
CREATE TABLE "cms_termmeta" (
	"meta_id" bigserial PRIMARY KEY,
	"term_id" bigint NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "cms_terms" (
	"term_id" bigserial PRIMARY KEY,
	"name" varchar(200) DEFAULT '' NOT NULL,
	"slug" varchar(200) NOT NULL UNIQUE,
	"term_group" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_commentmeta" (
	"meta_id" bigserial PRIMARY KEY,
	"comment_id" bigint NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "cms_comments" (
	"comment_id" bigserial PRIMARY KEY,
	"comment_post_id" bigint DEFAULT 0 NOT NULL,
	"comment_author" text DEFAULT '' NOT NULL,
	"comment_author_email" varchar(100) DEFAULT '' NOT NULL,
	"comment_author_url" varchar(200) DEFAULT '' NOT NULL,
	"comment_author_ip" varchar(100) DEFAULT '' NOT NULL,
	"comment_date" timestamp DEFAULT now() NOT NULL,
	"comment_date_gmt" timestamp DEFAULT now() NOT NULL,
	"comment_content" text DEFAULT '' NOT NULL,
	"comment_karma" integer DEFAULT 0 NOT NULL,
	"comment_approved" varchar(20) DEFAULT '1' NOT NULL,
	"comment_agent" varchar(255) DEFAULT '' NOT NULL,
	"comment_type" varchar(20) DEFAULT 'comment' NOT NULL,
	"comment_parent" bigint DEFAULT 0 NOT NULL,
	"user_id" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_links" (
	"link_id" bigserial PRIMARY KEY,
	"link_url" varchar(255) DEFAULT '' NOT NULL,
	"link_name" varchar(255) DEFAULT '' NOT NULL,
	"link_image" varchar(255) DEFAULT '' NOT NULL,
	"link_target" varchar(25) DEFAULT '' NOT NULL,
	"link_description" varchar(255) DEFAULT '' NOT NULL,
	"link_visible" varchar(20) DEFAULT 'Y' NOT NULL,
	"link_owner" text DEFAULT '' NOT NULL,
	"link_rating" bigserial,
	"link_rel" varchar(255) DEFAULT '' NOT NULL,
	"link_notes" text DEFAULT '' NOT NULL,
	"link_rss" varchar(255) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_options" (
	"option_id" bigserial PRIMARY KEY,
	"option_name" varchar(191) NOT NULL UNIQUE,
	"option_value" text DEFAULT '' NOT NULL,
	"autoload" varchar(20) DEFAULT 'yes' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_menu_items" (
	"item_id" bigserial PRIMARY KEY,
	"menu_id" bigint NOT NULL,
	"parent_id" bigint,
	"post_id" bigint,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"url" varchar(255) DEFAULT '' NOT NULL,
	"target" varchar(25) DEFAULT '' NOT NULL,
	"attr_title" varchar(255) DEFAULT '' NOT NULL,
	"description" text,
	"classes" text,
	"xfn" varchar(255) DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_menus" (
	"menu_id" bigserial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"slug" varchar(200) NOT NULL UNIQUE,
	"location" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_plugin_options" (
	"option_id" bigserial PRIMARY KEY,
	"plugin_id" bigint NOT NULL,
	"option_name" varchar(191) NOT NULL,
	"option_value" jsonb DEFAULT '{}' NOT NULL,
	"autoload" boolean DEFAULT true NOT NULL,
	CONSTRAINT "cms_plugin_options_plugin_name_unique" UNIQUE("plugin_id","option_name")
);
--> statement-breakpoint
CREATE TABLE "cms_plugins" (
	"plugin_id" bigserial PRIMARY KEY,
	"slug" varchar(200) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"author" varchar(255),
	"author_url" varchar(255),
	"plugin_url" varchar(255),
	"text_domain" varchar(200),
	"requires_cms" varchar(20),
	"requires_php" varchar(20),
	"network" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"auto_update" boolean DEFAULT false NOT NULL,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_themes" (
	"theme_id" bigserial PRIMARY KEY,
	"slug" varchar(200) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"author" varchar(255),
	"author_url" varchar(255),
	"theme_url" varchar(255),
	"screenshot" varchar(255),
	"text_domain" varchar(200),
	"tags" text,
	"requires_cms" varchar(20),
	"requires_php" varchar(20),
	"parent_theme" varchar(200),
	"is_active" boolean DEFAULT false NOT NULL,
	"auto_update" boolean DEFAULT false NOT NULL,
	"installed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_widget_areas" (
	"area_id" bigserial PRIMARY KEY,
	"slug" varchar(200) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text,
	"theme_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_widgets" (
	"widget_id" bigserial PRIMARY KEY,
	"area_id" bigint,
	"widget_type" varchar(200) NOT NULL,
	"plugin_id" bigint,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_blog_versions" (
	"blog_id" bigint PRIMARY KEY,
	"db_version" varchar(20) DEFAULT '' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_blogs" (
	"blog_id" bigserial PRIMARY KEY,
	"site_id" bigint DEFAULT 1 NOT NULL,
	"domain" varchar(200) DEFAULT '' NOT NULL,
	"path" varchar(100) DEFAULT '' NOT NULL,
	"registered" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"public" smallint DEFAULT 1 NOT NULL,
	"archived" smallint DEFAULT 0 NOT NULL,
	"mature" smallint DEFAULT 0 NOT NULL,
	"spam" smallint DEFAULT 0 NOT NULL,
	"deleted" smallint DEFAULT 0 NOT NULL,
	"lang_id" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_registration_log" (
	"id" bigserial PRIMARY KEY,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"ip" varchar(30) DEFAULT '' NOT NULL,
	"blog_id" bigint DEFAULT 0 NOT NULL,
	"date_registered" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_signups" (
	"signup_id" bigserial PRIMARY KEY,
	"domain" varchar(200) DEFAULT '' NOT NULL,
	"path" varchar(100) DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"user_login" varchar(60) DEFAULT '' NOT NULL,
	"user_email" varchar(100) DEFAULT '' NOT NULL,
	"registered" timestamp DEFAULT now() NOT NULL,
	"activated" timestamp,
	"active" smallint DEFAULT 0 NOT NULL,
	"activation_key" varchar(50) DEFAULT '' NOT NULL,
	"meta" text
);
--> statement-breakpoint
CREATE TABLE "cms_sitemeta" (
	"meta_id" bigserial PRIMARY KEY,
	"site_id" bigint NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "cms_sites" (
	"id" bigserial PRIMARY KEY,
	"domain" varchar(200) DEFAULT '' NOT NULL,
	"path" varchar(100) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "cms_postmeta_post_id_idx" ON "cms_postmeta" ("post_id");--> statement-breakpoint
CREATE INDEX "cms_postmeta_key_idx" ON "cms_postmeta" ("meta_key");--> statement-breakpoint
CREATE INDEX "cms_posts_name_idx" ON "cms_posts" ("post_name");--> statement-breakpoint
CREATE INDEX "cms_posts_type_status_date_idx" ON "cms_posts" ("post_type","post_status","post_date","id");--> statement-breakpoint
CREATE INDEX "cms_posts_parent_idx" ON "cms_posts" ("post_parent");--> statement-breakpoint
CREATE INDEX "cms_posts_author_idx" ON "cms_posts" ("post_author");--> statement-breakpoint
CREATE INDEX "cms_usermeta_user_id_idx" ON "cms_usermeta" ("user_id");--> statement-breakpoint
CREATE INDEX "cms_usermeta_key_idx" ON "cms_usermeta" ("meta_key");--> statement-breakpoint
CREATE INDEX "cms_term_relationships_tax_idx" ON "cms_term_relationships" ("term_taxonomy_id");--> statement-breakpoint
CREATE INDEX "cms_term_taxonomy_taxonomy_idx" ON "cms_term_taxonomy" ("taxonomy");--> statement-breakpoint
CREATE INDEX "cms_termmeta_term_id_idx" ON "cms_termmeta" ("term_id");--> statement-breakpoint
CREATE INDEX "cms_termmeta_key_idx" ON "cms_termmeta" ("meta_key");--> statement-breakpoint
CREATE INDEX "cms_terms_slug_idx" ON "cms_terms" ("slug");--> statement-breakpoint
CREATE INDEX "cms_terms_name_idx" ON "cms_terms" ("name");--> statement-breakpoint
CREATE INDEX "cms_commentmeta_comment_id_idx" ON "cms_commentmeta" ("comment_id");--> statement-breakpoint
CREATE INDEX "cms_commentmeta_key_idx" ON "cms_commentmeta" ("meta_key");--> statement-breakpoint
CREATE INDEX "cms_comments_post_id_idx" ON "cms_comments" ("comment_post_id");--> statement-breakpoint
CREATE INDEX "cms_comments_approved_date_idx" ON "cms_comments" ("comment_approved","comment_date_gmt");--> statement-breakpoint
CREATE INDEX "cms_comments_date_gmt_idx" ON "cms_comments" ("comment_date_gmt");--> statement-breakpoint
CREATE INDEX "cms_comments_parent_idx" ON "cms_comments" ("comment_parent");--> statement-breakpoint
CREATE INDEX "cms_comments_email_idx" ON "cms_comments" ("comment_author_email");--> statement-breakpoint
CREATE INDEX "cms_links_visible_idx" ON "cms_links" ("link_visible");--> statement-breakpoint
CREATE INDEX "cms_options_autoload_idx" ON "cms_options" ("autoload");--> statement-breakpoint
CREATE INDEX "cms_menu_items_menu_idx" ON "cms_menu_items" ("menu_id");--> statement-breakpoint
CREATE INDEX "cms_menu_items_parent_idx" ON "cms_menu_items" ("parent_id");--> statement-breakpoint
CREATE INDEX "cms_plugin_options_plugin_idx" ON "cms_plugin_options" ("plugin_id");--> statement-breakpoint
CREATE INDEX "cms_plugins_active_idx" ON "cms_plugins" ("is_active");--> statement-breakpoint
CREATE INDEX "cms_plugins_slug_idx" ON "cms_plugins" ("slug");--> statement-breakpoint
CREATE INDEX "cms_themes_active_idx" ON "cms_themes" ("is_active");--> statement-breakpoint
CREATE INDEX "cms_widgets_area_idx" ON "cms_widgets" ("area_id");--> statement-breakpoint
CREATE INDEX "cms_widgets_type_idx" ON "cms_widgets" ("widget_type");--> statement-breakpoint
CREATE INDEX "cms_widgets_active_idx" ON "cms_widgets" ("is_active");--> statement-breakpoint
CREATE INDEX "cms_blog_versions_ver_idx" ON "cms_blog_versions" ("db_version");--> statement-breakpoint
CREATE INDEX "cms_blogs_domain_idx" ON "cms_blogs" ("domain","path");--> statement-breakpoint
CREATE INDEX "cms_blogs_lang_id_idx" ON "cms_blogs" ("lang_id");--> statement-breakpoint
CREATE INDEX "cms_registration_log_ip_idx" ON "cms_registration_log" ("ip");--> statement-breakpoint
CREATE INDEX "cms_signups_activation_idx" ON "cms_signups" ("activation_key");--> statement-breakpoint
CREATE INDEX "cms_signups_email_idx" ON "cms_signups" ("user_email");--> statement-breakpoint
CREATE INDEX "cms_signups_login_email_idx" ON "cms_signups" ("user_login","user_email");--> statement-breakpoint
CREATE INDEX "cms_signups_domain_path_idx" ON "cms_signups" ("domain","path");--> statement-breakpoint
CREATE INDEX "cms_sitemeta_key_idx" ON "cms_sitemeta" ("meta_key");--> statement-breakpoint
CREATE INDEX "cms_sitemeta_site_idx" ON "cms_sitemeta" ("site_id");--> statement-breakpoint
CREATE INDEX "cms_sites_domain_idx" ON "cms_sites" ("domain","path");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_postmeta" ADD CONSTRAINT "cms_postmeta_post_id_cms_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "cms_posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_posts" ADD CONSTRAINT "cms_posts_post_author_user_id_fkey" FOREIGN KEY ("post_author") REFERENCES "user"("id") ON DELETE SET DEFAULT;--> statement-breakpoint
ALTER TABLE "cms_usermeta" ADD CONSTRAINT "cms_usermeta_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_term_relationships" ADD CONSTRAINT "cms_term_relationships_a9BB0G5Y8PCB_fkey" FOREIGN KEY ("term_taxonomy_id") REFERENCES "cms_term_taxonomy"("term_taxonomy_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_term_taxonomy" ADD CONSTRAINT "cms_term_taxonomy_term_id_cms_terms_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "cms_terms"("term_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_termmeta" ADD CONSTRAINT "cms_termmeta_term_id_cms_terms_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "cms_terms"("term_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_commentmeta" ADD CONSTRAINT "cms_commentmeta_comment_id_cms_comments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "cms_comments"("comment_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_comments" ADD CONSTRAINT "cms_comments_comment_post_id_cms_posts_id_fkey" FOREIGN KEY ("comment_post_id") REFERENCES "cms_posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_menu_items" ADD CONSTRAINT "cms_menu_items_menu_id_cms_menus_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "cms_menus"("menu_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_menu_items" ADD CONSTRAINT "cms_menu_items_parent_id_cms_menu_items_item_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cms_menu_items"("item_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms_plugin_options" ADD CONSTRAINT "cms_plugin_options_plugin_id_cms_plugins_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "cms_plugins"("plugin_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_widget_areas" ADD CONSTRAINT "cms_widget_areas_theme_id_cms_themes_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "cms_themes"("theme_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms_widgets" ADD CONSTRAINT "cms_widgets_area_id_cms_widget_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "cms_widget_areas"("area_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms_widgets" ADD CONSTRAINT "cms_widgets_plugin_id_cms_plugins_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "cms_plugins"("plugin_id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cms_blog_versions" ADD CONSTRAINT "cms_blog_versions_blog_id_cms_blogs_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "cms_blogs"("blog_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_blogs" ADD CONSTRAINT "cms_blogs_site_id_cms_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "cms_sites"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cms_sitemeta" ADD CONSTRAINT "cms_sitemeta_site_id_cms_sites_id_fkey" FOREIGN KEY ("site_id") REFERENCES "cms_sites"("id") ON DELETE CASCADE;