import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_retailers_business_hours_week_off" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  CREATE TABLE "payload"."retailers_business_hours_week_off" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_retailers_business_hours_week_off",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."retailers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "payload"."brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer,
  	"description" varchar,
  	"featured" boolean DEFAULT false,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."categories" ADD COLUMN "parent_category_id" integer;
  ALTER TABLE "payload"."retailers" ADD COLUMN "email_id" varchar NOT NULL;
  ALTER TABLE "payload"."retailers" ADD COLUMN "alternate_contact_number" varchar;
  ALTER TABLE "payload"."retailers" ADD COLUMN "shop_address_landmark" varchar;
  ALTER TABLE "payload"."retailers" ADD COLUMN "bank_details_upi_id" varchar;
  ALTER TABLE "payload"."retailers" ADD COLUMN "business_hours_start_time" varchar NOT NULL;
  ALTER TABLE "payload"."retailers" ADD COLUMN "business_hours_end_time" varchar NOT NULL;
  ALTER TABLE "payload"."retailers" ADD COLUMN "business_hours_open_everyday" boolean DEFAULT false;
  ALTER TABLE "payload"."products" ADD COLUMN "brand_id" integer;
  ALTER TABLE "payload"."products" ADD COLUMN "warranty" varchar;
  ALTER TABLE "payload"."products" ADD COLUMN "specifications_ram" varchar;
  ALTER TABLE "payload"."products" ADD COLUMN "specifications_storage" varchar;
  ALTER TABLE "payload"."products" ADD COLUMN "specifications_battery" varchar;
  ALTER TABLE "payload"."products" ADD COLUMN "specifications_screen_size" varchar;
  ALTER TABLE "payload"."products" ADD COLUMN "specifications_processor" varchar;
  ALTER TABLE "payload"."products" ADD COLUMN "specifications_camera" varchar;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_brand_id" integer;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_warranty" varchar;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_specifications_ram" varchar;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_specifications_storage" varchar;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_specifications_battery" varchar;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_specifications_screen_size" varchar;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_specifications_processor" varchar;
  ALTER TABLE "payload"."_products_v" ADD COLUMN "version_specifications_camera" varchar;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "payload"."retailers_business_hours_week_off" ADD CONSTRAINT "retailers_business_hours_week_off_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."retailers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."retailers_rels" ADD CONSTRAINT "retailers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."retailers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."retailers_rels" ADD CONSTRAINT "retailers_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "retailers_business_hours_week_off_order_idx" ON "payload"."retailers_business_hours_week_off" USING btree ("order");
  CREATE INDEX "retailers_business_hours_week_off_parent_idx" ON "payload"."retailers_business_hours_week_off" USING btree ("parent_id");
  CREATE INDEX "retailers_rels_order_idx" ON "payload"."retailers_rels" USING btree ("order");
  CREATE INDEX "retailers_rels_parent_idx" ON "payload"."retailers_rels" USING btree ("parent_id");
  CREATE INDEX "retailers_rels_path_idx" ON "payload"."retailers_rels" USING btree ("path");
  CREATE INDEX "retailers_rels_media_id_idx" ON "payload"."retailers_rels" USING btree ("media_id");
  CREATE INDEX "brands_logo_idx" ON "payload"."brands" USING btree ("logo_id");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "payload"."brands" USING btree ("slug");
  CREATE INDEX "brands_updated_at_idx" ON "payload"."brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "payload"."brands" USING btree ("created_at");
  ALTER TABLE "payload"."categories" ADD CONSTRAINT "categories_parent_category_id_categories_id_fk" FOREIGN KEY ("parent_category_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "payload"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "payload"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "payload"."brands"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_parent_category_idx" ON "payload"."categories" USING btree ("parent_category_id");
  CREATE INDEX "products_brand_idx" ON "payload"."products" USING btree ("brand_id");
  CREATE INDEX "_products_v_version_version_brand_idx" ON "payload"."_products_v" USING btree ("version_brand_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("brands_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."retailers_business_hours_week_off" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."retailers_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."brands" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."retailers_business_hours_week_off" CASCADE;
  DROP TABLE "payload"."retailers_rels" CASCADE;
  DROP TABLE "payload"."brands" CASCADE;
  ALTER TABLE "payload"."categories" DROP CONSTRAINT "categories_parent_category_id_categories_id_fk";
  
  ALTER TABLE "payload"."products" DROP CONSTRAINT "products_brand_id_brands_id_fk";
  
  ALTER TABLE "payload"."_products_v" DROP CONSTRAINT "_products_v_version_brand_id_brands_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brands_fk";
  
  DROP INDEX "payload"."categories_parent_category_idx";
  DROP INDEX "payload"."products_brand_idx";
  DROP INDEX "payload"."_products_v_version_version_brand_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_brands_id_idx";
  ALTER TABLE "payload"."categories" DROP COLUMN "parent_category_id";
  ALTER TABLE "payload"."retailers" DROP COLUMN "email_id";
  ALTER TABLE "payload"."retailers" DROP COLUMN "alternate_contact_number";
  ALTER TABLE "payload"."retailers" DROP COLUMN "shop_address_landmark";
  ALTER TABLE "payload"."retailers" DROP COLUMN "bank_details_upi_id";
  ALTER TABLE "payload"."retailers" DROP COLUMN "business_hours_start_time";
  ALTER TABLE "payload"."retailers" DROP COLUMN "business_hours_end_time";
  ALTER TABLE "payload"."retailers" DROP COLUMN "business_hours_open_everyday";
  ALTER TABLE "payload"."products" DROP COLUMN "brand_id";
  ALTER TABLE "payload"."products" DROP COLUMN "warranty";
  ALTER TABLE "payload"."products" DROP COLUMN "specifications_ram";
  ALTER TABLE "payload"."products" DROP COLUMN "specifications_storage";
  ALTER TABLE "payload"."products" DROP COLUMN "specifications_battery";
  ALTER TABLE "payload"."products" DROP COLUMN "specifications_screen_size";
  ALTER TABLE "payload"."products" DROP COLUMN "specifications_processor";
  ALTER TABLE "payload"."products" DROP COLUMN "specifications_camera";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_brand_id";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_warranty";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_specifications_ram";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_specifications_storage";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_specifications_battery";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_specifications_screen_size";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_specifications_processor";
  ALTER TABLE "payload"."_products_v" DROP COLUMN "version_specifications_camera";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "brands_id";
  DROP TYPE "payload"."enum_retailers_business_hours_week_off";`)
}
