import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { BaseRecord, CollectionFile, CreateInput, QueryOptions, QueryResult, UpdateInput } from './types';
import { generateId, now } from './utils';

export type JsonDBErrorCode = 'NOT_FOUND' | 'DUPLICATE_ID' | 'VALIDATION_ERROR' | 'IO_ERROR' | 'READ_ONLY';

export class JsonDBError extends Error {
  constructor(message: string, public readonly code: JsonDBErrorCode, public readonly statusCode = 500) {
    super(message);
    this.name = 'JsonDBError';
  }
}

const locks = new Map<string, Promise<void>>();
const dataDir = path.resolve(process.env.DATA_DIR ?? './data');

function resolveCollectionPath(name: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new JsonDBError('Nombre de colección inválido', 'VALIDATION_ERROR', 400);
  }

  return path.join(dataDir, `${name}.json`);
}

async function readCollection<T extends BaseRecord>(name: string): Promise<CollectionFile<T>> {
  try {
    const raw = await readFile(resolveCollectionPath(name), 'utf8');
    return JSON.parse(raw) as CollectionFile<T>;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw new JsonDBError(code === 'ENOENT' ? 'Colección no encontrada' : 'No se pudo leer la colección', 'IO_ERROR', code === 'ENOENT' ? 404 : 500);
  }
}

async function writeCollection<T extends BaseRecord>(name: string, data: CollectionFile<T>): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new JsonDBError('Las escrituras están deshabilitadas en producción', 'READ_ONLY', 503);
  }

  const filePath = resolveCollectionPath(name);
  const previous = locks.get(filePath) ?? Promise.resolve();
  const next = previous.then(async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    const backupDir = path.join(dataDir, '_backups');
    await mkdir(backupDir, { recursive: true });
    try {
      await copyFile(filePath, path.join(backupDir, `${name}_${Date.now()}.json`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(data, null, 2), 'utf8');
    await rename(temporaryPath, filePath);
  });
  locks.set(filePath, next.catch(() => undefined));
  await next;
}

export async function getAll<T extends BaseRecord>(name: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
  const collection = await readCollection<T>(name);
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, options.limit ?? (collection.records.length || 1));
  const records = [...collection.records];
  if (options.sortBy) {
    records.sort((left, right) => String(left[options.sortBy as keyof T]).localeCompare(String(right[options.sortBy as keyof T])));
    if (options.sortOrder === 'desc') records.reverse();
  }
  return { data: records.slice(offset, offset + limit), total: records.length, limit, offset };
}

export async function getById<T extends BaseRecord>(name: string, id: string): Promise<T | null> {
  const collection = await readCollection<T>(name);
  return collection.records.find((record) => record.id === id) ?? null;
}

export async function create<T extends BaseRecord>(name: string, input: CreateInput<T>): Promise<T> {
  const collection = await readCollection<T>(name);
  const record = { ...input, id: generateId(name), createdAt: now(), updatedAt: now() } as T;
  if (collection.records.some((item) => item.id === record.id)) throw new JsonDBError('ID duplicado', 'DUPLICATE_ID', 409);
  collection.records.push(record);
  collection._meta.lastModified = now();
  await writeCollection(name, collection);
  return record;
}

export async function update<T extends BaseRecord>(name: string, id: string, partial: UpdateInput<T>): Promise<T> {
  const collection = await readCollection<T>(name);
  const index = collection.records.findIndex((record) => record.id === id);
  if (index < 0) throw new JsonDBError('Registro no encontrado', 'NOT_FOUND', 404);
  const current = collection.records[index] as T;
  const updated = { ...current, ...partial, id: current.id, createdAt: current.createdAt, updatedAt: now() } as T;
  collection.records[index] = updated;
  collection._meta.lastModified = now();
  await writeCollection(name, collection);
  return updated;
}

export async function remove(name: string, id: string): Promise<boolean> {
  const collection = await readCollection(name);
  const originalLength = collection.records.length;
  collection.records = collection.records.filter((record) => record.id !== id);
  if (collection.records.length === originalLength) throw new JsonDBError('Registro no encontrado', 'NOT_FOUND', 404);
  collection._meta.lastModified = now();
  await writeCollection(name, collection);
  return true;
}

export async function query<T extends BaseRecord>(name: string, filter: (record: T) => boolean): Promise<T[]> {
  const collection = await readCollection<T>(name);
  return collection.records.filter(filter);
}

export async function count(name: string): Promise<number> {
  const collection = await readCollection(name);
  return collection.records.length;
}
