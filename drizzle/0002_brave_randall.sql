ALTER TABLE "barang" DROP CONSTRAINT "chk_jumlah_positif";--> statement-breakpoint
ALTER TABLE "barang" DROP COLUMN "jumlah";--> statement-breakpoint
ALTER TABLE "barang" DROP COLUMN "satuan";--> statement-breakpoint
ALTER TABLE "mutasi_barang" DROP COLUMN "jumlah";