import { supabase } from './supabase';

/** Supabase tablo adı — SQL ile aynı olmalı */
export const SCHEDULE_PROGRAMS_TABLE = 'ders_programi_programs';

export interface ScheduleProgramPayload {
  assignmentsByDay: Record<string, Record<string, unknown>>;
  visibleGroups: string[];
  teacherViewEntries: Record<string, unknown>;
}

export interface ScheduleProgramRow {
  id: string;
  user_id: string | null;
  program_name: string;
  data: ScheduleProgramPayload;
  created_at: string;
  updated_at: string;
}

export type ScheduleServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

function isNetworkErrorMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('fetch') ||
    m.includes('network') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('timeout')
  );
}

function mapSupabaseError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    const msg = (err as { message: string }).message;
    if (isNetworkErrorMessage(msg)) return 'Ağ hatası: İnternet bağlantınızı kontrol edin.';
    return msg;
  }
  return fallback;
}

function ensurePayload(data: unknown): ScheduleProgramPayload | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const assignmentsByDay = o.assignmentsByDay;
  const visibleGroups = o.visibleGroups;
  const teacherViewEntries = o.teacherViewEntries;
  if (!assignmentsByDay || typeof assignmentsByDay !== 'object') return null;
  if (!Array.isArray(visibleGroups)) return null;
  if (!teacherViewEntries || typeof teacherViewEntries !== 'object') return null;
  return {
    assignmentsByDay: assignmentsByDay as Record<string, Record<string, unknown>>,
    visibleGroups: visibleGroups.filter((g): g is string => typeof g === 'string'),
    teacherViewEntries: teacherViewEntries as Record<string, unknown>,
  };
}

/**
 * Kullanıcının tüm program kayıtlarını listeler (updated_at azalan).
 */
export async function getSchedules(userId: string | null): Promise<ScheduleServiceResult<ScheduleProgramRow[]>> {
  if (!userId || !String(userId).trim()) {
    return { ok: false, error: 'Oturum bulunamadı: programlar yüklenemiyor.', code: 'no_user' };
  }

  try {
    const { data, error } = await supabase
      .from(SCHEDULE_PROGRAMS_TABLE)
      .select('id, user_id, program_name, data, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return { ok: false, error: mapSupabaseError(error, 'Supabase: programlar alınamadı.'), code: error.code };
    }

    const rows: ScheduleProgramRow[] = (data ?? []).map((row) => {
      const payload = ensurePayload(row.data) ?? {
        assignmentsByDay: {},
        visibleGroups: [],
        teacherViewEntries: {},
      };
      return {
        id: String(row.id),
        user_id: row.user_id != null ? String(row.user_id) : null,
        program_name: String(row.program_name ?? ''),
        data: payload,
        created_at: String(row.created_at ?? ''),
        updated_at: String(row.updated_at ?? ''),
      };
    });

    return { ok: true, data: rows };
  } catch (e) {
    return { ok: false, error: mapSupabaseError(e, 'Beklenmeyen hata: programlar alınamadı.') };
  }
}

export interface SaveScheduleInput {
  userId: string;
  programName: string;
  data: ScheduleProgramPayload;
}

/**
 * Yeni program satırı ekler.
 */
export async function saveSchedule(input: SaveScheduleInput): Promise<ScheduleServiceResult<ScheduleProgramRow>> {
  const uid = String(input.userId ?? '').trim();
  if (!uid) {
    return { ok: false, error: 'Kayıt için oturum gerekli.', code: 'no_user' };
  }
  const name = String(input.programName ?? '').trim() || 'Ana program';
  if (!input.data || typeof input.data !== 'object') {
    return { ok: false, error: 'Kaydedilecek veri boş veya geçersiz.', code: 'empty_data' };
  }

  try {
    const { data, error } = await supabase
      .from(SCHEDULE_PROGRAMS_TABLE)
      .insert({
        user_id: uid,
        program_name: name,
        data: input.data as unknown as Record<string, unknown>,
      })
      .select('id, user_id, program_name, data, created_at, updated_at')
      .single();

    if (error) {
      return { ok: false, error: mapSupabaseError(error, 'Supabase: kayıt oluşturulamadı.'), code: error.code };
    }
    if (!data) {
      return { ok: false, error: 'Sunucu yanıtı boş.', code: 'empty_response' };
    }

    const payload = ensurePayload(data.data);
    if (!payload) {
      return { ok: false, error: 'Kaydedilen veri biçimi geçersiz.', code: 'invalid_payload' };
    }

    return {
      ok: true,
      data: {
        id: String(data.id),
        user_id: data.user_id != null ? String(data.user_id) : null,
        program_name: String(data.program_name ?? ''),
        data: payload,
        created_at: String(data.created_at ?? ''),
        updated_at: String(data.updated_at ?? ''),
      },
    };
  } catch (e) {
    return { ok: false, error: mapSupabaseError(e, 'Beklenmeyen hata: kayıt oluşturulamadı.') };
  }
}

export interface UpdateScheduleInput {
  programName?: string;
  data?: ScheduleProgramPayload;
}

/**
 * Mevcut programı günceller (yalnızca sahibi — RLS).
 */
export async function updateSchedule(
  id: string,
  input: UpdateScheduleInput
): Promise<ScheduleServiceResult<ScheduleProgramRow>>
{
  const rid = String(id ?? '').trim();
  if (!rid) {
    return { ok: false, error: 'Geçersiz program kimliği.', code: 'bad_id' };
  }

  const patch: Record<string, unknown> = {};
  if (input.programName != null) {
    patch.program_name = String(input.programName).trim() || 'Ana program';
  }
  if (input.data !== undefined) {
    if (!input.data || typeof input.data !== 'object') {
      return { ok: false, error: 'Güncellenecek veri geçersiz.', code: 'empty_data' };
    }
    patch.data = input.data as unknown as Record<string, unknown>;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Güncellenecek alan yok.', code: 'no_fields' };
  }

  try {
    const { data, error } = await supabase
      .from(SCHEDULE_PROGRAMS_TABLE)
      .update(patch)
      .eq('id', rid)
      .select('id, user_id, program_name, data, created_at, updated_at')
      .single();

    if (error) {
      return { ok: false, error: mapSupabaseError(error, 'Supabase: güncelleme başarısız.'), code: error.code };
    }
    if (!data) {
      return { ok: false, error: 'Kayıt bulunamadı veya yetkiniz yok.', code: 'not_found' };
    }

    const payload = ensurePayload(data.data);
    if (!payload) {
      return { ok: false, error: 'Sunucudaki veri biçimi geçersiz.', code: 'invalid_payload' };
    }

    return {
      ok: true,
      data: {
        id: String(data.id),
        user_id: data.user_id != null ? String(data.user_id) : null,
        program_name: String(data.program_name ?? ''),
        data: payload,
        created_at: String(data.created_at ?? ''),
        updated_at: String(data.updated_at ?? ''),
      },
    };
  } catch (e) {
    return { ok: false, error: mapSupabaseError(e, 'Beklenmeyen hata: güncelleme başarısız.') };
  }
}

/**
 * Program satırını siler.
 */
export async function deleteSchedule(id: string): Promise<ScheduleServiceResult<{ id: string }>> {
  const rid = String(id ?? '').trim();
  if (!rid) {
    return { ok: false, error: 'Geçersiz program kimliği.', code: 'bad_id' };
  }

  try {
    const { error } = await supabase.from(SCHEDULE_PROGRAMS_TABLE).delete().eq('id', rid);

    if (error) {
      return { ok: false, error: mapSupabaseError(error, 'Supabase: silme başarısız.'), code: error.code };
    }
    return { ok: true, data: { id: rid } };
  } catch (e) {
    return { ok: false, error: mapSupabaseError(e, 'Beklenmeyen hata: silme başarısız.') };
  }
}
