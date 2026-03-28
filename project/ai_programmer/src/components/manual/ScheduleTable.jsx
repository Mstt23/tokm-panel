import React from "react";
import kurumData from "../../data/kurum.json";
import teachersData from "../../data/teachers.json";
import studentsData from "../../data/students.json";
import {
  hasClassroomConflict,
  getTeacherConflictMode,
  isLessonConflictExempt,
  buildCellConflictReasons
} from "../../lib/scheduleConflicts.js";
import {
  exportFullWeeklySchedulePdfAsZip,
  exportScheduleAsCsv,
  exportWeeklyGroupMatrixHtml,
  exportWeeklyTeacherMatrixHtml,
  exportWeeklyStudentMatrixHtml
} from "../../lib/exportSchedule.js";
import { buildClassroomsByGroupMap, getAllCampusClassroomNames } from "../../lib/campusClassrooms.js";
import {
  parseCellKeyToGroupSlot,
  buildScheduleProgramPayloadFromState,
  readLegacyScheduleLocalStorageForMigration,
  clearLegacyScheduleLocalStorage,
  hasMeaningfulProgramData,
} from "../../lib/scheduleStorageTransfer.js";
import {
  getSchedules,
  saveSchedule,
  updateSchedule,
} from "../../../../src/lib/scheduleProgramsService.ts";

const groupNames = kurumData.gruplar ?? [];
const toMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const timeSlots = Object.entries(kurumData.ders_saatleri ?? {})
  .map(([slot, range]) => ({
    slot,
    range
  }))
  .sort((a, b) => {
    const [aStart] = a.range.split("-");
    const [bStart] = b.range.split("-");
    return toMinutes(aStart) - toMinutes(bStart);
  });

const isBreakSlot = (slotName) => slotName.toLowerCase().includes("arası");
const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DEFAULT_PROGRAM_NAME = "Ana program";
const AUTO_SAVE_DEBOUNCE_MS = 1200;

const SLOT_IDS_DESC_FOR_CELLKEY = [...timeSlots].map((t) => String(t.slot)).sort((a, b) => b.length - a.length);

function enrichDayAssignmentsFromCellKeys(dayBlock) {
  if (!dayBlock || typeof dayBlock !== "object") return {};
  const next = { ...dayBlock };
  for (const [cellKey, cell] of Object.entries(next)) {
    if (!cell || typeof cell !== "object") continue;
    const g = cell.group != null ? String(cell.group).trim() : "";
    const s = cell.slot != null ? String(cell.slot).trim() : "";
    if (g && s) continue;
    const parsed = parseCellKeyToGroupSlot(cellKey, SLOT_IDS_DESC_FOR_CELLKEY);
    if (!parsed) continue;
    next[cellKey] = {
      ...cell,
      group: g || parsed.group,
      slot: s || parsed.slot
    };
  }
  return next;
}

const parseTimeToMinutes = (timeText) => {
  const [hourText, minuteText] = String(timeText).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return hour * 60 + minute;
};

const parseRange = (rangeText) => {
  if (!rangeText) {
    return null;
  }

  const [startText, endText] = String(rangeText).split("-").map((value) => value.trim());
  if (!startText || !endText) {
    return null;
  }

  const start = parseTimeToMinutes(startText);
  const end = parseTimeToMinutes(endText);
  if (start === null || end === null || end <= start) {
    return null;
  }

  return { start, end };
};

const isTeacherAvailableForSlot = (teacher, slotRange, day) => {
  const teacherWorkingRange = parseRange(teacher?.çalışma_günleri?.[day]);
  const lessonRange = parseRange(slotRange);

  if (!teacherWorkingRange || !lessonRange) {
    return false;
  }

  return (
    lessonRange.start >= teacherWorkingRange.start &&
    lessonRange.end <= teacherWorkingRange.end
  );
};

const getCellKey = (group, slot) => `${group}-${slot}`;

function findAssignmentForTeacher(assignmentsByDay, day, teacherName, slot) {
  const all = findAssignmentsForTeacher(assignmentsByDay, day, teacherName, slot);
  return all.length > 0 ? all[0] : null;
}

/** Aynı öğretmenin aynı saatte farklı gruplarla yaptığı dersleri toplar (soru çözümü vb.) */
function findAssignmentsForTeacher(assignmentsByDay, day, teacherName, slot) {
  const dayMap = assignmentsByDay?.[day] ?? {};
  const list = [];
  for (const a of Object.values(dayMap)) {
    if (!a?.teacher) continue;
    if (a.teacher === teacherName && String(a.slot) === String(slot)) {
      list.push(a);
    }
  }
  return list;
}
const createEmptyAssignmentsByDay = () =>
  DAYS.reduce((acc, day) => {
    acc[day] = {};
    return acc;
  }, {});

function cellsEqual(a, b) {
  return a.group === b.group && a.slot === b.slot;
}

function sortCellsForKey(cells) {
  return [...cells].sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group, "tr");
    const ia = timeSlots.findIndex((s) => s.slot === a.slot);
    const ib = timeSlots.findIndex((s) => s.slot === b.slot);
    return ia - ib;
  });
}

function selectionKey(cells) {
  if (!cells?.length) return "";
  return JSON.stringify(sortCellsForKey(cells).map((c) => ({ g: c.group, s: c.slot })));
}

/** Fare ile sürüklenen dikdörtgen alandaki ders hücreleri (ara dersleri atlar) */
function buildRectangleCells(groupsForTable, timeSlots, startGroup, startSlot, endGroup, endSlot) {
  const r0 = groupsForTable.indexOf(startGroup);
  const r1 = groupsForTable.indexOf(endGroup);
  const c0 = timeSlots.findIndex((s) => s.slot === startSlot);
  const c1 = timeSlots.findIndex((s) => s.slot === endSlot);
  if (r0 < 0 || r1 < 0 || c0 < 0 || c1 < 0) return [];
  const rMin = Math.min(r0, r1);
  const rMax = Math.max(r0, r1);
  const cMin = Math.min(c0, c1);
  const cMax = Math.max(c0, c1);
  const cells = [];
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      const slot = timeSlots[c]?.slot;
      if (!slot || isBreakSlot(slot)) continue;
      const g = groupsForTable[r];
      if (!g) continue;
      cells.push({ group: g, slot });
    }
  }
  return sortCellsForKey(cells);
}

function mergeAssignmentsFromRemotePayload(raw) {
  const empty = createEmptyAssignmentsByDay();
  if (!raw || typeof raw !== "object") return empty;
  for (const day of DAYS) {
    const block = raw[day];
    empty[day] = enrichDayAssignmentsFromCellKeys(block && typeof block === "object" ? block : {});
  }
  return empty;
}

export default function ScheduleTable({
  canEdit = true,
  allowScheduleEdit = true,
  scheduleEditModeActive = false,
  onToggleScheduleEditMode,
  supabaseUserId = null,
}) {
  const [currentDay, setCurrentDay] = React.useState("Pazartesi");
  const [selectedCells, setSelectedCells] = React.useState([]);
  const [pendingLesson, setPendingLesson] = React.useState("");
  const [pendingClassroom, setPendingClassroom] = React.useState("");
  const [freeTeacherName, setFreeTeacherName] = React.useState("");
  const [freeTeacherPickerOpen, setFreeTeacherPickerOpen] = React.useState(false);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const [visibleGroups, setVisibleGroups] = React.useState(() => new Set(groupNames));
  const [groupFilterOpen, setGroupFilterOpen] = React.useState(false);
  const [tableViewMode, setTableViewMode] = React.useState("gün");
  const [tableViewMenuOpen, setTableViewMenuOpen] = React.useState(false);
  const [tableViewTeacher, setTableViewTeacher] = React.useState("");
  const [tableViewGroup, setTableViewGroup] = React.useState("");
  const [selectedTeacherCell, setSelectedTeacherCell] = React.useState(null);
  const [pendingTeacherCellLabel, setPendingTeacherCellLabel] = React.useState("");
  const [pendingTeacherCellClassroom, setPendingTeacherCellClassroom] = React.useState("");
  const [pendingTeacherCellLesson, setPendingTeacherCellLesson] = React.useState("");

  const [exportPdfZipLoading, setExportPdfZipLoading] = React.useState(false);
  const [exportSelectedDays, setExportSelectedDays] = React.useState(() => new Set(DAYS));
  const [exportSelectedGroups, setExportSelectedGroups] = React.useState(() => new Set(groupNames));
  const [exportSelectedTeachers, setExportSelectedTeachers] = React.useState(() => new Set());
  const [studentPickerOpen, setStudentPickerOpen] = React.useState(false);
  const [studentPickerQuery, setStudentPickerQuery] = React.useState("");
  const [exportSelectedStudentClasses, setExportSelectedStudentClasses] = React.useState(() => new Set());
  const [exportStudentOnlyInProgram, setExportStudentOnlyInProgram] = React.useState(false);

  const [teacherViewEntries, setTeacherViewEntries] = React.useState(() => ({}));

  const [scheduleLoadStatus, setScheduleLoadStatus] = React.useState(() => (supabaseUserId ? "loading" : "ready"));
  const [scheduleLoadError, setScheduleLoadError] = React.useState(null);
  const [activeProgramId, setActiveProgramId] = React.useState(null);
  const [saveStatus, setSaveStatus] = React.useState("idle");
  const [saveError, setSaveError] = React.useState(null);

  const scheduleTableRef = React.useRef(null);
  const exportWrapperRef = React.useRef(null);
  const groupFilterRef = React.useRef(null);
  const studentPickerRef = React.useRef(null);
  const tableViewMenuRef = React.useRef(null);
  const freeTeacherPickerWrapRef = React.useRef(null);
  const suppressCellClickRef = React.useRef(false);
  const dragSelectRef = React.useRef(null);
  /** Yalnızca chip ile ders seçildiğinde tek öğretmen otomatik atansın (hücre tıklanınca tetiklenmesin) */
  const shouldAutoApplyAfterLessonPickRef = React.useRef(false);

  const [assignmentsByDay, setAssignmentsByDay] = React.useState(() => createEmptyAssignmentsByDay());

  const persistSnapshotRef = React.useRef({ assignmentsByDay, visibleGroups, teacherViewEntries });
  const activeProgramIdRef = React.useRef(activeProgramId);
  const supabaseUserIdRef = React.useRef(supabaseUserId);
  const skipAutoSaveRef = React.useRef(0);
  const persistGenRef = React.useRef(0);

  React.useLayoutEffect(() => {
    persistSnapshotRef.current = { assignmentsByDay, visibleGroups, teacherViewEntries };
    activeProgramIdRef.current = activeProgramId;
    supabaseUserIdRef.current = supabaseUserId;
  });

  const lessonLoadByGroup = kurumData.ders_yükü ?? {};
  const optionalLessonsByGroup = kurumData.opsiyonel_dersler ?? {};
  const teachers = teachersData.öğretmenler ?? [];
  const studentsList = React.useMemo(
    () =>
      (studentsData?.öğrenciler ?? []).map((s) => ({
        adSoyad: String(s["ad soyad"] ?? "").trim(),
        sınıf: String(s.sınıfı ?? "").trim()
      })),
    []
  );
  const studentNamesSet = React.useMemo(
    () => new Set(studentsList.map((s) => s.adSoyad).filter(Boolean)),
    [studentsList]
  );
  const normalizeLabelToStudent = React.useCallback(
    (label) => {
      const t = String(label ?? "").trim();
      if (!t) return t;
      const upper = (s) => String(s).toLocaleUpperCase("tr-TR");
      for (const name of studentNamesSet) {
        if (upper(name) === upper(t)) return name;
      }
      const norm = t.replace(/\s+/g, " ").trim();
      for (const name of studentNamesSet) {
        if (upper(name).replace(/\s+/g, " ") === upper(norm)) return name;
      }
      return t;
    },
    [studentNamesSet]
  );
  const allTeacherNamesSorted = React.useMemo(
    () =>
      teachers
        .map((t) => t.ad)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "tr")),
    [teachers]
  );
  const derslikCount = kurumData.derslik_sayisi ?? 0;
  const classroomsByGroup = React.useMemo(
    () => buildClassroomsByGroupMap(kurumData),
    [kurumData]
  );

  const classrooms = React.useMemo(() => {
    const fromCampus = getAllCampusClassroomNames(kurumData);
    if (fromCampus.length > 0) return fromCampus;
    return Array.from({ length: Number(derslikCount) || 0 }, (_, i) => `Derslik ${i + 1}`);
  }, [derslikCount, kurumData]);

  const getClassroomsForGroup = React.useCallback(
    (group) => {
      const rooms = classroomsByGroup[group];
      return rooms?.length ? rooms : classrooms;
    },
    [classrooms, classroomsByGroup]
  );

  const assignments = assignmentsByDay[currentDay] ?? {};

  const teachersWithAssignments = React.useMemo(() => {
    const set = new Set();
    for (const day of DAYS) {
      const dayMap = assignmentsByDay?.[day] ?? {};
      for (const a of Object.values(dayMap)) {
        if (a?.teacher) set.add(a.teacher);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [assignmentsByDay]);

  const allExportTeachers = React.useMemo(() => {
    const set = new Set(teachersWithAssignments);
    for (const t of Object.keys(teacherViewEntries ?? {})) {
      if (t) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [teachersWithAssignments, teacherViewEntries]);

  const studentsInProgram = React.useMemo(() => {
    const set = new Set();
    for (const teacher of Object.keys(teacherViewEntries ?? {})) {
      for (const day of Object.keys(teacherViewEntries[teacher] ?? {})) {
        for (const slot of Object.keys(teacherViewEntries[teacher][day] ?? {})) {
          const label = teacherViewEntries[teacher][day][slot]?.label ?? "";
          const normalized = normalizeLabelToStudent(label);
          if (normalized && studentNamesSet.has(normalized)) set.add(normalized);
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "tr"));
  }, [teacherViewEntries, normalizeLabelToStudent, studentNamesSet]);

  const studentPickerFiltered = React.useMemo(() => {
    const q = String(studentPickerQuery ?? "").trim().toLocaleUpperCase("tr-TR");
    if (!q) return studentsList;
    return studentsList.filter((s) =>
      s.adSoyad.toLocaleUpperCase("tr-TR").includes(q)
    );
  }, [studentsList, studentPickerQuery]);

  const studentClassOptions = React.useMemo(() => {
    const set = new Set(studentsList.map((s) => s.sınıf).filter(Boolean));
    return [...set].sort((a, b) => {
      const na = parseInt(a, 10) || 0;
      const nb = parseInt(b, 10) || 0;
      return na - nb || String(a).localeCompare(b, "tr");
    });
  }, [studentsList]);

  const cellConflictReasons = React.useMemo(() => buildCellConflictReasons(assignments), [assignments]);

  const requiredLessonLoadByGroup = React.useMemo(() => {
    return Object.keys(lessonLoadByGroup).reduce((acc, group) => {
      const optionalSet = new Set(optionalLessonsByGroup[group] ?? []);
      const requiredLoads = Object.entries(lessonLoadByGroup[group] ?? {}).reduce(
        (lessonAcc, [lesson, load]) => {
          if (!optionalSet.has(lesson)) {
            lessonAcc[lesson] = load;
          }
          return lessonAcc;
        },
        {}
      );
      acc[group] = requiredLoads;
      return acc;
    }, {});
  }, [lessonLoadByGroup, optionalLessonsByGroup]);

  React.useEffect(() => {
    if (allExportTeachers.length > 0 && exportSelectedTeachers.size === 0) {
      setExportSelectedTeachers(new Set(allExportTeachers));
    }
  }, [allExportTeachers]);

  React.useEffect(() => {
    if (!selectedTeacherCell) {
      setPendingTeacherCellLabel("");
      setPendingTeacherCellClassroom("");
      setPendingTeacherCellLesson("");
      return;
    }
    const { teacher, day, slot } = selectedTeacherCell;
    const custom = teacherViewEntries?.[teacher]?.[day]?.[slot];
    if (custom) {
      const raw = custom.label ?? "";
      setPendingTeacherCellLabel(normalizeLabelToStudent(raw) || raw);
      setPendingTeacherCellClassroom(custom.classroom ?? "");
      setPendingTeacherCellLesson(custom.lesson ?? "");
      return;
    }
    const list = findAssignmentsForTeacher(assignmentsByDay, day, teacher, slot);
    if (list.length > 0) {
      const combinedLabel = [...new Set(list.map((a) => a.group).filter(Boolean))].sort((x, y) => (x || "").localeCompare(y || "", "tr")).join(", ");
      const combinedLesson = [...new Set(list.map((a) => a.lesson).filter(Boolean))].sort((x, y) => (x || "").localeCompare(y || "", "tr")).join(", ");
      setPendingTeacherCellLabel(combinedLabel);
      setPendingTeacherCellClassroom(list[0]?.classroom ?? "");
      setPendingTeacherCellLesson(combinedLesson);
    } else {
      setPendingTeacherCellLabel("");
      setPendingTeacherCellClassroom("");
      setPendingTeacherCellLesson("");
    }
  }, [selectedTeacherCell, teacherViewEntries, assignmentsByDay, normalizeLabelToStudent]);

  React.useEffect(() => {
    if (!tableViewMenuOpen) return;
    const onMouseDown = (e) => {
      if (tableViewMenuRef.current && !tableViewMenuRef.current.contains(e.target)) {
        setTableViewMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setTableViewMenuOpen(false);
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [tableViewMenuOpen]);

  React.useEffect(() => {
    if (!studentPickerOpen) return;
    const onMouseDown = (e) => {
      if (studentPickerRef.current && !studentPickerRef.current.contains(e.target)) {
        setStudentPickerOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setStudentPickerOpen(false);
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [studentPickerOpen]);

  React.useEffect(() => {
    if (!exportMenuOpen) return;

    const onMouseDown = (event) => {
      const el = exportWrapperRef.current;
      if (!el) return;
      if (!el.contains(event.target)) {
        setExportMenuOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setExportMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [exportMenuOpen]);

  React.useEffect(() => {
    if (!groupFilterOpen) return;
    const onDown = (e) => {
      const el = groupFilterRef.current;
      if (el && !el.contains(e.target)) setGroupFilterOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setGroupFilterOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [groupFilterOpen]);

  /** ESC: hücre seçimini ve elle öğretmen listesini kapat */
  React.useEffect(() => {
    const onEsc = (e) => {
      if (e.key !== "Escape") return;
      setSelectedCells([]);
      setFreeTeacherPickerOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  React.useEffect(() => {
    if (!freeTeacherPickerOpen) return;
    const onDown = (e) => {
      const el = freeTeacherPickerWrapRef.current;
      if (el && !el.contains(e.target)) setFreeTeacherPickerOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [freeTeacherPickerOpen]);

  const teachersByName = React.useMemo(() => {
    return teachers.reduce((acc, teacher) => {
      acc[teacher.ad] = teacher;
      return acc;
    }, {});
  }, [teachers]);

  const lessonUsageByGroupWeekly = React.useMemo(() => {
    const allAssignments = Object.values(assignmentsByDay).flatMap((dayAssignments) =>
      Object.values(dayAssignments ?? {})
    );

    return allAssignments.reduce((acc, assignment) => {
      if (!assignment?.group || !assignment?.lesson) {
        return acc;
      }

      const currentGroup = acc[assignment.group] ?? {};
      const nextCount = (currentGroup[assignment.lesson] ?? 0) + 1;

      acc[assignment.group] = {
        ...currentGroup,
        [assignment.lesson]: nextCount
      };

      return acc;
    }, {});
  }, [assignmentsByDay]);

  /**
   * Zorunlu haftalık ders yükü: tam / eksik (opsiyonel dersler bu hesaba girmez).
   * Eksikte title içinde hangi branşların kaç/kaç tamamlanmadığı listelenir.
   */
  const groupWeeklyLoadInfoByGroup = React.useMemo(() => {
    const result = {};
    for (const group of groupNames) {
      const required = requiredLessonLoadByGroup[group] ?? {};
      const usage = lessonUsageByGroupWeekly[group] ?? {};
      const lessons = Object.keys(required);
      if (lessons.length === 0) {
        result[group] = { status: null, title: undefined };
        continue;
      }
      const deficitItems = [];
      for (const lesson of lessons) {
        const max = required[lesson] ?? 0;
        const used = usage[lesson] ?? 0;
        if (used < max) {
          deficitItems.push({ lesson, used, max });
        }
      }
      deficitItems.sort((a, b) => a.lesson.localeCompare(b.lesson, "tr"));
      if (deficitItems.length > 0) {
        const detail = deficitItems.map((d) => `${d.lesson} (${d.used}/${d.max})`).join(" · ");
        result[group] = {
          status: "deficit",
          title: `Tamamlanmayan branşlar: ${detail}`
        };
      } else {
        result[group] = {
          status: "complete",
          title: "Haftalık zorunlu ders yükü karşılandı"
        };
      }
    }
    return result;
  }, [groupNames, requiredLessonLoadByGroup, lessonUsageByGroupWeekly]);

  const selKey = React.useMemo(() => selectionKey(selectedCells), [selectedCells]);

  /** Seçimin tamamı dolu hücrelerden oluşuyorsa: ders chip ile değiştirme yok, öğretmen/derslik düzenleme */
  const selectionIsAllAssignmentEdit = React.useMemo(() => {
    if (!selectedCells.length) return false;
    return selectedCells.every(({ group, slot }) => assignments[getCellKey(group, slot)]?.lesson);
  }, [selectedCells, assignments]);

  const uniqueGroupsInSelection = React.useMemo(() => {
    const u = [...new Set(selectedCells.map((c) => c.group))];
    return u.sort((a, b) => a.localeCompare(b, "tr"));
  }, [selectedCells]);

  /** Tek veya çoklu grupta müfredatta kesişen dersler */
  const commonLessons = React.useMemo(() => {
    const uniq = uniqueGroupsInSelection;
    if (uniq.length === 0) return [];
    if (uniq.length === 1) {
      const g = uniq[0];
      return [
        ...Object.keys(requiredLessonLoadByGroup[g] ?? {}),
        ...(optionalLessonsByGroup[g] ?? [])
      ];
    }
    const sets = uniq.map((g) => {
      const req = Object.keys(requiredLessonLoadByGroup[g] ?? {});
      const opt = optionalLessonsByGroup[g] ?? [];
      return new Set([...req, ...opt]);
    });
    const first = [...sets[0]];
    return first
      .filter((lesson) => sets.every((s) => s.has(lesson)))
      .sort((a, b) => a.localeCompare(b, "tr"));
  }, [uniqueGroupsInSelection, requiredLessonLoadByGroup, optionalLessonsByGroup]);

  const commonClassroomsForSelection = React.useMemo(() => {
    const uniq = uniqueGroupsInSelection;
    if (uniq.length === 0) return [];
    if (uniq.length === 1) return getClassroomsForGroup(uniq[0]);
    const lists = uniq.map((g) => getClassroomsForGroup(g));
    const inter = lists.reduce((acc, list) => acc.filter((c) => list.includes(c)), lists[0]);
    if (inter.length > 0) return inter;
    return [...new Set(lists.flat())].sort((a, b) => a.localeCompare(b, "tr"));
  }, [uniqueGroupsInSelection, getClassroomsForGroup]);

  const selectionHasNoCommonLessons =
    uniqueGroupsInSelection.length > 1 && commonLessons.length === 0;

  const commonLessonsSet = React.useMemo(() => new Set(commonLessons), [commonLessons]);

  React.useEffect(() => {
    if (!selKey) {
      setPendingLesson("");
      setPendingClassroom("");
      setFreeTeacherName("");
      return;
    }
    if (uniqueGroupsInSelection.length > 1 && commonLessons.length === 0) {
      setPendingLesson("");
      setPendingClassroom("");
      setFreeTeacherName("");
      return;
    }
    const keys = selectedCells.map((c) => getCellKey(c.group, c.slot));
    const lessons = new Set(keys.map((k) => assignments[k]?.lesson).filter(Boolean));
    const rooms = new Set(keys.map((k) => assignments[k]?.classroom).filter(Boolean));
    const tnames = new Set(keys.map((k) => assignments[k]?.teacher).filter(Boolean));

    if (uniqueGroupsInSelection.length === 1) {
      if (lessons.size === 1) {
        const L = [...lessons][0];
        setPendingLesson(L);
        if (isLessonConflictExempt(L)) {
          setFreeTeacherName([...tnames][0] ?? "");
        } else {
          setFreeTeacherName("");
        }
      } else {
        setPendingLesson("");
        setFreeTeacherName("");
      }
      if (rooms.size === 1) {
        setPendingClassroom([...rooms][0] ?? "");
      } else {
        setPendingClassroom("");
      }
      return;
    }

    if (lessons.size === 1) {
      const L = [...lessons][0];
      if (commonLessonsSet.has(L)) {
        setPendingLesson(L);
        if (isLessonConflictExempt(L)) {
          setFreeTeacherName([...tnames][0] ?? "");
        } else {
          setFreeTeacherName("");
        }
      } else {
        setPendingLesson("");
        setFreeTeacherName("");
      }
    } else {
      setPendingLesson("");
      setFreeTeacherName("");
    }

    if (rooms.size === 1) {
      setPendingClassroom([...rooms][0] ?? "");
    } else {
      setPendingClassroom("");
    }
  }, [
    selKey,
    currentDay,
    assignments,
    selectedCells,
    uniqueGroupsInSelection,
    commonLessons,
    commonLessonsSet
  ]);

  const getTeacherOptionsForLesson = React.useCallback(
    ({ selectionCells, lesson, classroom, day }) => {
      if (!selectionCells?.length || !lesson || isLessonConflictExempt(lesson)) {
        return [];
      }

      const groupsInSelection = [...new Set(selectionCells.map((c) => c.group))];

      const reasonPriority = {
        Uygun: 0,
        "Ayni seviye uyari": 1,
        "Musait degil": 2,
        "Derslik cakismasi": 3,
        "Cakisma var": 4
      };

      return teachers
        .filter((teacher) => {
          const canTeachLesson = (teacher.branşlar ?? []).includes(lesson);
          const worksWithAllGroups = groupsInSelection.every((g) =>
            (teacher.gruplar ?? []).includes(g)
          );
          return canTeachLesson && worksWithAllGroups;
        })
        .map((teacher) => {
          const cellReasons = [];
          let canScheduleLesson = true;
          let isSelectable = true;

          for (const { group, slot } of selectionCells) {
            const slotRange = timeSlots.find((item) => item.slot === slot)?.range;
            if (!slotRange) {
              cellReasons.push("Musait degil");
              canScheduleLesson = false;
              isSelectable = false;
              continue;
            }

            const isAvailableAtSlot = isTeacherAvailableForSlot(teacher, slotRange, day);
            const cellKey = getCellKey(group, slot);
            const teacherConflict = getTeacherConflictMode({
              assignmentsByCell: assignments,
              currentCellKey: cellKey,
              teacherName: teacher.ad,
              selectedGroup: group,
              selectedSlot: slot,
              lesson
            });
            const classroomConflict = hasClassroomConflict({
              assignmentsByCell: assignments,
              currentCellKey: cellKey,
              classroom,
              slot,
              newLesson: lesson
            });
            const isTeacherConflictBlocked = teacherConflict.mode === "blocked";

            let cellReason = "Uygun";
            if (classroomConflict) {
              cellReason = "Derslik cakismasi";
            } else if (teacherConflict.mode === "blocked") {
              cellReason = "Cakisma var";
            } else if (!isAvailableAtSlot) {
              cellReason = "Musait degil";
            } else if (teacherConflict.mode === "warning_same_level") {
              cellReason = "Ayni seviye uyari";
            }
            cellReasons.push(cellReason);

            if (!isAvailableAtSlot || isTeacherConflictBlocked) {
              canScheduleLesson = false;
            }
            if (!isAvailableAtSlot || classroomConflict || isTeacherConflictBlocked) {
              isSelectable = false;
            }
          }

          const reason = cellReasons.reduce(
            (worst, r) => ((reasonPriority[r] ?? 99) > (reasonPriority[worst] ?? 99) ? r : worst),
            "Uygun"
          );

          return {
            teacher,
            isSelectable,
            canScheduleLesson,
            reason
          };
        })
        .sort((a, b) => {
          const byReason = (reasonPriority[a.reason] ?? 99) - (reasonPriority[b.reason] ?? 99);
          if (byReason !== 0) {
            return byReason;
          }

          return a.teacher.ad.localeCompare(b.teacher.ad, "tr");
        });
    },
    [assignments, teachers]
  );

  const teacherOptions = React.useMemo(() => {
    if (!selectedCells.length || !pendingLesson || isLessonConflictExempt(pendingLesson)) {
      return [];
    }
    return getTeacherOptionsForLesson({
      selectionCells: selectedCells,
      lesson: pendingLesson,
      classroom: pendingClassroom || "",
      day: currentDay
    });
  }, [currentDay, getTeacherOptionsForLesson, pendingClassroom, pendingLesson, selectedCells]);

  const applyAssignments = React.useCallback(
    (teacherName) => {
      if (selectedCells.length === 0) return;
      if (!pendingLesson) {
        window.alert("Ders seçin.");
        return;
      }
      if (uniqueGroupsInSelection.length > 1 && !commonLessons.includes(pendingLesson)) {
        window.alert("Seçili grupların müfredatında ortak olmayan bir ders seçilemez.");
        return;
      }

      let finalTeacher = teacherName;
      if (isLessonConflictExempt(pendingLesson)) {
        finalTeacher = (freeTeacherName || "").trim();
        if (!finalTeacher) {
          window.alert("Bu ders için öğretmen adını yazın.");
          return;
        }
      }

      setAssignmentsByDay((prev) => {
        const day = { ...(prev[currentDay] ?? {}) };
        for (const { group, slot } of selectedCells) {
          const key = getCellKey(group, slot);
          const prevCell = day[key];

          if (selectionIsAllAssignmentEdit) {
            day[key] = {
              group,
              slot,
              lesson: pendingLesson,
              teacher: finalTeacher,
              classroom: pendingClassroom || ""
            };
          } else if (!prevCell?.lesson) {
            day[key] = {
              group,
              slot,
              lesson: pendingLesson,
              teacher: finalTeacher,
              classroom: pendingClassroom || ""
            };
          } else if (prevCell.lesson === pendingLesson) {
            day[key] = {
              ...prevCell,
              group,
              slot,
              lesson: pendingLesson,
              teacher: finalTeacher,
              classroom: pendingClassroom || ""
            };
          }
          /* Karışık seçimde hücrede başka ders varsa dokunma (yanlış ezme önlenir) */
        }
        return { ...prev, [currentDay]: day };
      });
      setSelectedCells([]);
    },
    [
      selectedCells,
      currentDay,
      pendingLesson,
      pendingClassroom,
      uniqueGroupsInSelection,
      commonLessons,
      freeTeacherName,
      selectionIsAllAssignmentEdit
    ]
  );

  /**
   * Tek uygun öğretmen: yalnızca kullanıcı ders chip'ine tıkladığında otomatik ata.
   * Boş hücre seçimi + eski pending ders ile tetiklenmez; dolu hücre düzenlemesinde çalışmaz.
   */
  React.useEffect(() => {
    if (!shouldAutoApplyAfterLessonPickRef.current) return;
    shouldAutoApplyAfterLessonPickRef.current = false;
    if (!pendingLesson || isLessonConflictExempt(pendingLesson)) return;
    if (!selectedCells.length) return;
    const anyAssigned = selectedCells.some(({ group, slot }) => assignments[getCellKey(group, slot)]?.lesson);
    if (anyAssigned) return;
    const selectable = teacherOptions.filter((o) => o.isSelectable);
    if (selectable.length !== 1) return;
    applyAssignments(selectable[0].teacher.ad);
  }, [pendingLesson, teacherOptions, selectedCells, assignments, applyAssignments]);

  /** Çakışmalar hücrede kırmızı çerçeve ile gösterilir; burada yalnızca veri tutarlılığı uyarıları. */
  const validationWarnings = React.useMemo(() => {
    const warningList = [];
    const slotIdsDesc = [...timeSlots].map((t) => String(t.slot)).sort((a, b) => b.length - a.length);

    Object.entries(assignments).forEach(([cellKey, assignment]) => {
      if (!assignment) {
        return;
      }

      let { group, slot, lesson, teacher: teacherName } = assignment;
      if (!group || !slot) {
        const parsed = parseCellKeyToGroupSlot(cellKey, slotIdsDesc);
        if (parsed) {
          if (!group) group = parsed.group;
          if (!slot) slot = parsed.slot;
        }
      }
      const lessonOk = lesson != null && String(lesson).trim() !== "";
      const teacherOk = teacherName != null && String(teacherName).trim() !== "";
      if (!group || !slot || !lessonOk || !teacherOk) {
        warningList.push(`Eksik atama bilgisi: ${cellKey}`);
        return;
      }

      const exempt = isLessonConflictExempt(lesson);

      if (!groupNames.includes(group)) {
        warningList.push(`Gecersiz grup: ${group}`);
      }

      const slotExists = timeSlots.some((item) => item.slot === slot);
      if (!slotExists || isBreakSlot(slot)) {
        warningList.push(`Gecersiz ders saati: ${group} - ${slot}`);
      }

      const requiredLoad = requiredLessonLoadByGroup[group] ?? {};
      const isOptionalLesson = (optionalLessonsByGroup[group] ?? []).includes(lesson);
      if (!isOptionalLesson && !(lesson in requiredLoad)) {
        warningList.push(`Gecersiz ders atamasi: ${group} - ${lesson}`);
      } else if (!isOptionalLesson) {
        const used = lessonUsageByGroupWeekly[group]?.[lesson] ?? 0;
        const max = requiredLoad[lesson] ?? 0;
        if (used > max) {
          warningList.push(`${group} icin ${lesson} haftalik yuk asildi (${used}/${max})`);
        }
      }

      if (exempt) {
        return;
      }

      const teacher = teachersByName[teacherName];
      if (!teacher) {
        warningList.push(`Ogretmen bulunamadi: ${teacherName}`);
        return;
      }

      if (!(teacher.branşlar ?? []).includes(lesson)) {
        warningList.push(`${teacherName} ${lesson} bransina uygun degil`);
      }

      if (!(teacher.gruplar ?? []).includes(group)) {
        warningList.push(`${teacherName} ${group} grubuna uygun degil`);
      }

      const slotRange = timeSlots.find((item) => item.slot === slot)?.range;
      if (!isTeacherAvailableForSlot(teacher, slotRange, currentDay)) {
        warningList.push(`${teacherName} ${currentDay} ${slot}. derste musait degil`);
      }
    });

    return Array.from(new Set(warningList));
  }, [
    assignments,
    currentDay,
    groupNames,
    lessonUsageByGroupWeekly,
    optionalLessonsByGroup,
    requiredLessonLoadByGroup,
    teachersByName,
    timeSlots
  ]);

  const handleCellClick = (event, group, slot) => {
    if (isBreakSlot(slot)) return;
    if (suppressCellClickRef.current) {
      suppressCellClickRef.current = false;
      return;
    }
    event.stopPropagation();
    setSelectedCells((prev) => {
      const exists = prev.some((c) => cellsEqual(c, { group, slot }));
      if (exists) return prev.filter((c) => !cellsEqual(c, { group, slot }));
      return [...prev, { group, slot }];
    });
  };

  const clearSelection = () => {
    setSelectedCells([]);
  };

  const toggleGroupVisible = (group) => {
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const selectAllGroups = () => setVisibleGroups(new Set(groupNames));
  const selectNoGroups = () => setVisibleGroups(new Set());

  const handleLessonSelect = (lesson) => {
    if (selectionIsAllAssignmentEdit) return;
    shouldAutoApplyAfterLessonPickRef.current = true;
    setPendingLesson(lesson);
  };

  const handleClassroomChange = (newRoom) => {
    setPendingClassroom(newRoom);
    const hasAssigned = selectedCells.some(({ group, slot }) => assignments[getCellKey(group, slot)]?.lesson);
    if (!hasAssigned) return;

    setAssignmentsByDay((prev) => {
      const day = { ...(prev[currentDay] ?? {}) };
      for (const { group, slot } of selectedCells) {
        const key = getCellKey(group, slot);
        const ex = day[key];
        if (ex?.lesson) {
          day[key] = { ...ex, classroom: newRoom };
        }
      }
      return { ...prev, [currentDay]: day };
    });
  };

  const handleTeacherSelect = (teacherName) => {
    applyAssignments(teacherName);
  };

  const handleClearAssignmentForKey = (cellKey, group, slot) => {
    setAssignmentsByDay((prev) => {
      const currentAssignments = { ...(prev[currentDay] ?? {}) };
      delete currentAssignments[cellKey];
      return { ...prev, [currentDay]: currentAssignments };
    });
    setSelectedCells((prev) => prev.filter((c) => !(c.group === group && c.slot === slot)));
  };

  const handleDayChange = (day) => {
    setCurrentDay(day);
    setSelectedCells([]);
    setPendingLesson("");
    setPendingClassroom("");
    setFreeTeacherName("");
    setExportMenuOpen(false);
  };

  const applyTeacherCellEntry = React.useCallback(
    (teacher, day, slot, label, classroom, lesson = "") => {
      const raw = (label ?? "").trim();
      const lab = normalizeLabelToStudent(raw) || raw;
      const room = classroom || "";
      const les = (lesson ?? "").trim();
    setTeacherViewEntries((prev) => {
      const next = { ...prev };
      if (!next[teacher]) next[teacher] = {};
      next[teacher] = { ...next[teacher] };
      if (!next[teacher][day]) next[teacher][day] = {};
      next[teacher][day] = { ...next[teacher][day] };
      if (!lab && !room && !les) {
        const { [slot]: _, ...rest } = next[teacher][day];
        next[teacher][day] = rest;
        if (Object.keys(next[teacher][day]).length === 0) {
          const { [day]: __, ...dayRest } = next[teacher];
          next[teacher] = dayRest;
        }
        if (Object.keys(next[teacher]).length === 0) {
          const { [teacher]: ___, ...tRest } = next;
          return tRest;
        }
      } else {
        next[teacher][day][slot] = { label: lab, classroom: room, lesson: les };
      }
      return next;
    });
  },
    [normalizeLabelToStudent]
  );

  const handleTeacherCellClick = React.useCallback(
    (day, slot, isSameCell) => {
      if (isSameCell) {
        setSelectedTeacherCell(null);
        return;
      }
      if (selectedTeacherCell) {
        applyTeacherCellEntry(
          selectedTeacherCell.teacher,
          selectedTeacherCell.day,
          selectedTeacherCell.slot,
          pendingTeacherCellLabel,
          pendingTeacherCellClassroom,
          pendingTeacherCellLesson
        );
      }
      setSelectedTeacherCell({ teacher: tableViewTeacher, day, slot });
    },
    [
      selectedTeacherCell,
      pendingTeacherCellLabel,
      pendingTeacherCellClassroom,
      pendingTeacherCellLesson,
      tableViewTeacher,
      applyTeacherCellEntry
    ]
  );

  const handleCopyToNextSlot = React.useCallback(
    (day, slotIdx, label, room, lesson) => {
      const nextSlot = timeSlots[slotIdx + 1]?.slot;
      if (!nextSlot) return;
      applyTeacherCellEntry(tableViewTeacher, day, nextSlot, label, room, lesson);
    },
    [tableViewTeacher, applyTeacherCellEntry]
  );

  React.useEffect(() => {
    if (tableViewMode !== "ögretmen") {
      if (selectedTeacherCell) {
        applyTeacherCellEntry(
          selectedTeacherCell.teacher,
          selectedTeacherCell.day,
          selectedTeacherCell.slot,
          pendingTeacherCellLabel,
          pendingTeacherCellClassroom,
          pendingTeacherCellLesson
        );
      }
      setSelectedTeacherCell(null);
    }
  }, [
    tableViewMode,
    selectedTeacherCell,
    pendingTeacherCellLabel,
    pendingTeacherCellClassroom,
    pendingTeacherCellLesson,
    applyTeacherCellEntry
  ]);

  const handleClearCurrentDayTable = () => {
    const isConfirmed = window.confirm(
      `${currentDay} gununun tum ders atamalari silinsin mi? Bu islem geri alinamaz.`
    );
    if (!isConfirmed) {
      return;
    }

    setAssignmentsByDay((prev) => ({
      ...prev,
      [currentDay]: {}
    }));
    setSelectedCells([]);
    setPendingLesson("");
    setPendingClassroom("");
    setFreeTeacherName("");
    setExportMenuOpen(false);
  };

  const groupsForTable = React.useMemo(
    () => groupNames.filter((g) => visibleGroups.has(g)),
    [visibleGroups]
  );

  React.useEffect(() => {
    if (tableViewMode === "ögretmen" && !tableViewTeacher && teachersWithAssignments.length > 0) {
      setTableViewTeacher(teachersWithAssignments[0]);
    } else if (tableViewMode === "ögretmen" && tableViewTeacher && !teachersWithAssignments.includes(tableViewTeacher)) {
      setTableViewTeacher(teachersWithAssignments[0] ?? "");
    }
    if (tableViewMode === "grup" && !tableViewGroup && groupsForTable.length > 0) {
      setTableViewGroup(groupsForTable[0]);
    } else if (tableViewMode === "grup" && tableViewGroup && !groupsForTable.includes(tableViewGroup)) {
      setTableViewGroup(groupsForTable[0] ?? "");
    }
  }, [tableViewMode, tableViewTeacher, tableViewGroup, teachersWithAssignments, groupsForTable]);

  const handleScheduleCellPointerDown = React.useCallback(
    (e, group, slot) => {
      if (!canEdit) return;
      if (e.button !== 0) return;
      if (isBreakSlot(slot)) return;
      const row = groupsForTable.indexOf(group);
      const col = timeSlots.findIndex((s) => s.slot === slot);
      if (row < 0 || col < 0) return;

      const startX = e.clientX;
      const startY = e.clientY;
      dragSelectRef.current = {
        startRow: row,
        startCol: col,
        lastRow: row,
        lastCol: col,
        moving: false
      };

      /**
       * setPointerCapture(td) kullanmıyoruz: yakalama içteki butonun click üretimini bozuyordu.
       * Sürükleme için window dinleyicileri yeterli; tek tıklama yine .cell-trigger üzerinde çalışır.
       */
      const onMove = (ev) => {
        if (!dragSelectRef.current) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (dx * dx + dy * dy > 25) dragSelectRef.current.moving = true;
        const td = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.("td[data-schedule-cell]");
        if (!td) return;
        const g = td.dataset.group;
        const s = td.dataset.slot;
        if (!g || !s || isBreakSlot(s)) return;
        const r = groupsForTable.indexOf(g);
        const c = timeSlots.findIndex((x) => x.slot === s);
        if (r < 0 || c < 0) return;
        dragSelectRef.current.lastRow = r;
        dragSelectRef.current.lastCol = c;
      };

      const onUp = () => {
        if (!dragSelectRef.current) return;
        const snapshot = { ...dragSelectRef.current };
        dragSelectRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (snapshot.moving) {
          const startG = groupsForTable[snapshot.startRow];
          const startS = timeSlots[snapshot.startCol]?.slot;
          const endG = groupsForTable[snapshot.lastRow];
          const endS = timeSlots[snapshot.lastCol]?.slot;
          if (!startG || !startS || !endG || !endS) return;
          const rect = buildRectangleCells(groupsForTable, timeSlots, startG, startS, endG, endS);
          if (rect.length) {
            setSelectedCells(rect);
            suppressCellClickRef.current = true;
          }
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [groupsForTable, canEdit]
  );

  const exportGroupNames = groupsForTable.length > 0 ? groupsForTable : groupNames;

  const exportFilteredDays = React.useMemo(
    () => DAYS.filter((d) => exportSelectedDays.has(d)),
    [exportSelectedDays]
  );
  const exportFilteredGroups = React.useMemo(
    () => groupNames.filter((g) => exportSelectedGroups.has(g)),
    [exportSelectedGroups]
  );
  const exportFilteredTeachers = React.useMemo(
    () => allExportTeachers.filter((t) => exportSelectedTeachers.has(t)),
    [allExportTeachers, exportSelectedTeachers]
  );

  const handleExportFullProgramPdf = async () => {
    if (exportPdfZipLoading) return;
    setExportPdfZipLoading(true);
    setExportMenuOpen(false);
    try {
      const days = exportFilteredDays.length > 0 ? exportFilteredDays : DAYS;
      const groups = exportFilteredGroups.length > 0 ? exportFilteredGroups : groupNames;
      const teacherFilter =
        exportSelectedTeachers.size === 0
          ? null
          : exportSelectedTeachers.size === allExportTeachers.length
            ? null
            : exportFilteredTeachers;
      await exportFullWeeklySchedulePdfAsZip({
        zipFileName: "ders-programi.zip",
        days,
        groupNames: groups,
        timeSlots,
        assignmentsByDay,
        teacherViewEntries,
        groupLoadInfoByGroup: groupWeeklyLoadInfoByGroup,
        teacherFilter
      });
    } finally {
      setExportPdfZipLoading(false);
    }
  };

  const handleExportCsv = () => {
    setExportMenuOpen(false);
    const days = exportFilteredDays.length > 0 ? exportFilteredDays : DAYS;
    const groups = exportFilteredGroups.length > 0 ? exportFilteredGroups : groupNames;
    exportScheduleAsCsv({
      fileName: "ders-programi.csv",
      days,
      groupNames: groups,
      timeSlots,
      assignmentsByDay
    });
  };

  const handleExportTeacherMatrixHtml = () => {
    setExportMenuOpen(false);
    const days = exportFilteredDays.length > 0 ? exportFilteredDays : DAYS;
    const teacherFilter =
      exportSelectedTeachers.size === 0
        ? []
        : exportSelectedTeachers.size === allExportTeachers.length
          ? null
          : exportFilteredTeachers;
    exportWeeklyTeacherMatrixHtml({
      fileName: "ogretmen-haftalik-program.html",
      days,
      timeSlots,
      assignmentsByDay,
      teacherViewEntries,
      teacherFilter
    });
  };

  const toggleExportDay = (day) => {
    setExportSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };
  const toggleExportGroup = (g) => {
    setExportSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };
  const toggleExportTeacher = (t) => {
    setExportSelectedTeachers((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };
  const selectAllExportDays = () => setExportSelectedDays(new Set(DAYS));
  const selectNoExportDays = () => setExportSelectedDays(new Set());
  const selectAllExportGroups = () => setExportSelectedGroups(new Set(groupNames));
  const selectNoExportGroups = () => setExportSelectedGroups(new Set());
  const selectAllExportTeachers = () => setExportSelectedTeachers(new Set(allExportTeachers));
  const selectNoExportTeachers = () => setExportSelectedTeachers(new Set());

  const handleExportGroupMatrixHtml = () => {
    setExportMenuOpen(false);
    const days = exportFilteredDays.length > 0 ? exportFilteredDays : DAYS;
    const groups = exportFilteredGroups.length > 0 ? exportFilteredGroups : groupNames;
    exportWeeklyGroupMatrixHtml({
      fileName: "grup-haftalik-program.html",
      groupNames: groups,
      days,
      timeSlots,
      assignmentsByDay
    });
  };

  const handleExportStudentMatrixHtml = () => {
    setExportMenuOpen(false);
    const days = exportFilteredDays.length > 0 ? exportFilteredDays : DAYS;
    const classFilter =
      exportSelectedStudentClasses.size === 0
        ? null
        : exportSelectedStudentClasses.size === studentClassOptions.length
          ? null
          : exportSelectedStudentClasses;
    exportWeeklyStudentMatrixHtml({
      fileName: "ogrenci-haftalik-program.html",
      days,
      timeSlots,
      teacherViewEntries,
      students: studentsList,
      studentClassFilter: classFilter,
      onlyStudentsInProgram: exportStudentOnlyInProgram
    });
  };

  const toggleExportStudentClass = (cls) => {
    setExportSelectedStudentClasses((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls);
      else next.add(cls);
      return next;
    });
  };
  const selectAllExportStudentClasses = () =>
    setExportSelectedStudentClasses(new Set(studentClassOptions));
  const selectNoExportStudentClasses = () => setExportSelectedStudentClasses(new Set());

  const isSelected = (group, slot) => selectedCells.some((c) => cellsEqual(c, { group, slot }));

  const getCellConflictTooltip = (cellKey) => {
    const list = cellConflictReasons[cellKey];
    if (!list?.length) return undefined;
    return list.join(" · ");
  };

  const selectedSlotsLabel = React.useMemo(() => {
    if (!selectedCells.length) return "";
    const order = timeSlots.map((s) => s.slot);
    const sorted = [...selectedCells].sort(
      (a, b) => order.indexOf(a.slot) - order.indexOf(b.slot)
    );
    return sorted
      .map(({ slot }) => (isBreakSlot(slot) ? slot : `${slot}. Ders`))
      .join(" · ");
  }, [selectedCells]);

  const isClassroomOptionBlocked = React.useCallback(
    (classroomName) => {
      if (!classroomName) return false;
      return selectedCells.some(({ group, slot }) => {
        const key = getCellKey(group, slot);
        const lessonForConflict = pendingLesson || assignments[key]?.lesson;
        return hasClassroomConflict({
          assignmentsByCell: assignments,
          currentCellKey: key,
          classroom: classroomName,
          slot,
          newLesson: lessonForConflict
        });
      });
    },
    [assignments, pendingLesson, selectedCells]
  );

  const handleToggleEditMode = React.useCallback(() => {
    if (typeof onToggleScheduleEditMode === "function") {
      onToggleScheduleEditMode();
    }
  }, [onToggleScheduleEditMode]);

  const programHasContent = React.useMemo(
    () => hasMeaningfulProgramData(assignmentsByDay, teacherViewEntries),
    [assignmentsByDay, teacherViewEntries]
  );

  const handleStorageImportApplied = React.useCallback((data) => {
    setAssignmentsByDay(data.assignmentsByDay);
    setVisibleGroups(new Set(data.visibleGroups));
    setTeacherViewEntries(data.teacherViewEntries);
    setSelectedCells([]);
    setSelectedTeacherCell(null);
    setPendingLesson("");
    setPendingClassroom("");
    setFreeTeacherName("");
    setPendingTeacherCellLabel("");
    setPendingTeacherCellClassroom("");
    setPendingTeacherCellLesson("");
  }, []);

  const applyServerRowToState = React.useCallback(
    (row) => {
      const data = row?.data;
      if (!data || typeof data !== "object") return;
      const merged = mergeAssignmentsFromRemotePayload(data.assignmentsByDay);
      const vis = Array.isArray(data.visibleGroups)
        ? data.visibleGroups.filter((g) => typeof g === "string" && groupNames.includes(g))
        : [];
      const tv =
        data.teacherViewEntries && typeof data.teacherViewEntries === "object" ? data.teacherViewEntries : {};
      handleStorageImportApplied({
        assignmentsByDay: merged,
        visibleGroups: vis.length > 0 ? vis : [...groupNames],
        teacherViewEntries: tv,
      });
    },
    [handleStorageImportApplied]
  );

  React.useEffect(() => {
    if (!supabaseUserId) {
      setScheduleLoadStatus("ready");
      setScheduleLoadError(null);
      setActiveProgramId(null);
      return;
    }

    let cancelled = false;
    setScheduleLoadStatus("loading");
    setScheduleLoadError(null);

    (async () => {
      const res = await getSchedules(supabaseUserId);
      if (cancelled) return;
      if (!res.ok) {
        setScheduleLoadStatus("error");
        setScheduleLoadError(res.error);
        return;
      }

      let rows = res.data;

      if (rows.length === 0) {
        const mig = readLegacyScheduleLocalStorageForMigration(groupNames);
        if (mig.ok && hasMeaningfulProgramData(mig.assignmentsByDay, mig.teacherViewEntries)) {
          const payload = buildScheduleProgramPayloadFromState(
            mig.assignmentsByDay,
            new Set(mig.visibleGroups),
            mig.teacherViewEntries
          );
          const saved = await saveSchedule({
            userId: supabaseUserId,
            programName: DEFAULT_PROGRAM_NAME,
            data: payload,
          });
          if (!cancelled && saved.ok) {
            clearLegacyScheduleLocalStorage();
            rows = [saved.data];
          }
        }
      }

      if (cancelled) return;

      if (rows.length === 0) {
        setActiveProgramId(null);
        setScheduleLoadStatus("ready");
        return;
      }

      const preferred = rows.find((r) => r.program_name === DEFAULT_PROGRAM_NAME) ?? rows[0];
      skipAutoSaveRef.current = 1;
      setActiveProgramId(preferred.id);
      applyServerRowToState(preferred);
      clearLegacyScheduleLocalStorage();
      setScheduleLoadStatus("ready");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca kullanıcı / oturum değişiminde tam yükleme
  }, [supabaseUserId]);

  const flushPersistToSupabase = React.useCallback(async () => {
    const uid = supabaseUserIdRef.current;
    if (!uid) return;

    const snap = persistSnapshotRef.current;
    const payload = buildScheduleProgramPayloadFromState(snap.assignmentsByDay, snap.visibleGroups, snap.teacherViewEntries);
    if (
      !payload.assignmentsByDay ||
      typeof payload.assignmentsByDay !== "object" ||
      !Array.isArray(payload.visibleGroups) ||
      !payload.teacherViewEntries ||
      typeof payload.teacherViewEntries !== "object"
    ) {
      setSaveError("Kaydedilecek veri geçersiz.");
      setSaveStatus("error");
      return;
    }

    const gen = ++persistGenRef.current;
    setSaveStatus("saving");
    setSaveError(null);

    let id = activeProgramIdRef.current;
    let result;
    if (id) {
      result = await updateSchedule(id, { data: payload });
    } else {
      result = await saveSchedule({
        userId: uid,
        programName: DEFAULT_PROGRAM_NAME,
        data: payload,
      });
    }

    if (gen !== persistGenRef.current) return;

    if (result.ok) {
      if (!id && result.data?.id) {
        const newId = result.data.id;
        activeProgramIdRef.current = newId;
        setActiveProgramId(newId);
      }
      setSaveStatus("saved");
      window.setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 2000);
    } else {
      setSaveError(result.error);
      setSaveStatus("error");
    }
  }, []);

  React.useEffect(() => {
    if (scheduleLoadStatus !== "ready" || !supabaseUserId || !allowScheduleEdit) return;

    const t = window.setTimeout(() => {
      if (skipAutoSaveRef.current > 0) {
        skipAutoSaveRef.current -= 1;
        return;
      }
      flushPersistToSupabase();
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(t);
  }, [
    assignmentsByDay,
    visibleGroups,
    teacherViewEntries,
    scheduleLoadStatus,
    supabaseUserId,
    allowScheduleEdit,
    activeProgramId,
    flushPersistToSupabase,
  ]);

  const handleRetryLoad = React.useCallback(() => {
    setScheduleLoadError(null);
    if (!supabaseUserId) {
      setScheduleLoadStatus("ready");
      return;
    }
    setScheduleLoadStatus("loading");
    (async () => {
      const res = await getSchedules(supabaseUserId);
      if (!res.ok) {
        setScheduleLoadStatus("error");
        setScheduleLoadError(res.error);
        return;
      }
      const rows = res.data;
      if (rows.length === 0) {
        setActiveProgramId(null);
        setScheduleLoadStatus("ready");
        return;
      }
      const preferred = rows.find((r) => r.program_name === DEFAULT_PROGRAM_NAME) ?? rows[0];
      skipAutoSaveRef.current = 1;
      setActiveProgramId(preferred.id);
      applyServerRowToState(preferred);
      clearLegacyScheduleLocalStorage();
      setScheduleLoadStatus("ready");
    })();
  }, [supabaseUserId, applyServerRowToState]);

  return (
    <div
      className={`schedule-layout schedule-layout--manual${scheduleLoadStatus === "loading" ? " schedule-layout--supabase-loading" : ""}`}
    >
      <div className="schedule-fixed-top">
        {scheduleLoadStatus === "loading" ? (
          <div className="schedule-supabase-loading" role="status" aria-live="polite">
            <span className="schedule-supabase-loading-spinner" aria-hidden="true" />
            Program yükleniyor…
          </div>
        ) : null}
        {scheduleLoadStatus === "error" ? (
          <div className="schedule-supabase-error" role="alert">
            <span>{scheduleLoadError || "Yükleme hatası"}</span>
            <button type="button" className="schedule-retry-btn" onClick={handleRetryLoad}>
              Tekrar dene
            </button>
          </div>
        ) : null}
        {scheduleLoadStatus === "ready" ? (
          <div className="schedule-persist-row">
            <p className="schedule-persist-info">
              {supabaseUserId
                ? allowScheduleEdit
                  ? "Veriler hesabınıza kaydedilir; düzenlemeler yaklaşık 1 saniye sonra otomatik olarak Supabase’e yazılır."
                  : "Veriler hesabınıza kaydedilir; düzenleme yetkiniz yok (salt görüntüleme)."
                : "Kalıcı kayıt için yönetim paneline giriş yapın."}
            </p>
            {supabaseUserId && allowScheduleEdit && saveStatus !== "idle" ? (
              <p className="schedule-persist-status" aria-live="polite">
                {saveStatus === "saving"
                  ? "Kaydediliyor…"
                  : saveStatus === "saved"
                    ? "Kaydedildi."
                    : "Son kayıt başarısız."}
              </p>
            ) : null}
            {saveError ? (
              <p className="schedule-save-error" role="alert">
                {saveError}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="manual-top-section">
        <div className="day-switcher">
          <div className="day-switcher-left">
            {tableViewMode === "gün" ? (
              DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`day-chip ${day === currentDay ? "is-active" : ""}`}
                  onClick={() => handleDayChange(day)}
                >
                  {day}
                </button>
              ))
            ) : tableViewMode === "ögretmen" ? (
              <select
                className="tableView-select"
                value={tableViewTeacher}
                onChange={(e) => setTableViewTeacher(e.target.value)}
                aria-label="Öğretmen seç"
              >
                <option value="">— Öğretmen seç —</option>
                {teachersWithAssignments.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="tableView-select"
                value={tableViewGroup}
                onChange={(e) => setTableViewGroup(e.target.value)}
                aria-label="Grup seç"
              >
                <option value="">— Grup seç —</option>
                {(groupsForTable.length > 0 ? groupsForTable : groupNames).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="day-switcher-right">
            {allowScheduleEdit ? (
              <button
                type="button"
                className={`group-filter-trigger group-filter-trigger--edit ${scheduleEditModeActive ? "is-active-mode" : ""}`}
                onClick={handleToggleEditMode}
                title={scheduleEditModeActive ? "Görüntüleme moduna dön" : "Düzenleme moduna geç"}
              >
                {scheduleEditModeActive ? "Görüntüle" : "Düzenle"}
              </button>
            ) : (
              <span className="schedule-readonly-badge" title="Rol yetkileri">
                Salt okunur
              </span>
            )}
            <div className="tableView-dropdown" ref={tableViewMenuRef}>
              <button
                type="button"
                className="group-filter-trigger"
                aria-expanded={tableViewMenuOpen}
                aria-haspopup="menu"
                onClick={() => setTableViewMenuOpen((v) => !v)}
              >
                Tablo Gösterimi
                <span className="group-filter-trigger-caret" aria-hidden="true">
                  ▾
                </span>
              </button>
              {tableViewMenuOpen ? (
                <div className="group-filter-popover tableView-popover" role="menu">
                  <button
                    type="button"
                    className="tableView-option-btn"
                    role="menuitem"
                    onClick={() => {
                      setTableViewMode("gün");
                      setTableViewMenuOpen(false);
                    }}
                  >
                    {tableViewMode === "gün" ? "✓ " : ""}Gün Programı
                  </button>
                  <button
                    type="button"
                    className="tableView-option-btn"
                    role="menuitem"
                    onClick={() => {
                      setTableViewMode("ögretmen");
                      setTableViewMenuOpen(false);
                    }}
                  >
                    {tableViewMode === "ögretmen" ? "✓ " : ""}Öğretmen Programı
                  </button>
                  <button
                    type="button"
                    className="tableView-option-btn"
                    role="menuitem"
                    onClick={() => {
                      setTableViewMode("grup");
                      setTableViewMenuOpen(false);
                    }}
                  >
                    {tableViewMode === "grup" ? "✓ " : ""}Grup Programı
                  </button>
                </div>
              ) : null}
            </div>
            <div className="group-filter-dropdown" ref={groupFilterRef}>
              <button
                type="button"
                className="group-filter-trigger"
                aria-expanded={groupFilterOpen}
                aria-haspopup="listbox"
                onClick={() => setGroupFilterOpen((v) => !v)}
              >
                Gruplar
                <span className="group-filter-trigger-caret" aria-hidden="true">
                  ▾
                </span>
              </button>
              {groupFilterOpen ? (
                <div className="group-filter-popover" role="listbox">
                  <div className="group-filter-popover-actions">
                    <button type="button" className="group-filter-action" onClick={selectAllGroups}>
                      Tümü
                    </button>
                    <button type="button" className="group-filter-action" onClick={selectNoGroups}>
                      Hiçbiri
                    </button>
                  </div>
                  <div className="group-filter-popover-list">
                    {groupNames.map((g) => (
                      <label key={g} className="group-filter-item">
                        <input
                          type="checkbox"
                          checked={visibleGroups.has(g)}
                          onChange={() => toggleGroupVisible(g)}
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="export-wrapper" ref={exportWrapperRef}>
              <button
                type="button"
                className="export-btn"
                onClick={() => setExportMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
              >
                Dışarı Aktar
              </button>

              {exportMenuOpen ? (
                <div className="export-menu export-menu--with-filters" role="menu">
                  <div className="export-menu-actions">
                    <button
                      type="button"
                      className="export-option-btn"
                      role="menuitem"
                      title="Öğretmen tekli çıktısıyla aynı HTML tablo yapısı; ZIP içinde .html dosyaları"
                      onClick={handleExportFullProgramPdf}
                      disabled={exportPdfZipLoading}
                    >
                      {exportPdfZipLoading ? "ZIP hazırlanıyor..." : "Toplu program (ZIP)"}
                    </button>
                    <button
                      type="button"
                      className="export-option-btn export-option-btn--sub"
                      role="menuitem"
                      onClick={handleExportTeacherMatrixHtml}
                    >
                      Öğretmen bazlı (gün × saat)
                    </button>
                    <button
                      type="button"
                      className="export-option-btn export-option-btn--sub"
                      role="menuitem"
                      onClick={handleExportGroupMatrixHtml}
                    >
                      Grup bazlı (gün × saat)
                    </button>
                    <button
                      type="button"
                      className="export-option-btn export-option-btn--sub"
                      role="menuitem"
                      onClick={handleExportStudentMatrixHtml}
                    >
                      Öğrenci Programı
                    </button>
                    <button
                      type="button"
                      className="export-option-btn"
                      role="menuitem"
                      onClick={handleExportCsv}
                    >
                      Düzenlenebilir Tablo (CSV)
                    </button>
                  </div>
                  <div className="export-menu-divider" />
                  <div className="export-filters">
                    <div className="export-filter-label">Aktarılacaklar</div>
                    <div className="export-filter-section">
                      <div className="export-filter-row">
                        <span className="export-filter-title">Günler</span>
                        <button type="button" className="export-filter-link" onClick={selectAllExportDays}>
                          Tümü
                        </button>
                        <button type="button" className="export-filter-link" onClick={selectNoExportDays}>
                          Hiçbiri
                        </button>
                      </div>
                      <div className="export-filter-checkboxes">
                        {DAYS.map((d) => (
                          <label key={d} className="export-filter-item">
                            <input
                              type="checkbox"
                              checked={exportSelectedDays.has(d)}
                              onChange={() => toggleExportDay(d)}
                            />
                            <span>{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="export-filter-section">
                      <div className="export-filter-row">
                        <span className="export-filter-title">Gruplar</span>
                        <button type="button" className="export-filter-link" onClick={selectAllExportGroups}>
                          Tümü
                        </button>
                        <button type="button" className="export-filter-link" onClick={selectNoExportGroups}>
                          Hiçbiri
                        </button>
                      </div>
                      <div className="export-filter-checkboxes">
                        {groupNames.map((g) => (
                          <label key={g} className="export-filter-item">
                            <input
                              type="checkbox"
                              checked={exportSelectedGroups.has(g)}
                              onChange={() => toggleExportGroup(g)}
                            />
                            <span>{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="export-filter-section">
                      <div className="export-filter-row">
                        <span className="export-filter-title">Öğretmenler</span>
                        <button type="button" className="export-filter-link" onClick={selectAllExportTeachers}>
                          Tümü
                        </button>
                        <button type="button" className="export-filter-link" onClick={selectNoExportTeachers}>
                          Hiçbiri
                        </button>
                      </div>
                      <div className="export-filter-checkboxes">
                        {allExportTeachers.map((t) => (
                          <label key={t} className="export-filter-item">
                            <input
                              type="checkbox"
                              checked={exportSelectedTeachers.has(t)}
                              onChange={() => toggleExportTeacher(t)}
                            />
                            <span>{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="export-filter-section export-filter-section--student">
                      <div className="export-filter-row">
                        <span className="export-filter-title">Öğrenciler (Öğrenci Programı için)</span>
                        <button type="button" className="export-filter-link" onClick={selectAllExportStudentClasses}>
                          Tüm sınıflar
                        </button>
                        <button type="button" className="export-filter-link" onClick={selectNoExportStudentClasses}>
                          Hiçbiri
                        </button>
                      </div>
                      <label className="export-filter-item export-filter-item--block">
                        <input
                          type="checkbox"
                          checked={exportStudentOnlyInProgram}
                          onChange={(e) => setExportStudentOnlyInProgram(e.target.checked)}
                        />
                        <span>Sadece programa kayıtlı öğrenciler</span>
                        {studentsInProgram.length > 0 ? (
                          <span className="export-filter-hint"> ({studentsInProgram.length} kişi)</span>
                        ) : null}
                      </label>
                      <div className="export-filter-sub">Sınıfa göre: tümü seçili = hepsi, bazıları = yalnız o sınıflar</div>
                      <div className="export-filter-checkboxes">
                        {studentClassOptions.map((cls) => (
                          <label key={cls} className="export-filter-item">
                            <input
                              type="checkbox"
                              checked={
                                exportSelectedStudentClasses.size === 0 ||
                                exportSelectedStudentClasses.has(cls)
                              }
                              onChange={() => toggleExportStudentClass(cls)}
                            />
                            <span>{cls}. Sınıf</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {tableViewMode === "gün" ? (
              <button
                type="button"
                className="clear-day-btn"
                onClick={handleClearCurrentDayTable}
                aria-label={`${currentDay} tablosunu temizle`}
              >
                Tabloyu Temizle
              </button>
            ) : null}
          </div>
        </div>

        {validationWarnings.length > 0 ? (
          <div className="warning-panel" role="status" aria-live="polite">
            <strong>Veri uyarıları</strong>
            {validationWarnings.map((warning) => (
              <div key={warning} className="warning-item">
                {warning}
              </div>
            ))}
          </div>
        ) : null}

        {!programHasContent ? (
          <p className="schedule-no-saved-program" role="status">
            Henüz program içeriği yok. Düzenleme modunda hücrelere ders atayarak başlayın; kayıtlar otomatik olarak hesabınıza yazılır.
          </p>
        ) : null}

        </div>
      </div>

      <div className="table-scroll">
        <div className="table-wrapper">
          {tableViewMode === "gün" ? (
            <>
              <h3 className="table-view-title">Günlük Ders Programı</h3>
              {groupsForTable.length === 0 ? (
                <p className="table-empty-msg">Tabloda satır göstermek için en az bir grup seçin.</p>
              ) : (
                <table className="schedule-table" ref={scheduleTableRef}>
                  <thead>
                    <tr>
                      <th className="group-column">Grup</th>
                      {timeSlots.map(({ slot, range }) => (
                        <th key={slot} className={isBreakSlot(slot) ? "schedule-col-break" : undefined}>
                          <div>{isBreakSlot(slot) ? slot : `${slot}. Ders`}</div>
                          <small>{range}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupsForTable.map((group) => (
                  <tr key={group}>
                    <td
                      className={`group-name ${
                        groupWeeklyLoadInfoByGroup[group]?.status === "complete"
                          ? "group-load-complete"
                          : groupWeeklyLoadInfoByGroup[group]?.status === "deficit"
                            ? "group-load-deficit"
                            : ""
                      }`.trim()}
                      title={groupWeeklyLoadInfoByGroup[group]?.title}
                    >
                      <span className="group-name-text">{group}</span>
                    </td>
                    {timeSlots.map(({ slot, range }) => {
                      const breakSlot = isBreakSlot(slot);
                      const cellKey = getCellKey(group, slot);
                      const hasConflict = Boolean(cellConflictReasons[cellKey]?.length);
                      const conflictTooltip = getCellConflictTooltip(cellKey);

                      return (
                        <td
                          key={cellKey}
                          title={conflictTooltip}
                          data-schedule-cell={breakSlot ? undefined : "1"}
                          data-group={breakSlot ? undefined : group}
                          data-slot={breakSlot ? undefined : slot}
                          onPointerDown={
                            breakSlot || !canEdit ? undefined : (ev) => handleScheduleCellPointerDown(ev, group, slot)
                          }
                          className={`${breakSlot ? "break-cell schedule-col-break" : ""} ${!breakSlot && isSelected(group, slot) ? "cell-is-selected" : ""} ${!breakSlot && hasConflict ? "cell-has-conflict" : ""}`.trim()}
                        >
                          {breakSlot ? (
                            <span className="break-label">ARA</span>
                          ) : (
                            <div className="cell-content">
                              {canEdit && assignments[cellKey] ? (
                                <button
                                  type="button"
                                  className="clear-cell-btn"
                                  onPointerDown={(event) => event.stopPropagation()}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleClearAssignmentForKey(cellKey, group, slot);
                                  }}
                                  aria-label={`${group} ${slot}. dersi sil`}
                                >
                                  x
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className={`cell-trigger ${isSelected(group, slot) ? "is-active-selection" : ""}`}
                                onClick={(e) => {
                                  if (!canEdit) return;
                                  handleCellClick(e, group, slot);
                                }}
                                aria-label={`${group} ${slot}. ders sec`}
                              >
                                {assignments[cellKey] ? (
                                  <>
                                    <span className="cell-main-line">{assignments[cellKey].lesson}</span>
                                    <span className="cell-sub-line">{assignments[cellKey].teacher}</span>
                                    {assignments[cellKey].classroom ? (
                                      <span className="cell-classroom-line">
                                        {assignments[cellKey].classroom}
                                      </span>
                                    ) : null}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
              )}
            </>
          ) : tableViewMode === "ögretmen" ? (
            <>
              <h3 className="table-view-title">
                {tableViewTeacher ? `${tableViewTeacher} - Haftalık Ders Programı` : "Öğretmen seçin"}
              </h3>
              {!tableViewTeacher ? (
                <p className="table-empty-msg">Öğretmen seçmek için yukarıdaki listeden bir öğretmen seçin.</p>
              ) : (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th className="group-column">Gün</th>
                      {timeSlots.map(({ slot, range }) => (
                        <th key={slot} className={isBreakSlot(slot) ? "schedule-col-break" : undefined}>
                          <div>{isBreakSlot(slot) ? slot : `${slot}. Ders`}</div>
                          <small>{range}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <td className="group-name">
                          <span className="group-name-text">{day}</span>
                        </td>
                        {timeSlots.map(({ slot }, slotIdx) => {
                          const custom = teacherViewEntries?.[tableViewTeacher]?.[day]?.[slot];
                          const hasCustomContent =
                            custom &&
                            (String(custom.lesson ?? "").trim() ||
                              String(custom.label ?? "").trim() ||
                              String(custom.classroom ?? "").trim());
                          const assignmentsList = !hasCustomContent
                            ? findAssignmentsForTeacher(assignmentsByDay, day, tableViewTeacher, slot)
                            : [];
                          const lessonFromGrid =
                            assignmentsList.length > 0
                              ? [...new Set(assignmentsList.map((a) => a.lesson).filter(Boolean))].sort((x, y) => (x || "").localeCompare(y || "", "tr")).join(", ")
                              : "";
                          const labelFromGrid =
                            assignmentsList.length > 0
                              ? [...new Set(assignmentsList.map((a) => a.group).filter(Boolean))].sort((x, y) => (x || "").localeCompare(y || "", "tr")).join(", ")
                              : "";
                          const label = (hasCustomContent ? String(custom?.label ?? "").trim() : "") || labelFromGrid;
                          const room =
                            (hasCustomContent ? String(custom?.classroom ?? "").trim() : "") ||
                            (assignmentsList[0]?.classroom ?? "");
                          const lesson = (hasCustomContent ? String(custom?.lesson ?? "").trim() : "") || lessonFromGrid;
                          const isSel =
                            selectedTeacherCell?.teacher === tableViewTeacher &&
                            selectedTeacherCell?.day === day &&
                            selectedTeacherCell?.slot === slot;
                          const isBreak = isBreakSlot(slot);
                          const displayLabel = label || (isBreak && !label && !room && !lesson ? "ARA" : "");
                          const hasContent = !!(label || room || lesson);
                          const hasNextSlot = slotIdx < timeSlots.length - 1;
                          return (
                            <td
                              key={slot}
                              className={`teacher-cell-wrap ${isBreak ? "break-cell schedule-col-break" : ""} ${!displayLabel && !room && !lesson ? "cell-empty" : ""} ${isSel ? "cell-is-selected" : ""}`}
                            >
                              <div className="teacher-cell-inner teacher-cell-inner--stack">
                                <button
                                  type="button"
                                  className={`cell-trigger ${isSel ? "is-active-selection" : ""}`}
                                  onClick={() => {
                                    if (!canEdit) return;
                                    handleTeacherCellClick(
                                      day,
                                      slot,
                                      selectedTeacherCell?.teacher === tableViewTeacher &&
                                        selectedTeacherCell?.day === day &&
                                        selectedTeacherCell?.slot === slot
                                    );
                                  }}
                                  aria-label={`${day} ${slot} — ${displayLabel || room ? `${displayLabel || "ARA"} ${room}` : "boş"}`}
                                >
                                  {displayLabel || room || lesson ? (
                                    <>
                                      {lesson ? <span className="cell-main-line">{lesson}</span> : null}
                                      {displayLabel ? <span className="cell-sub-line">{displayLabel || "ARA"}</span> : null}
                                      {room ? <span className="cell-classroom-line">{room}</span> : null}
                                    </>
                                  ) : (
                                    isBreak ? "ARA" : "-"
                                  )}
                                </button>
                                {canEdit && hasContent && hasNextSlot ? (
                                  <button
                                    type="button"
                                    className="teacher-cell-copy-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyToNextSlot(day, slotIdx, label, room, lesson);
                                    }}
                                    title="Sonraki derse aktar"
                                    aria-label="İçeriği sonraki derse aktar"
                                  >
                                    →
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <>
              <h3 className="table-view-title">
                {tableViewGroup ? `${tableViewGroup} - Haftalık Ders Programı` : "Grup seçin"}
              </h3>
              {!tableViewGroup ? (
                <p className="table-empty-msg">Grup seçmek için yukarıdaki listeden bir grup seçin.</p>
              ) : (
                <table className="schedule-table schedule-table--readonly">
                  <thead>
                    <tr>
                      <th className="group-column">Gün</th>
                      {timeSlots.map(({ slot, range }) => (
                        <th key={slot} className={isBreakSlot(slot) ? "schedule-col-break" : undefined}>
                          <div>{isBreakSlot(slot) ? slot : `${slot}. Ders`}</div>
                          <small>{range}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => {
                      const dayAssignments = assignmentsByDay?.[day] ?? {};
                      return (
                        <tr key={day}>
                          <td className="group-name">
                            <span className="group-name-text">{day}</span>
                          </td>
                          {timeSlots.map(({ slot }) => {
                            const cellKey = getCellKey(tableViewGroup, slot);
                            const a = dayAssignments[cellKey];
                            if (isBreakSlot(slot)) {
                              if (a?.lesson) {
                                return (
                                  <td key={slot} className="schedule-col-break">
                                    <div className="cell-content cell-content--readonly">
                                      <span className="cell-main-line">{a.lesson}</span>
                                      <span className="cell-sub-line">{a.teacher ?? ""}</span>
                                      {a.classroom ? (
                                        <span className="cell-classroom-line">{a.classroom}</span>
                                      ) : null}
                                    </div>
                                  </td>
                                );
                              }
                              return (
                                <td key={slot} className="break-cell schedule-col-break">
                                  <span className="break-label">ARA</span>
                                </td>
                              );
                            }
                            if (!a?.lesson) {
                              return <td key={slot} className="cell-empty">—</td>;
                            }
                            return (
                              <td key={slot}>
                                <div className="cell-content cell-content--readonly">
                                  <span className="cell-main-line">{a.lesson}</span>
                                  <span className="cell-sub-line">{a.teacher ?? ""}</span>
                                  {a.classroom ? (
                                    <span className="cell-classroom-line">{a.classroom}</span>
                                  ) : null}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      <div className="schedule-fixed-bottom">
      {canEdit && (tableViewMode === "gün" || tableViewMode === "ögretmen") ? (
      <div className="schedule-bottom-panel" role="region" aria-label="Atama paneli">
        <div className="schedule-bottom-panel-inner">
          {tableViewMode === "ögretmen" ? (
            <>
              <h4 className="bottom-panel-title">Öğretmen Programı — Hücre Düzenle</h4>
              {selectedTeacherCell ? (
                <>
                  <p className="bottom-panel-meta">
                    <strong>{selectedTeacherCell.teacher}</strong> · {selectedTeacherCell.day} ·{" "}
                    {isBreakSlot(selectedTeacherCell.slot)
                      ? selectedTeacherCell.slot
                      : `${selectedTeacherCell.slot}. Ders`}
                  </p>
                  <div className="bottom-panel-row bottom-panel-row--teacher-cell">
                    <div className="bottom-panel-label-col">
                      <label htmlFor="teacher-cell-lesson" className="bottom-panel-label">
                        Ders
                      </label>
                      <input
                        id="teacher-cell-lesson"
                        type="text"
                        className="teacher-cell-input"
                        value={pendingTeacherCellLesson}
                        onChange={(e) => setPendingTeacherCellLesson(e.target.value)}
                        placeholder="Örn: Matematik, Soru Çözümü"
                      />
                    </div>
                    <div className="bottom-panel-label-col teacher-cell-label-wrap">
                      <label htmlFor="teacher-cell-label" className="bottom-panel-label">
                        Grup / Öğrenci
                      </label>
                      <div className="teacher-cell-label-row">
                        <input
                          id="teacher-cell-label"
                          type="text"
                          className="teacher-cell-input"
                          list="teacher-cell-student-datalist"
                          value={pendingTeacherCellLabel}
                          onChange={(e) => setPendingTeacherCellLabel(e.target.value)}
                          placeholder="Örn: 5A, ECE GÖRGÜ, vb."
                        />
                        <div className="student-picker-wrap" ref={studentPickerRef}>
                          <button
                            type="button"
                            className="student-picker-btn"
                            onClick={() => setStudentPickerOpen((v) => !v)}
                            title="Öğrenci listesinden seç"
                          >
                            Öğrenci
                          </button>
                          {studentPickerOpen ? (
                            <div className="student-picker-popover">
                              <input
                                type="text"
                                className="student-picker-search"
                                placeholder="Öğrenci ara..."
                                value={studentPickerQuery}
                                onChange={(e) => setStudentPickerQuery(e.target.value)}
                                autoFocus
                              />
                              <div className="student-picker-list">
                                {studentPickerFiltered.slice(0, 80).map((s) => (
                                  <button
                                    key={s.adSoyad}
                                    type="button"
                                    className="student-picker-item"
                                    onClick={() => {
                                      setPendingTeacherCellLabel(s.adSoyad);
                                      setStudentPickerOpen(false);
                                      setStudentPickerQuery("");
                                    }}
                                  >
                                    {s.adSoyad}
                                    {s.sınıf ? (
                                      <span className="student-picker-item-class"> ({s.sınıf})</span>
                                    ) : null}
                                  </button>
                                ))}
                                {studentPickerFiltered.length > 80 ? (
                                  <div className="student-picker-more">
                                    +{studentPickerFiltered.length - 80} daha, arama ile daraltın
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <datalist id="teacher-cell-student-datalist">
                          {studentsList.map((s) => (
                            <option key={s.adSoyad} value={s.adSoyad} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div className="bottom-panel-label-col">
                      <label htmlFor="teacher-cell-classroom" className="bottom-panel-label">
                        Derslik
                      </label>
                      <select
                        id="teacher-cell-classroom"
                        className="classroom-select classroom-select--narrow"
                        value={pendingTeacherCellClassroom}
                        onChange={(e) => setPendingTeacherCellClassroom(e.target.value)}
                      >
                        <option value="">—</option>
                        {classrooms.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bottom-panel-label-col bottom-panel-label-col--actions">
                      <button
                        type="button"
                        className="ai-generate-btn"
                        onClick={() => {
                          if (!selectedTeacherCell) return;
                          const { teacher, day, slot } = selectedTeacherCell;
                          const label = pendingTeacherCellLabel.trim();
                          const classroom = pendingTeacherCellClassroom || "";
                          const lesson = pendingTeacherCellLesson.trim();
                          setTeacherViewEntries((prev) => {
                            const next = { ...prev };
                            if (!next[teacher]) next[teacher] = {};
                            next[teacher] = { ...next[teacher] };
                            if (!next[teacher][day]) next[teacher][day] = {};
                            next[teacher][day] = { ...next[teacher][day] };
                            if (!label && !classroom && !lesson) {
                              const { [slot]: _, ...rest } = next[teacher][day];
                              next[teacher][day] = rest;
                              if (Object.keys(next[teacher][day]).length === 0) {
                                const { [day]: __, ...dayRest } = next[teacher];
                                next[teacher] = dayRest;
                              }
                              if (Object.keys(next[teacher]).length === 0) {
                                const { [teacher]: ___, ...tRest } = next;
                                return tRest;
                              }
                            } else {
                              next[teacher][day][slot] = { label, classroom, lesson };
                            }
                            return next;
                          });
                        }}
                      >
                        Tamamla
                      </button>
                      <button
                        type="button"
                        className="clear-day-btn"
                        onClick={() => setSelectedTeacherCell(null)}
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="bottom-panel-empty">
                  Düzenlemek için tabloda bir hücreye tıklayın. Hücrede metin ve derslik girin.
                </p>
              )}
            </>
          ) : (
            <>
          <h4 className="bottom-panel-title">Ders Seçimi:</h4>
          <p className="bottom-panel-hint">
            Çoklu seçim: hücrede sol tuşa basılı tutup sürükleyerek dikdörtgen alan seçebilirsiniz.
          </p>
          {selectedCells.length === 0 ? (
            <p className="bottom-panel-empty">
              Hücre seçin; çoklu seçim için farklı hücrelere sırayla tıklayın. Seçimi kaldırmak için aynı hücreye
              tekrar tıklayın.
            </p>
          ) : selectionHasNoCommonLessons ? (
            <p className="bottom-panel-empty">
              Seçili grupların müfredatında ortak ders yok; farklı gruplardan çoklu seçim yalnızca tüm gruplarda
              bulunan dersler için kullanılabilir.
            </p>
          ) : (
            <>
              <p className="bottom-panel-meta">
                <strong>{uniqueGroupsInSelection.join(" · ")}</strong> · {currentDay}
                {selectedSlotsLabel ? (
                  <>
                    {" "}
                    · {selectedSlotsLabel}
                  </>
                ) : null}
              </p>
              {selectionIsAllAssignmentEdit ? (
                <p className="bottom-panel-edit-banner" role="status">
                  <strong>Düzenleme modu:</strong> Öğretmen ve derslik güncellenir. Ders değiştirmek için seçimi
                  temizleyip yalnızca boş hücreleri seçin.
                </p>
              ) : null}

              <div className="bottom-panel-row bottom-panel-row--derslik-ders">
                <div className="bottom-panel-derslik-col">
                  <span className="bottom-panel-label">Derslik (isteğe bağlı)</span>
                  {commonClassroomsForSelection.length > 0 ? (
                    <select
                      className="classroom-select classroom-select--narrow"
                      title="Dolu hücrelerde derslik değişince hemen kaydedilir"
                      value={pendingClassroom}
                      onChange={(e) => handleClassroomChange(e.target.value)}
                    >
                      <option value="">—</option>
                      {commonClassroomsForSelection.map((c) => {
                        const conflict = isClassroomOptionBlocked(c);
                        return (
                            <option key={c} value={c} disabled={conflict}>
                            {conflict ? `${c} (dolu)` : c}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <span className="bottom-panel-note">Derslik tanımı yok</span>
                  )}
                </div>
                <div className="bottom-panel-ders-col">
                  <span className="bottom-panel-label">Ders</span>
                  <div className="lesson-list lesson-list--panel">
                    {commonLessons.map((lesson) => {
                    const uniqGroups = uniqueGroupsInSelection;
                    const isOptionalLesson =
                      uniqGroups.length > 0 &&
                      uniqGroups.every((g) => (optionalLessonsByGroup[g] ?? []).includes(lesson));
                    const remainingMin = Math.min(
                      ...uniqGroups.map((g) => {
                        const maxLoad = requiredLessonLoadByGroup[g]?.[lesson] ?? 0;
                        const used = lessonUsageByGroupWeekly[g]?.[lesson] ?? 0;
                        return Math.max(maxLoad - used, 0);
                      })
                    );
                    const isFull =
                      !isLessonConflictExempt(lesson) &&
                      uniqGroups.some((g) => {
                        const isOpt = (optionalLessonsByGroup[g] ?? []).includes(lesson);
                        const maxLoad = requiredLessonLoadByGroup[g]?.[lesson] ?? 0;
                        const used = lessonUsageByGroupWeekly[g]?.[lesson] ?? 0;
                        const hasCell = selectedCells
                          .filter((c) => c.group === g)
                          .some((c) => assignments[getCellKey(c.group, c.slot)]?.lesson === lesson);
                        return !isOpt && used >= maxLoad && !hasCell;
                      });
                    const lessonTeacherOptions = getTeacherOptionsForLesson({
                      selectionCells: selectedCells,
                      lesson,
                      classroom: pendingClassroom || "",
                      day: currentDay
                    });
                    const hasNoAvailableTeacher = isLessonConflictExempt(lesson)
                      ? false
                      : !lessonTeacherOptions.some((option) => option.canScheduleLesson);

                    return (
                      <button
                        key={lesson}
                        type="button"
                        className={`lesson-chip ${pendingLesson === lesson ? "is-active" : ""}`}
                        disabled={
                          isFull ||
                          hasNoAvailableTeacher ||
                          selectionIsAllAssignmentEdit
                        }
                        onClick={() => handleLessonSelect(lesson)}
                      >
                        {isOptionalLesson
                          ? `${lesson} (opsiyonel)`
                          : `${lesson} (${remainingMin})`}
                      </button>
                    );
                  })}
                  </div>
                </div>
              </div>

              <div className="bottom-panel-row bottom-panel-row--teacher-fixed">
                <span className="bottom-panel-label bottom-panel-label--teacher">Öğretmen</span>
                <div
                  className={`bottom-panel-teacher-area${
                    pendingLesson && isLessonConflictExempt(pendingLesson)
                      ? " bottom-panel-teacher-area--exempt"
                      : ""
                  }`}
                >
                  {!pendingLesson ? (
                    <p className="bottom-panel-placeholder">Önce yukarıdan ders seçin.</p>
                  ) : isLessonConflictExempt(pendingLesson) ? (
                    <div className="bottom-panel-exempt-row">
                      <input
                        type="text"
                        className="free-teacher-input free-teacher-input--inline"
                        value={freeTeacherName}
                        onChange={(e) => setFreeTeacherName(e.target.value)}
                        placeholder="Öğretmen adı (elle)"
                      />
                      <div
                        className="free-teacher-picker-wrap"
                        ref={freeTeacherPickerWrapRef}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="free-teacher-select-btn"
                          aria-expanded={freeTeacherPickerOpen}
                          aria-haspopup="listbox"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFreeTeacherPickerOpen((v) => !v);
                          }}
                        >
                          Öğretmen seç
                        </button>
                        {freeTeacherPickerOpen ? (
                          <div className="free-teacher-picker-popover" role="listbox" aria-label="Kayıtlı öğretmenler">
                            {allTeacherNamesSorted.map((name) => (
                              <button
                                key={name}
                                type="button"
                                role="option"
                                className="free-teacher-picker-item"
                                onClick={() => {
                                  setFreeTeacherName(name);
                                  setFreeTeacherPickerOpen(false);
                                }}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="ai-generate-btn"
                        onClick={() => applyAssignments("")}
                      >
                        Atamayı uygula
                      </button>
                    </div>
                  ) : (
                    <div className="teacher-list teacher-list--panel teacher-list--bubbles">
                      {teacherOptions.map(({ teacher, isSelectable, reason }) => (
                        <button
                          key={teacher.ad}
                          type="button"
                          className={`teacher-chip teacher-chip--bubble ${isSelectable ? "" : "is-disabled"}`}
                          title={reason}
                          aria-label={`${teacher.ad} — ${reason}`}
                          onClick={() => handleTeacherSelect(teacher.ad)}
                          disabled={!isSelectable}
                        >
                          {teacher.ad}
                        </button>
                      ))}
                      {teacherOptions.length === 0 ? (
                        <span className="empty-text">Bu ders için tanımlı öğretmen yok</span>
                      ) : teacherOptions.every((item) => !item.isSelectable) ? (
                        <span className="empty-text">Uygun ogretmen yok</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="bottom-panel-actions">
                <button type="button" className="clear-day-btn" onClick={clearSelection}>
                  Seçimi temizle
                </button>
              </div>
            </>
          )}
        </>
      )}
        </div>
      </div>
      ) : (
        <div className="schedule-bottom-placeholder" role="region" aria-label="Seçim alanı">
          <p className="schedule-bottom-placeholder-text">
            {!canEdit
              ? !allowScheduleEdit
                ? "Salt görüntüleme; dışa aktarma üst menüden."
                : tableViewMode === "gün" || tableViewMode === "ögretmen"
                  ? "Düzenleme ve seçim için üstteki «Düzenle» düğmesine basın."
                  : "Bu görünümde alt panel yok; gün veya öğretmen programına geçebilirsiniz."
              : tableViewMode === "grup"
                ? "Grup görünümünde alt atama paneli kullanılmaz; gün veya öğretmen programına geçin."
                : "\u00a0"}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
