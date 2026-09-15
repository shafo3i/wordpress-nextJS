wp_options	Site URL, active plugins, theme settings, transients, rewrite rules, cron data	WordPress bootstrap, plugin settings, site configuration	Wrong URL redirects, missing settings, plugin failures, broken cron, slow autoloaded options
wp_posts	Posts, pages, attachments, revisions, menus, custom post types	Content, media library, navigation menus, many plugin data types	Missing pages/posts/media, broken menus, missing custom post type entries
wp_postmeta	Metadata for posts, pages, attachments, products, page builders, SEO plugins	Featured images, product data, SEO fields, builder layouts	Missing images, broken layouts, missing product data, incomplete SEO metadata
wp_users	User accounts, logins, password hashes, emails, display names	Authentication and authorship	Users cannot log in, authors disappear
wp_usermeta	User roles, capabilities, profile fields, plugin user settings	Permissions and user-specific settings	Admin loses permissions, roles disappear, user settings break
wp_comments	Comments, pingbacks, trackbacks, reviews	Comments and review systems	Comments or reviews disappear
wp_commentmeta	Metadata for comments and reviews	Spam status, ratings, plugin comment data	Review metadata, spam data, or plugin comment data is lost
wp_terms	Term names and slugs	Categories, tags, link categories, custom taxonomy terms	Category and tag names disappear
wp_termmeta	Metadata for taxonomy terms	Term images, SEO metadata, custom term fields	Category/tag metadata disappears
wp_term_taxonomy	Taxonomy type, parent relationship, term counts	Distinguishes category vs tag vs custom taxonomy	Categories/tags become incorrectly mapped or lose hierarchy
wp_term_relationships	Relationships between content and taxonomy terms	Assigns posts/products/pages to categories and tags	Posts lose categories/tags, menus and taxonomy relationships break
wp_links	Legacy blogroll/link manager data	Deprecated Links Manager feature and old plugins	Usually nothing on modern sites, unless an old plugin still uses it





wp_options
wp_users,
wp_usermeta
wp_posts
wp_postmeta
wp_terms
wp_term_relationships
wp_term_taxonomy
wp_termmeta
wp_comments
wp_commentmeta
wp_links





Table Details
The following are the specific fields in each of the tables created during the standard WordPress installation.

Table: wp_commentmeta
Field	Type	Null	Key	Default	Extra
meta_id	bigint(20) unsigned	 	PRI	 	auto_increment
comment_id	bigint(20) unsigned	 	IND	0	 
meta_key	varchar(255)	YES	IND	NULL	 
meta_value	longtext	YES	 	NULL	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	meta_id
comment_id	INDEX	comment_id
meta_key	INDEX	meta_key


Table: wp_comments
Field	Type	Null	Key	Default	Extra
comment_ID	bigint(20) unsigned	 	PRI	 	auto_increment
comment_post_ID	bigint(20) unsigned	 	IND	0	 
comment_author	tinytext	 	 	 	 
comment_author_email	varchar(100)	 	IND	 	 
comment_author_url	varchar(200)	 	 	 	 
comment_author_IP	varchar(100)	 	 	 	 
comment_date	datetime	 	 	0000-00-00 00:00:00	 
comment_date_gmt	datetime	 	IND & IND Pt2	0000-00-00 00:00:00	 
comment_content	text	 	 	 	 
comment_karma	int(11)	 	 	0	 
comment_approved	varchar(20)	 	IND Pt1	1	 
comment_agent	varchar(255)	 	 	 	 
comment_type	varchar(20)	 	 	 	 
comment_parent	bigint(20) unsigned	 	IND	0	 
user_id	bigint(20) unsigned	 	 	0	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	comment_ID
comment_post_ID	INDEX	comment_post_ID
comment_approved_date_gmt	INDEX	comment_approved
comment_date_gmt
comment_date_gmt	INDEX	comment_date_gmt
comment_parent	INDEX	comment_parent
comment_author_email	INDEX	comment_author_email


Table: wp_links
Field	Type	Null	Key	Default	Extra
link_id	bigint(20) unsigned	 	PRI	 	auto_increment
link_url	varchar(255)	 	 	 	 
link_name	varchar(255)	 	 	 	 
link_image	varchar(255)	 	 	 	 
link_target	varchar(25)	 	 	 	 
link_description	varchar(255)	 	 	 	 
link_visible	varchar(20)	 	IND	Y	 
link_owner	bigint(20) unsigned	 	 	1	 
link_rating	int(11)	 	 	0	 
link_updated	datetime	 	 	0000-00-00 00:00:00	 
link_rel	varchar(255)	 	 	 	 
link_notes	mediumtext	 	 	 	 
link_rss	varchar(255)	 	 	 	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	link_id
link_visible	INDEX	link_visible


Table: wp_options
Field	Type	Null	Key	Default	Extra
option_id	bigint(20) unsigned	 	PRI	 	auto_increment
option_name	varchar(64)	 	UNI	 	 
option_value	longtext	 	 	 	
autoload	varchar(20)	 	IND	yes	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	option_id
option_name	UNIQUE	option_name
autoload	INDEX	autoload
Table: wp_postmeta
Field	Type	Null	Key	Default	Extra
meta_id	bigint(20) unsigned	 	PRI	 	auto_increment
post_id	bigint(20) unsigned	 	IND	0	 
meta_key	varchar(255)	YES	IND	NULL	 
meta_value	longtext	YES	 	NULL	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	meta_id
post_id	INDEX	post_id
meta_key	INDEX	meta_key


Table: wp_posts
Field	Type	Null	Key	Default	Extra
ID	bigint(20) unsigned	 	PRI & IND Pt4	 	auto_increment
post_author	bigint(20) unsigned	 	IND	0	 
post_date	datetime	 	IND Pt3	0000-00-00 00:00:00	 
post_date_gmt	datetime	 	 	0000-00-00 00:00:00	 
post_content	longtext	 	 	 	 
post_title	text	 	 	 	 
post_excerpt	text	 	 	 	 
post_status	varchar(20)	 	IND PT2	publish	 
comment_status	varchar(20)	 	 	open	 
ping_status	varchar(20)	 	 	open	 
post_password	varchar(20)	 	 	 	 
post_name	varchar(200)	 	IND	 	 
to_ping	text	 	 	 	 
pinged	text	 	 	 	 
post_modified	datetime	 	 	0000-00-00 00:00:00	 
post_modified_gmt	datetime	 	 	0000-00-00 00:00:00	 
post_content_filtered	longtext	 	 	 	
post_parent	bigint(20) unsigned	 	IND	0	 
guid	varchar(255)	 	 	 	 
menu_order	int(11)	 	 	0	 
post_type	varchar(20)	 	IND Pt1	post	 
post_mime_type	varchar(100)	 	 	 	 
comment_count	bigint(20)	 	 	0	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	ID
post_name	INDEX	post_name
type_status_date	INDEX	post_type
post_status
post_date
ID
post_parent	INDEX	post_parent
post_author	INDEX	post_author


Table: wp_terms
Field	Type	Null	Key	Default	Extra
term_id	bigint(20) unsigned	 	PRI	 	auto_increment
name	varchar(200)	 	IND	 	 
slug	varchar(200)	 	MUL	 	 
term_group	bigint(10)	 	 	0	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	term_id
slug	UNIQUE	slug
name	INDEX	name
Table: wp_termmeta
Field	Type	Null	Key	Default	Extra
meta_id	bigint(20) unsigned	 	PRI	 	auto_increment
term_id	bigint(20) unsigned	 	IND	0	 
meta_key	varchar(255)	YES	IND	NULL	 
meta_value	longtext	YES	 	NULL	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	meta_id
term_id	INDEX	term_id
meta_key	INDEX	meta_key


Table: wp_term_relationships
Field	Type	Null	Key	Default	Extra
object_id	bigint(20) unsigned	 	PRI Pt1	0	 
term_taxonomy_id	bigint(20) unsigned	 	PRI Pt2 & IND	0	 
term_order	int(11)	 	 	0	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	object_id
term_taxonomy_id
term_taxonomy_id	INDEX	term_taxonomy_id


Table: wp_term_taxonomy
Field	Type	Null	Key	Default	Extra
term_taxonomy_id	bigint(20) unsigned	 	PRI	 	auto_increment
term_id	bigint(20) unsigned	 	UNI Pt1	0	 
taxonomy	varchar(32)	 	UNI Pt2 & IND	 	 
description	longtext	 	 	 	 
parent	bigint(20) unsigned	 	 	0	 
count	bigint(20)	 	 	0	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	term_taxonomy_id
term_id_taxonomy	UNIQUE	term_id
taxonomy
taxonomy	INDEX	taxonomy


Table: wp_usermeta
Field	Type	Null	Key	Default	Extra
umeta_id	bigint(20) unsigned	 	PRI	 	auto_increment
user_id	bigint(20) unsigned	 	IND	0	 
meta_key	varchar(255)	Yes	IND	NULL	 
meta_value	longtext	Yes	 	NULL	 
Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	umeta_id
user_id	INDEX	user_id
meta_key	INDEX	meta_key
Table: wp_users
Field	Type	Null	Key	Default	Extra
ID	bigint(20) unsigned	 	PRI	 	auto_increment
user_login	varchar(60)	 	IND	 	 
user_pass	varchar(64)	 	 	 	 
user_nicename	varchar(50)	 	IND	 	 
user_email	varchar(100)	 	 	 	 
user_url	varchar(100)	 	 	 	 
user_registered	datetime	 	 	0000-00-00 00:00:00	 
user_activation_key	varchar(60)	 	 	 	
user_status	int(11)	 	 	0	 
display_name	varchar(250)	 	 	 	 

NOTE: Enabling Multisite feature of WordPress adds two fields in wp_users table: spam and deleted. Refer the Multisite version.

Indexes
Keyname	Type	Field
PRIMARY	PRIMARY	ID
user_login_key	INDEX	user_login
user_nicename	INDEX	user_nicename
