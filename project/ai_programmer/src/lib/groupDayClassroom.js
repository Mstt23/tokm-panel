/**
 * Aynı gün içinde grupta zaman sırasına göre ilk atanmış dersliği döndürür
 * (öğlen arası vb. ders olmayan slotlar atlanır).
 */
export function getPreferredClassroomFromFirstLessonOfDay(
  assignmentsByCell,
  group,
  timeSlots,
  isBreakSlot
) {
  if (!assignmentsByCell || !group || !timeSlots?.length) {
    return null;
  }

  for (const { slot } of timeSlots) {
    if (isBreakSlot(slot)) continue;
    const cellKey = `${group}-${slot}`;
    const classroom = assignmentsByCell[cellKey]?.classroom;
    if (classroom) {
      return classroom;
    }
  }

  return null;
}
