/**
 * Storage abstraction. "fs" writes under ./storage/ (suitable for dev
 * and small deployments). "s3" is a stub wired to a minimal S3 API shape —
 * plug in the AWS SDK or an R2/MinIO client in production.
 *
 *   const s = getStorage();
 *   const key = await s.put("uploads", "bundle.html", buffer, "text/html");
 *   const url = s.publicUrl(key); // what the frontend loads
 */
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

export type Storage = {
  put(ns: string, filename: string, data: Buffer, contentType: string): Promise<string>;
  publicUrl(key: string): string;
  delete(key: string): Promise<void>;
};

class FsStorage implements Storage {
  constructor(private baseDir: string, private baseUrl: string) {}

  async put(ns: string, filename: string, data: Buffer, _ct: string): Promise<string> {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
    const key = `${ns}/${hash}-${safe}`;
    const abs = path.join(this.baseDir, key);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
    return key;
  }
  publicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
  async delete(key: string): Promise<void> {
    const abs = path.join(this.baseDir, key);
    await fs.unlink(abs).catch(() => {});
  }
}

class S3Storage implements Storage {
  // Minimal interface — swap in aws-sdk / @aws-sdk/client-s3 in prod.
  async put(_ns: string, _filename: string, _data: Buffer, _ct: string): Promise<string> {
    throw new Error("S3 storage not wired up in this prototype. See RUNBOOK.md.");
  }
  publicUrl(key: string): string {
    const base = process.env.S3_PUBLIC_BASE_URL;
    if (!base) throw new Error("S3_PUBLIC_BASE_URL not set");
    return `${base}/${key}`;
  }
  async delete(_key: string): Promise<void> {
    throw new Error("S3 storage not wired up in this prototype. See RUNBOOK.md.");
  }
}

let _storage: Storage | null = null;

export function getStorage(): Storage {
  if (_storage) return _storage;
  const driver = process.env.STORAGE_DRIVER ?? "fs";
  if (driver === "s3") {
    _storage = new S3Storage();
  } else {
    _storage = new FsStorage(
      path.resolve(process.cwd(), "storage"),
      "/api/files"
    );
  }
  return _storage;
}
