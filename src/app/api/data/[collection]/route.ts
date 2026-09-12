import { NextResponse } from 'next/server';
import { getSchema } from '@data/_schema/registry';
import { create, getAll, getById, remove, update, JsonDBError } from '@/lib/json-db';
import type { BaseRecord } from '@/lib/types';

interface RouteContext { params: Promise<{ collection: string }>; }

function errorResponse(error: unknown) {
  const dbError = error instanceof JsonDBError ? error : new JsonDBError('Error interno', 'IO_ERROR');
  return NextResponse.json({ success: false, error: dbError.message, code: dbError.code, timestamp: new Date().toISOString() }, { status: dbError.statusCode });
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { collection } = await params;
    if (!getSchema(collection)) return errorResponse(new JsonDBError('Colección no registrada', 'NOT_FOUND', 404));
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const data = id ? await getById(collection, id) : await getAll(collection, { limit: Number(url.searchParams.get('limit') ?? 50), offset: Number(url.searchParams.get('offset') ?? 0), sortBy: url.searchParams.get('sortBy') ?? undefined, sortOrder: (url.searchParams.get('sortOrder') as 'asc' | 'desc' | null) ?? undefined });
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { collection } = await params;
    const schema = getSchema(collection);
    if (!schema) return errorResponse(new JsonDBError('Colección no registrada', 'NOT_FOUND', 404));
    const body = schema.omit({ id: true, createdAt: true, updatedAt: true }).parse(await request.json());
    const data = await create(collection, body as never);
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { collection } = await params;
    const schema = getSchema(collection);
    if (!schema) return errorResponse(new JsonDBError('Colección no registrada', 'NOT_FOUND', 404));
    const body = (await request.json()) as Partial<BaseRecord> & Record<string, unknown>;
    if (typeof body.id !== 'string') return errorResponse(new JsonDBError('El id es obligatorio', 'VALIDATION_ERROR', 400));
    const data = await update(collection, body.id, schema.omit({ id: true, createdAt: true, updatedAt: true }).partial().parse(body) as never);
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { collection } = await params;
    if (!getSchema(collection)) return errorResponse(new JsonDBError('Colección no registrada', 'NOT_FOUND', 404));
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return errorResponse(new JsonDBError('El id es obligatorio', 'VALIDATION_ERROR', 400));
    await remove(collection, id);
    return NextResponse.json({ success: true, data: true, timestamp: new Date().toISOString() });
  } catch (error) { return errorResponse(error); }
}
