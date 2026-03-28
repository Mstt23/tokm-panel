/**
 * Ders programı localStorage dışa/iça aktarma ve doğrulama.
 * Anahtarlar ScheduleTable ile aynı olmalıdır.
 */

import kurumData from "../data/kurum.json";

export const STORAGE_KEYS = {
  assignmentsByDay: "weeklyScheduleAssignmentsByDay",
  visibleGroups: "scheduleVisibleGroups",
  teacherViewEntries: "scheduleTeacherViewEntries",
};

export const EXPORT_FORMAT_VERSION = 1;
export const EXPORT_APP_ID = "tokm-ders-programi-storage";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/** getCellKey(group,slot) = `${group}-${slot}` — slot eşleşmesi uzun adlardan başlar (ör. "10" ile "1" karışmasın). */
const SLOT_IDS_DESC = Object.keys(kurumData.ders_saatleri ?? {}).sort(
  (a, b) => String(b).length - String(a).length
);

export function parseCellKeyToGroupSlot(cellKey, slotIdsSortedDesc = SLOT_IDS_DESC) {
  const key = String(cellKey ?? "");
  for (const slot of slotIdsSortedDesc) {
    const s = String(slot);
    const suf = `-${s}`;
    if (key.endsWith(suf)) {
      return { group: key.slice(0, -suf.length), slot: s };
    }
  }
  return null;
}

function safeJsonParse(str) {
  try {
    return { ok: true, value: JSON.parse(str) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function isPlainObject(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

/** Gün anahtarlı atama haritası doğrulama + günleri tamamla */
function normalizeAssignmentsByDay(raw, errors) {
  if (raw == null) {
    return DAYS.reduce((acc, d) => {
      acc[d] = {};
      return acc;
    }, {});
  }
  if (!isPlainObject(raw)) {
    errors.push("weeklyScheduleAssignmentsByDay bir nesne olmalıdır.");
    return null;
  }
  const out = {};
  for (const day of DAYS) {
    const block = raw[day];
    if (block == null) {
      out[day] = {};
      continue;
    }
    if (!isPlainObject(block)) {
      errors.push(`"${day}" günü için veri nesne olmalıdır.`);
      return null;
    }
    out[day] = {};
    for (const [cellKey, cell] of Object.entries(block)) {
      if (typeof cellKey !== "string" || !cellKey.trim()) continue;
      if (!isPlainObject(cell)) {
        errors.push(`Geçersiz hücre değeri: ${day} / ${cellKey}`);
        return null;
      }
      let group = cell.group != null ? String(cell.group).trim() : "";
      let slot = cell.slot != null ? String(cell.slot).trim() : "";
      if (!group || !slot) {
        const parsed = parseCellKeyToGroupSlot(cellKey, SLOT_IDS_DESC);
        if (parsed) {
          if (!group) group = parsed.group;
          if (!slot) slot = parsed.slot;
        }
      }
      const lesson = cell.lesson != null ? String(cell.lesson) : "";
      const teacher = cell.teacher != null ? String(cell.teacher) : "";
      const classroom = cell.classroom != null ? String(cell.classroom) : "";
      out[day][cellKey] = { group, slot, lesson, teacher, classroom };
    }
  }
  return out;
}

function normalizeVisibleGroups(raw, validGroupNames, errors) {
  if (raw == null) return [...validGroupNames];
  if (!Array.isArray(raw)) {
    errors.push("scheduleVisibleGroups bir dizi olmalıdır.");
    return null;
  }
  const validSet = new Set(validGroupNames);
  const filtered = raw.filter((g) => typeof g === "string" && validSet.has(g));
  if (filtered.length === 0 && raw.length > 0) {
    errors.push("Görünür gruplar listesinde geçerli grup adı yok (kurum.json ile uyuşmuyor olabilir).");
    return null;
  }
  if (filtered.length === 0) return [];
  return filtered;
}

function normalizeTeacherViewEntries(raw, errors) {
  if (raw == null) return {};
  if (!isPlainObject(raw)) {
    errors.push("scheduleTeacherViewEntries bir nesne olmalıdır.");
    return null;
  }
  const out = {};
  for (const [teacher, byDay] of Object.entries(raw)) {
    if (typeof teacher !== "string" || !teacher.trim()) continue;
    if (!isPlainObject(byDay)) {
      errors.push(`Öğretmen "${teacher}" altında geçersiz yapı.`);
      return null;
    }
    out[teacher] = {};
    for (const [day, bySlot] of Object.entries(byDay)) {
      if (!DAYS.includes(day)) continue;
      if (!isPlainObject(bySlot)) {
        errors.push(`Öğretmen "${teacher}" / ${day}: geçersiz slot haritası.`);
        return null;
      }
      out[teacher][day] = {};
      for (const [slot, cell] of Object.entries(bySlot)) {
        if (typeof slot !== "string") continue;
        if (!isPlainObject(cell)) continue;
        out[teacher][day][slot] = {
          label: cell.label != null ? String(cell.label) : "",
          classroom: cell.classroom != null ? String(cell.classroom) : "",
          lesson: cell.lesson != null ? String(cell.lesson) : "",
        };
      }
    }
  }
  return out;
}

/**
 * v1: { formatVersion, exportedAt?, app?, keys: { ... } }
 * Eski: doğrudan keys veya yalnızca gün haritası (atamalar)
 */
export function validateAndMigrateImport(raw, validGroupNames) {
  const errors = [];

  if (raw == null || typeof raw !== "object") {
    return { ok: false, errors: ["Dosya kökü bir nesne olmalıdır."] };
  }

  let keysBlock = null;

  if (raw.formatVersion === EXPORT_FORMAT_VERSION && isPlainObject(raw.keys)) {
    keysBlock = raw.keys;
  } else if (
    isPlainObject(raw[STORAGE_KEYS.assignmentsByDay]) ||
    raw.weeklyScheduleAssignmentsByDay != null
  ) {
    keysBlock = raw;
  } else {
    const dayKeys = Object.keys(raw).filter((k) => DAYS.includes(k));
    if (dayKeys.length > 0 && dayKeys.every((k) => isPlainObject(raw[k]))) {
      keysBlock = { [STORAGE_KEYS.assignmentsByDay]: raw };
    } else {
      return {
        ok: false,
        errors: [
          "Tanınmayan dosya biçimi. Beklenen: formatVersion 1 ve \"keys\" nesnesi veya bilinen storage anahtarları.",
        ],
      };
    }
  }

  const assignRaw =
    keysBlock[STORAGE_KEYS.assignmentsByDay] ??
    keysBlock.weeklyScheduleAssignmentsByDay ??
    null;
  const hasVisibleInBundle =
    Object.prototype.hasOwnProperty.call(keysBlock, STORAGE_KEYS.visibleGroups) ||
    Object.prototype.hasOwnProperty.call(keysBlock, "scheduleVisibleGroups");
  const visRaw = hasVisibleInBundle
    ? keysBlock[STORAGE_KEYS.visibleGroups] ?? keysBlock.scheduleVisibleGroups ?? null
    : undefined;
  const teachRaw =
    keysBlock[STORAGE_KEYS.teacherViewEntries] ?? keysBlock.scheduleTeacherViewEntries ?? null;

  const assignmentsByDay = normalizeAssignmentsByDay(assignRaw, errors);
  if (!assignmentsByDay) return { ok: false, errors };

  const visibleGroupsArr = normalizeVisibleGroups(visRaw, validGroupNames, errors);
  if (visibleGroupsArr === null) return { ok: false, errors };

  const teacherViewEntries = normalizeTeacherViewEntries(teachRaw, errors);
  if (teacherViewEntries === null) return { ok: false, errors };

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    assignmentsByDay,
    visibleGroups: visibleGroupsArr,
    teacherViewEntries,
  };
}

/**
 * Supabase `data` sütunu için düz nesne (formatVersion dışı).
 */
export function buildScheduleProgramPayloadFromState(assignmentsByDay, visibleGroups, teacherViewEntries) {
  const visArr =
    visibleGroups instanceof Set
      ? [...visibleGroups]
      : Array.isArray(visibleGroups)
        ? [...visibleGroups]
        : [];
  return {
    assignmentsByDay: assignmentsByDay && typeof assignmentsByDay === "object" ? assignmentsByDay : {},
    visibleGroups: visArr.filter((g) => typeof g === "string"),
    teacherViewEntries: teacherViewEntries && typeof teacherViewEntries === "object" ? teacherViewEntries : {},
  };
}

/**
 * Eski localStorage kayıtlarını tek seferlik taşıma için okur.
 */
export function readLegacyScheduleLocalStorageForMigration(validGroupNames) {
  let assignmentsParsed = null;
  let visibleParsed = null;
  let teacherParsed = null;
  let hadVisibleKey = false;

  try {
    const a = window.localStorage.getItem(STORAGE_KEYS.assignmentsByDay);
    if (a) {
      const p = safeJsonParse(a);
      if (p.ok) assignmentsParsed = p.value;
    }
    const v = window.localStorage.getItem(STORAGE_KEYS.visibleGroups);
    if (v !== null) {
      hadVisibleKey = true;
      const p = safeJsonParse(v);
      if (p.ok) visibleParsed = p.value;
    }
    const t = window.localStorage.getItem(STORAGE_KEYS.teacherViewEntries);
    if (t) {
      const p = safeJsonParse(t);
      if (p.ok) teacherParsed = p.value;
    }
  } catch {
    return { ok: false, errors: ["localStorage okunamadı."] };
  }

  if (!assignmentsParsed && !teacherParsed && !hadVisibleKey) {
    return { ok: false, errors: [], empty: true };
  }

  const keys = {
    [STORAGE_KEYS.assignmentsByDay]: assignmentsParsed ?? {},
    [STORAGE_KEYS.teacherViewEntries]: teacherParsed ?? {},
  };
  if (hadVisibleKey) {
    keys[STORAGE_KEYS.visibleGroups] = Array.isArray(visibleParsed) ? visibleParsed : [];
  }

  return validateAndMigrateImport(
    { formatVersion: EXPORT_FORMAT_VERSION, keys },
    validGroupNames
  );
}

export function clearLegacyScheduleLocalStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.assignmentsByDay);
    window.localStorage.removeItem(STORAGE_KEYS.visibleGroups);
    window.localStorage.removeItem(STORAGE_KEYS.teacherViewEntries);
  } catch {
    // no-op
  }
}

/** Tabloda veya öğretmen görünümünde anlamlı içerik var mı */
export function hasMeaningfulProgramData(assignmentsByDay, teacherViewEntries) {
  if (teacherViewEntries && typeof teacherViewEntries === "object" && Object.keys(teacherViewEntries).length > 0) {
    return true;
  }
  if (!assignmentsByDay || typeof assignmentsByDay !== "object") return false;
  return DAYS.some((day) => {
    const block = assignmentsByDay[day];
    return block && isPlainObject(block) && Object.keys(block).length > 0;
  });
}

/** Yalnızca eski localStorage’da anlamlı program var mı (migrate kontrolü) */
export function hasMeaningfulLegacyLocalStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.assignmentsByDay);
    if (!raw) return false;
    const p = safeJsonParse(raw);
    if (!p.ok || !isPlainObject(p.value)) return false;
    return DAYS.some((day) => {
      const block = p.value[day];
      return block && isPlainObject(block) && Object.keys(block).length > 0;
    });
  } catch {
    return false;
  }
}

