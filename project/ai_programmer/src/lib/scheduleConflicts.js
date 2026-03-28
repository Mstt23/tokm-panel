// Centralized conflict rules for teacher/classroom assignments.

import { getGroupLevel } from "./groupLevel.js";

/** Bu dersler çakışma kontrolüne (öğretmen/derslik) tabi tutulmaz. */
export const CONFLICT_EXEMPT_LESSONS = new Set([
  "Bireysel Soru Çözümü",
  "Bireysel Ödev Çözümü",
  "Deneme Sınavı"
]);

export function isLessonConflictExempt(lesson) {
  return Boolean(lesson && CONFLICT_EXEMPT_LESSONS.has(lesson));
}

export function hasClassroomConflict({
  assignmentsByCell,
  currentCellKey,
  classroom,
  slot,
  newLesson
}) {
  if (!classroom) return false;
  if (isLessonConflictExempt(newLesson)) return false;

  return Object.entries(assignmentsByCell ?? {}).some(([cellKey, assignment]) => {
    if (!assignment || cellKey === currentCellKey) return false;
    if (isLessonConflictExempt(assignment.lesson)) return false;
    return assignment.classroom === classroom && assignment.slot === slot;
  });
}

export function getTeacherConflictMode({
  assignmentsByCell,
  currentCellKey,
  teacherName,
  selectedGroup,
  selectedSlot,
  lesson
}) {
  if (!teacherName || !selectedGroup || !selectedSlot) {
    return { mode: "none", conflictingGroups: [] };
  }
  if (isLessonConflictExempt(lesson)) {
    return { mode: "none", conflictingGroups: [] };
  }

  const selectedLevel = getGroupLevel(selectedGroup);
  const conflicts = Object.entries(assignmentsByCell ?? {}).filter(
    ([cellKey, assignment]) =>
      assignment &&
      cellKey !== currentCellKey &&
      !isLessonConflictExempt(assignment.lesson) &&
      assignment.teacher === teacherName &&
      assignment.slot === selectedSlot
  );

  if (conflicts.length === 0) {
    return { mode: "none", conflictingGroups: [] };
  }

  const conflictingGroups = conflicts
    .map(([, a]) => a.group)
    .filter(Boolean);

  // Seviye parse edilemezse bloklamak yerine uyarı modu (aksi halde tüm öğretmenler "uygun değil" kalıyordu).
  if (selectedLevel === null) {
    return { mode: "warning_same_level", conflictingGroups };
  }

  const hasDifferentLevelConflict = conflicts.some(([, a]) => {
    const otherLevel = getGroupLevel(a.group);
    return otherLevel === null || otherLevel !== selectedLevel;
  });

  if (hasDifferentLevelConflict) {
    return { mode: "blocked", conflictingGroups };
  }

  return { mode: "warning_same_level", conflictingGroups };
}

/**
 * Günün atamaları için her hücre anahtarına çakışma açıklamaları (tooltip için).
 * @returns {Record<string, string[]>}
 */
export function buildCellConflictReasons(assignmentsByCell) {
  /** @type {Record<string, string[]>} */
  const reasons = {};
  const push = (cellKey, msg) => {
    if (!reasons[cellKey]) reasons[cellKey] = [];
    if (!reasons[cellKey].includes(msg)) reasons[cellKey].push(msg);
  };

  const entries = Object.entries(assignmentsByCell ?? {}).filter(([, a]) => a?.lesson);

  const byTeacherSlot = new Map();
  for (const [cellKey, a] of entries) {
    if (isLessonConflictExempt(a.lesson)) continue;
    const k = `${a.teacher}\u0000${a.slot}`;
    if (!byTeacherSlot.has(k)) byTeacherSlot.set(k, []);
    byTeacherSlot.get(k).push({ cellKey, group: a.group });
  }
  for (const [, arr] of byTeacherSlot) {
    const groups = new Set(arr.map((x) => x.group));
    if (groups.size < 2) continue;
    const levels = [...groups].map(getGroupLevel);
    const distinctLevels = new Set(levels.filter((l) => l !== null));
    const hasNull = levels.some((l) => l === null);
    const blocked = hasNull || distinctLevels.size > 1;
    const msg = blocked
      ? "Öğretmen bu saatte başka grupta (bloklayıcı çakışma)"
      : "Öğretmen bu saatte başka grupta (aynı seviye uyarısı)";
    for (const { cellKey } of arr) push(cellKey, msg);
  }

  const byRoomSlot = new Map();
  for (const [cellKey, a] of entries) {
    if (!a.classroom || isLessonConflictExempt(a.lesson)) continue;
    const k = `${a.classroom}\u0000${a.slot}`;
    if (!byRoomSlot.has(k)) byRoomSlot.set(k, []);
    byRoomSlot.get(k).push({ cellKey, group: a.group });
  }
  for (const [, arr] of byRoomSlot) {
    const groups = new Set(arr.map((x) => x.group));
    if (groups.size < 2) continue;
    const msg = "Derslik bu saatte birden fazla grupta kullanılıyor";
    for (const { cellKey } of arr) push(cellKey, msg);
  }

  return reasons;
}
