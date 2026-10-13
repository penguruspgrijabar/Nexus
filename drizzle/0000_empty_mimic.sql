CREATE TYPE "public"."kondisi" AS ENUM('baik', 'rusak_ringan', 'rusak_berat');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'operator', 'viewer');--> statement-breakpoint
CREATE TABLE "barang" (
	"id" serial PRIMARY KEY NOT NULL,
	"kode_barang" varchar(30) NOT NULL,
	"nama_barang" varchar(150) NOT NULL,
	"kategori" varchar(50),
	"merk" varchar(80),
	"spesifikasi" text,
	"jumlah" integer DEFAULT 0 NOT NULL,
	"satuan" varchar(20) DEFAULT 'pcs' NOT NULL,
	"kondisi" "kondisi" DEFAULT 'baik' NOT NULL,
	"ruangan_id" integer,
	"dicatat_oleh" integer,
	"tanggal_perolehan" date,
	"harga_beli" numeric(15, 2),
	"foto" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "barang_kode_barang_unique" UNIQUE("kode_barang"),
	CONSTRAINT "chk_jumlah_positif" CHECK ("barang"."jumlah" >= 0)
);
--> statement-breakpoint
CREATE TABLE "mutasi_barang" (
	"id" serial PRIMARY KEY NOT NULL,
	"barang_id" integer NOT NULL,
	"ruangan_asal" integer,
	"ruangan_tujuan" integer,
	"jumlah" integer DEFAULT 1 NOT NULL,
	"petugas_id" integer,
	"keterangan" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ruangan" (
	"id" serial PRIMARY KEY NOT NULL,
	"kode_ruangan" varchar(20) NOT NULL,
	"nama_ruangan" varchar(100) NOT NULL,
	"lantai" varchar(20),
	"lokasi" varchar(255),
	"deskripsi" text,
	"penanggung_jawab_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ruangan_kode_ruangan_unique" UNIQUE("kode_ruangan")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"telepon" varchar(20),
	"aktif" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_ruangan_id_ruangan_id_fk" FOREIGN KEY ("ruangan_id") REFERENCES "public"."ruangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_dicatat_oleh_user_id_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_barang" ADD CONSTRAINT "mutasi_barang_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_barang" ADD CONSTRAINT "mutasi_barang_ruangan_asal_ruangan_id_fk" FOREIGN KEY ("ruangan_asal") REFERENCES "public"."ruangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_barang" ADD CONSTRAINT "mutasi_barang_ruangan_tujuan_ruangan_id_fk" FOREIGN KEY ("ruangan_tujuan") REFERENCES "public"."ruangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_barang" ADD CONSTRAINT "mutasi_barang_petugas_id_user_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ruangan" ADD CONSTRAINT "ruangan_penanggung_jawab_id_user_id_fk" FOREIGN KEY ("penanggung_jawab_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_barang_ruangan" ON "barang" USING btree ("ruangan_id");--> statement-breakpoint
CREATE INDEX "idx_barang_kategori" ON "barang" USING btree ("kategori");--> statement-breakpoint
CREATE INDEX "idx_ruangan_nama" ON "ruangan" USING btree ("nama_ruangan");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "user" USING btree ("role");