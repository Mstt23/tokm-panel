/**
 * Ders programı localStorage dışa/iça aktarma ve doğrulama.
 * Anahtarlar ScheduleTable ile aynı olmalıdır.
 */

export const STORAGE_KEYS = {
  assignmentsByDay: "weeklyScheduleAssignmentsByDay",
  visibleGroups: "scheduleVisibleGroups",
  teacherViewEntries: "scheduleTeacherViewEntries",
};

export const EXPORT_FORMAT_VERSION = 1;
export const EXPORT_APP_ID = "tokm-ders-programi-storage";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

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
      const lesson = cell.lesson != null ? String(cell.lesson) : "";
      const teacher = cell.teacher != null ? String(cell.teacher) : "";
      const classroom = cell.classroom != null ? String(cell.classroom) : "";
      out[day][cellKey] = { lesson, teacher, classroom };
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

export function parseImportJsonText(text, validGroupNames) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    return { ok: false, errors: ["Dosya boş."] };
  }
  const parsed = safeJsonParse(trimmed);
  if (!parsed.ok) {
    return { ok: false, errors: [`JSON ayrıştırma hatası: ${parsed.error}`] };
  }
  return validateAndMigrateImport(parsed.value, validGroupNames);
}

export function buildExportBundle() {
  const read = (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  };

  let assignmentsParsed = null;
  let visibleParsed = null;
  let teacherParsed = null;
  let hadVisibleKey = false;

  const a = read(STORAGE_KEYS.assignmentsByDay);
  if (a) {
    const p = safeJsonParse(a);
    if (p.ok) assignmentsParsed = p.value;
  }
  const v = read(STORAGE_KEYS.visibleGroups);
  if (v !== null) {
    hadVisibleKey = true;
    const p = safeJsonParse(v);
    if (p.ok) visibleParsed = p.value;
  }
  const t = read(STORAGE_KEYS.teacherViewEntries);
  if (t) {
    const p = safeJsonParse(t);
    if (p.ok) teacherParsed = p.value;
  }

  const keys = {
    [STORAGE_KEYS.assignmentsByDay]: assignmentsParsed ?? {},
    [STORAGE_KEYS.teacherViewEntries]: teacherParsed ?? {},
  };
  if (hadVisibleKey) {
    keys[STORAGE_KEYS.visibleGroups] = Array.isArray(visibleParsed) ? visibleParsed : [];
  }

  return {
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    app: EXPORT_APP_ID,
    keys,
  };
}

export function downloadScheduleExportJson() {
  const bundle = buildExportBundle();
  const text = JSON.stringify(bundle, null, 2);
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ders-programi-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Anlamlı kayıt var mı (boş program değil) */
export function hasMeaningfulSavedProgram() {
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

export function countAssignmentCells(assignmentsByDayObj) {
  if (!isPlainObject(assignmentsByDayObj)) return 0;
  let n = 0;
  for (const day of DAYS) {
    const block = assignmentsByDayObj[day];
    if (block && isPlainObject(block)) n += Object.keys(block).length;
  }
  return n;
}

export function getStorageDebugSnapshot() {
  const out = {
    keys: { ...STORAGE_KEYS },
    assignmentsKey: STORAGE_KEYS.assignmentsByDay,
    readOk: { assignments: false, visibleGroups: false, teacherView: false },
    errors: [],
    assignmentCellCount: 0,
    visibleGroupCount: 0,
    teacherViewTeacherCount: 0,
  };

  try {
    const ar = window.localStorage.getItem(STORAGE_KEYS.assignmentsByDay);
    if (ar != null) {
      const p = safeJsonParse(ar);
      if (p.ok && isPlainObject(p.value)) {
        out.readOk.assignments = true;
        out.assignmentCellCount = countAssignmentCells(p.value);
      } else out.errors.push("assignments: JSON geçersiz");
    }
  } catch (e) {
    out.errors.push(`assignments: ${e}`);
  }

  try {
    const vr = window.localStorage.getItem(STORAGE_KEYS.visibleGroups);
    if (vr != null) {
      const p = safeJsonParse(vr);
      if (p.ok && Array.isArray(p.value)) {
        out.readOk.visibleGroups = true;
        out.visibleGroupCount = p.value.length;
      } else out.errors.push("visibleGroups: JSON geçersiz");
    }
  } catch (e) {
    out.errors.push(`visibleGroups: ${e}`);
  }

  try {
    const tr = window.localStorage.getItem(STORAGE_KEYS.teacherViewEntries);
    if (tr != null) {
      const p = safeJsonParse(tr);
      if (p.ok && isPlainObject(p.value)) {
        out.readOk.teacherView = true;
        out.teacherViewTeacherCount = Object.keys(p.value).length;
      } else out.errors.push("teacherViewEntries: JSON geçersiz");
    }
  } catch (e) {
    out.errors.push(`teacherView: ${e}`);
  }

  return out;
}
