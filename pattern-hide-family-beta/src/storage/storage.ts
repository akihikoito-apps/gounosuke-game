// 安全な端末内保存。読めない・壊れている・容量不足でもゲームは止めない。
import { STORAGE_KEY, type SaveData, defaults, validate } from './schema';

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export type LoadStatus = 'ok' | 'empty' | 'recovered' | 'unavailable';

export class Store {
  private kv: KV | null;
  data: SaveData;
  status: LoadStatus = 'empty';
  lastSaveOk = true;

  constructor(kv: KV | null) {
    this.kv = kv;
    this.data = defaults();
  }

  static fromWindow(): Store {
    let kv: KV | null = null;
    try {
      kv = window.localStorage;
      // アクセスできるか確認（プライベートモード等で例外になる環境がある）
      kv.getItem(STORAGE_KEY);
    } catch {
      kv = null;
    }
    return new Store(kv);
  }

  load(): SaveData {
    if (!this.kv) {
      this.status = 'unavailable';
      this.data = defaults();
      return this.data;
    }
    let raw: string | null = null;
    try {
      raw = this.kv.getItem(STORAGE_KEY);
    } catch {
      this.status = 'unavailable';
      this.data = defaults();
      return this.data;
    }
    if (raw === null) {
      this.status = 'empty';
      this.data = defaults();
      return this.data;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
    const { data, repaired } = validate(parsed);
    this.data = data;
    this.status = repaired ? 'recovered' : 'ok';
    if (repaired) this.save(); // 直した内容で上書き（壊れた値を残さない）
    return this.data;
  }

  save(): boolean {
    if (!this.kv) {
      this.lastSaveOk = false;
      return false;
    }
    try {
      this.kv.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.lastSaveOk = true;
    } catch {
      // 容量不足など。メモリ上の状態のまま遊び続けられる。
      this.lastSaveOk = false;
    }
    return this.lastSaveOk;
  }

  update(fn: (d: SaveData) => void): boolean {
    fn(this.data);
    return this.save();
  }

  /** このアプリのデータだけを消す */
  clearAll(): boolean {
    this.data = defaults();
    if (!this.kv) return false;
    try {
      this.kv.removeItem(STORAGE_KEY);
      this.status = 'empty';
      this.lastSaveOk = true;
      return true;
    } catch {
      return false;
    }
  }
}

export class MemoryKV implements KV {
  map = new Map<string, string>();
  failWrites = false;
  failReads = false;
  getItem(k: string): string | null {
    if (this.failReads) throw new Error('read blocked');
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    if (this.failWrites) throw new DOMException('quota', 'QuotaExceededError');
    this.map.set(k, v);
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
}
