import JSZip from "jszip";

const isBreakSlot = (slotName) => String(slotName).toLowerCase().includes("arası");

const escapeCsvValue = (value) => {
  const s = value === null || value === undefined ? "" : String(value);
  // CSV escaping: wrap in quotes if it contains commas, quotes or line breaks.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

function downloadTextFile({ filename, text, mimeType }) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadHtmlFile({ filename, html }) {
  downloadTextFile({
    filename,
    text: html,
    mimeType: "text/html;charset=utf-8"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function collectTeacherNamesFromAssignments(assignmentsByDay) {
  const set = new Set();
  for (const day of Object.keys(assignmentsByDay ?? {})) {
    const dayMap = assignmentsByDay[day] ?? {};
    for (const a of Object.values(dayMap)) {
      if (a?.teacher) set.add(a.teacher);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

const MATRIX_PRINT_CSS = `
  body { font-family: Arial, sans-serif; margin: 16px; color: #111; }
  .sheet { margin-bottom: 36px; }
  .sheet-title { font-size: 20px; margin: 0 0 4px; }
  .sheet-sub { font-size: 13px; color: #64748b; margin: 0 0 12px; }
  table.matrix { border-collapse: collapse; width: 100%; font-size: 10px; table-layout: fixed; }
  .matrix th, .matrix td { border: 1px solid #334155; padding: 4px 4px; text-align: center; vertical-align: middle; word-wrap: break-word; }
  .matrix th { background: #e2e8f0; }
  .matrix td:first-child { font-weight: 600; background: #f8fafc; text-align: left; width: 56px; max-width: 64px; }
  .matrix th.matrix-slot-break, .matrix td.matrix-slot-break { width: 48px; max-width: 56px; padding: 3px 2px; }
  .matrix .hdr-small { font-size: 9px; font-weight: 400; color: #475569; }
  .matrix .cell-main { font-weight: 600; font-size: 10px; }
  .matrix .cell-sub { font-size: 9px; color: #475569; margin-top: 2px; }
  .matrix .cell-student-lesson { font-weight: 700; font-size: 10px; color: #0f172a; line-height: 1.25; }
  .matrix .cell-student-teacher { font-size: 9px; font-weight: 500; color: #475569; margin-top: 3px; line-height: 1.2; }
  .matrix .cell-student-room { font-size: 8px; color: #64748b; margin-top: 2px; line-height: 1.2; }
  .matrix .cell-student-item + .cell-student-item { margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
  .matrix .break-cell { background: #f1f5f9; color: #94a3b8; }
  .page-break { page-break-after: always; break-after: page; height: 0; margin: 0; border: 0; }
  @media print {
    body { margin: 8px; }
    .page-break { page-break-after: always; }
  }
`;

function wrapMatrixHtmlDocument(pageTitle, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(pageTitle)}</title>
<style>${MATRIX_PRINT_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/** Satırlar gün veya grup adı; ilk sütun etiketi: "Gün" veya "Grup". */
function buildMatrixHeaderRowFirstColumnLabel(timeSlots, firstColLabel) {
  return [
    `<th>${escapeHtml(firstColLabel)}</th>`,
    ...timeSlots.map(({ slot, range }) => {
      const label = isBreakSlot(slot) ? escapeHtml(slot) : `${escapeHtml(slot)}. Ders`;
      const r = escapeHtml(range ?? "");
      const thCls = isBreakSlot(slot) ? ` class="matrix-slot-break"` : "";
      return `<th${thCls}><div>${label}</div><div class="hdr-small">${r}</div></th>`;
    })
  ].join("");
}

function buildTeacherMatrixSectionHtml(
  teacherName,
  days,
  timeSlots,
  assignmentsByDay,
  teacherViewEntries,
  headerRowHtml
) {
  const bodyRows = days
    .map((day) => {
      const cells = [
        `<td>${escapeHtml(day)}</td>`,
        ...timeSlots.map(({ slot }) => {
          const custom = teacherViewEntries?.[teacherName]?.[day]?.[slot];
          const hasCustomContent =
            custom &&
            (String(custom.lesson ?? "").trim() ||
              String(custom.label ?? "").trim() ||
              String(custom.classroom ?? "").trim());
          if (hasCustomContent) {
            const lesson = escapeHtml(custom.lesson ?? "");
            const grp = escapeHtml(custom.label ?? "");
            const room = custom.classroom ? escapeHtml(custom.classroom) : "";
            const parts = [];
            if (lesson) parts.push(`<div class="cell-main">${lesson}</div>`);
            if (grp) parts.push(`<div class="cell-sub">${grp}</div>`);
            if (room) parts.push(`<div class="cell-sub">${room}</div>`);
            const tdCls = isBreakSlot(slot) ? ` class="matrix-slot-break"` : "";
            return `<td${tdCls}>${parts.join("")}</td>`;
          }
          const list = findAssignmentsForTeacher(assignmentsByDay, day, teacherName, slot);
          if (list.length > 0) {
            const lesson = escapeHtml(
              [...new Set(list.map((a) => a.lesson).filter(Boolean))].sort((x, y) => (x || "").localeCompare(y || "", "tr")).join(", ")
            );
            const grp = escapeHtml(
              [...new Set(list.map((a) => a.group).filter(Boolean))].sort((x, y) => (x || "").localeCompare(y || "", "tr")).join(", ")
            );
            const room = list[0]?.classroom ? escapeHtml(list[0].classroom) : "";
            const mainParts = [];
            if (lesson) mainParts.push(`<div class="cell-main">${lesson}</div>`);
            if (grp) mainParts.push(`<div class="cell-sub">${grp}</div>`);
            if (room) mainParts.push(`<div class="cell-sub">${room}</div>`);
            const tdCls = isBreakSlot(slot) ? ` class="matrix-slot-break"` : "";
            return `<td${tdCls}>${mainParts.join("")}</td>`;
          }
          if (isBreakSlot(slot)) {
            return `<td class="break-cell matrix-slot-break">—</td>`;
          }
          return "<td></td>";
        })
      ];
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `
      <section class="sheet">
        <h1 class="sheet-title">${escapeHtml(teacherName)}</h1>
        <p class="sheet-sub">Haftalık program (öğretmen bazlı)</p>
        <table class="matrix">
          <thead><tr>${headerRowHtml}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </section>`;
}

function buildGroupMatrixSectionHtml(group, days, timeSlots, assignmentsByDay, headerRowHtml) {
  const bodyRows = days
    .map((day) => {
      const cells = [
        `<td>${escapeHtml(day)}</td>`,
        ...timeSlots.map(({ slot }) => {
          const cellKey = `${group}-${slot}`;
          const a = assignmentsByDay?.[day]?.[cellKey];
          if (a?.lesson) {
            const lesson = escapeHtml(a.lesson ?? "");
            const teacher = escapeHtml(a.teacher ?? "");
            const room = a.classroom ? escapeHtml(a.classroom) : "";
            const parts = [];
            if (lesson) parts.push(`<div class="cell-main">${lesson}</div>`);
            if (teacher) parts.push(`<div class="cell-sub">${teacher}</div>`);
            if (room) parts.push(`<div class="cell-sub">${room}</div>`);
            const tdCls = isBreakSlot(slot) ? ` class="matrix-slot-break"` : "";
            return `<td${tdCls}>${parts.join("")}</td>`;
          }
          if (isBreakSlot(slot)) {
            return `<td class="break-cell matrix-slot-break">—</td>`;
          }
          return "<td></td>";
        })
      ];
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `
      <section class="sheet">
        <h1 class="sheet-title">${escapeHtml(group)}</h1>
        <p class="sheet-sub">Haftalık program (grup bazlı)</p>
        <table class="matrix">
          <thead><tr>${headerRowHtml}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </section>`;
}

/** Tek gün: satırlar gruplar, sütunlar saatler (toplu ZIP — Günler/ ile aynı mantık). */
function buildDayGroupMatrixSectionHtml(day, groupNames, timeSlots, assignmentsByDay) {
  const assignmentsByCell = assignmentsByDay?.[day] ?? {};
  const headerRowHtml = buildMatrixHeaderRowFirstColumnLabel(timeSlots, "Grup");
  const bodyRows = groupNames
    .map((group) => {
      const cells = [
        `<td>${escapeHtml(group)}</td>`,
        ...timeSlots.map(({ slot }) => {
          const cellKey = `${group}-${slot}`;
          const a = assignmentsByCell[cellKey];
          if (a?.lesson) {
            const lesson = escapeHtml(a.lesson ?? "");
            const teacher = escapeHtml(a.teacher ?? "");
            const room = a.classroom ? escapeHtml(a.classroom) : "";
            const parts = [];
            if (lesson) parts.push(`<div class="cell-main">${lesson}</div>`);
            if (teacher) parts.push(`<div class="cell-sub">${teacher}</div>`);
            if (room) parts.push(`<div class="cell-sub">${room}</div>`);
            const tdCls = isBreakSlot(slot) ? ` class="matrix-slot-break"` : "";
            return `<td${tdCls}>${parts.join("")}</td>`;
          }
          if (isBreakSlot(slot)) {
            return `<td class="break-cell matrix-slot-break">—</td>`;
          }
          return "<td></td>";
        })
      ];
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `
      <section class="sheet">
        <h1 class="sheet-title">${escapeHtml(day)}</h1>
        <p class="sheet-sub">Günlük ders programı (grup bazlı)</p>
        <table class="matrix">
          <thead><tr>${headerRowHtml}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </section>`;
}

/**
 * Öğretmen bazlı: başlıkta öğretmen adı; satırlar günler; sütunlar saatler; hücrede grup + derslik.
 * teacherViewEntries: öğretmen programında textbox ile eklenen veriler (opsiyonel).
 */
export function exportWeeklyTeacherMatrixHtml({
  fileName = "ogretmen-haftalik-program.html",
  days,
  timeSlots,
  assignmentsByDay,
  teacherViewEntries = {},
  teacherFilter = null
}) {
  const teachersFromAssignments = collectTeacherNamesFromAssignments(assignmentsByDay);
  const teachersFromCustom = Object.keys(teacherViewEntries ?? {});
  let teachers = [...new Set([...teachersFromAssignments, ...teachersFromCustom])].sort((a, b) =>
    a.localeCompare(b, "tr")
  );
  if (teacherFilter && teacherFilter.length > 0) {
    const filterSet = new Set(teacherFilter);
    teachers = teachers.filter((t) => filterSet.has(t));
  }
  if (teachers.length === 0) {
    window.alert("Haftalık programda atanmış öğretmen bulunamadı.");
    return;
  }

  const headerRow = buildMatrixHeaderRowFirstColumnLabel(timeSlots, "Gün");

  const sections = teachers
    .map((teacherName, idx) => {
      const section = buildTeacherMatrixSectionHtml(
        teacherName,
        days,
        timeSlots,
        assignmentsByDay,
        teacherViewEntries,
        headerRow
      );
      const pageBreak = idx < teachers.length - 1 ? '<hr class="page-break" />' : "";
      return `${section}\n${pageBreak}`;
    })
    .join("\n");

  const html = wrapMatrixHtmlDocument("Öğretmen haftalık program", sections);
  downloadHtmlFile({ filename: fileName, html });
}

/**
 * Grup bazlı: başlıkta grup adı; satırlar günler; sütunlar saatler; hücrede öğretmen + derslik.
 */
export function exportWeeklyGroupMatrixHtml({
  fileName = "grup-haftalik-program.html",
  groupNames,
  days,
  timeSlots,
  assignmentsByDay
}) {
  if (!groupNames?.length) {
    window.alert("Grup listesi boş.");
    return;
  }

  const headerRow = buildMatrixHeaderRowFirstColumnLabel(timeSlots, "Gün");

  const sections = groupNames
    .map((group, idx) => {
      const section = buildGroupMatrixSectionHtml(group, days, timeSlots, assignmentsByDay, headerRow);
      const pageBreak = idx < groupNames.length - 1 ? '<hr class="page-break" />' : "";
      return `${section}\n${pageBreak}`;
    })
    .join("\n");

  const html = wrapMatrixHtmlDocument("Grup haftalık program", sections);
  downloadHtmlFile({ filename: fileName, html });
}

/**
 * Öğrenci bazlı: başlıkta öğrenci adı; satırlar günler; sütunlar saatler; hücrede öğretmen + ders + derslik.
 * Veri teacherViewEntries'tan alınır (label = öğrenci adı).
 */
export function exportWeeklyStudentMatrixHtml({
  fileName = "ogrenci-haftalik-program.html",
  days,
  timeSlots,
  teacherViewEntries = {},
  students = [],
  studentClassFilter = null,
  onlyStudentsInProgram = false
}) {
  const studentNamesFromEntries = new Set();
  for (const teacher of Object.keys(teacherViewEntries ?? {})) {
    for (const day of Object.keys(teacherViewEntries[teacher] ?? {})) {
      for (const slot of Object.keys(teacherViewEntries[teacher][day] ?? {})) {
        const label = teacherViewEntries[teacher][day][slot]?.label ?? "";
        if (label && typeof label === "string" && label.trim()) {
          studentNamesFromEntries.add(label.trim());
        }
      }
    }
  }

  let studentsToExport = [...students];
  if (studentClassFilter && studentClassFilter.size > 0) {
    const classSet = studentClassFilter;
    studentsToExport = studentsToExport.filter((s) => {
      const cls = String(s.sınıf ?? s.sınıfı ?? "").trim();
      return classSet.has(cls);
    });
  }
  if (onlyStudentsInProgram) {
    studentsToExport = studentsToExport.filter((s) => {
      const name = (s.adSoyad ?? s["ad soyad"] ?? "").trim();
      return studentNamesFromEntries.has(name);
    });
  }

  if (studentsToExport.length === 0) {
    window.alert(
      onlyStudentsInProgram
        ? "Programda kayıtlı öğrenci bulunamadı."
        : "Dışa aktarılacak öğrenci seçilmedi veya listesi boş."
    );
    return;
  }

  const studentNames = studentsToExport.map((s) => (s.adSoyad ?? s["ad soyad"] ?? "").trim()).filter(Boolean);

  const getEntriesForStudent = (studentName) => {
    const result = [];
    for (const teacher of Object.keys(teacherViewEntries ?? {})) {
      for (const day of Object.keys(teacherViewEntries[teacher] ?? {})) {
        for (const slot of Object.keys(teacherViewEntries[teacher][day] ?? {})) {
          const entry = teacherViewEntries[teacher][day][slot];
          const label = (entry?.label ?? "").trim();
          if (label === studentName) {
            result.push({ teacher, day, slot, lesson: entry?.lesson ?? "", classroom: entry?.classroom ?? "" });
          }
        }
      }
    }
    return result;
  };

  const headerRow = buildMatrixHeaderRowFirstColumnLabel(timeSlots, "Gün");

  const sections = studentNames.map((studentName, idx) => {
    const entriesByDaySlot = {};
    for (const { day, slot, teacher, lesson, classroom } of getEntriesForStudent(studentName)) {
      const k = `${day}-${slot}`;
      if (!entriesByDaySlot[k]) entriesByDaySlot[k] = [];
      entriesByDaySlot[k].push({ teacher, lesson, classroom });
    }
    const bodyRows = days
      .map((day) => {
        const cells = [
          `<td>${escapeHtml(day)}</td>`,
          ...timeSlots.map(({ slot }) => {
            const k = `${day}-${slot}`;
            const items = entriesByDaySlot[k] ?? [];
            const blocks = items
              .map((it) => {
                const lesson = it.lesson ? escapeHtml(it.lesson) : "";
                const teacher = it.teacher ? escapeHtml(it.teacher) : "";
                const room = it.classroom ? escapeHtml(it.classroom) : "";
                const lines = [];
                if (lesson) lines.push(`<div class="cell-student-lesson">${lesson}</div>`);
                if (teacher) lines.push(`<div class="cell-student-teacher">${teacher}</div>`);
                if (room) lines.push(`<div class="cell-student-room">${room}</div>`);
                if (lines.length === 0) return "";
                return `<div class="cell-student-item">${lines.join("")}</div>`;
              })
              .filter(Boolean);
            if (blocks.length === 0) {
              if (isBreakSlot(slot)) return `<td class="break-cell matrix-slot-break">—</td>`;
              return "<td></td>";
            }
            const tdCls = isBreakSlot(slot) ? ` class="matrix-slot-break"` : "";
            return `<td${tdCls}>${blocks.join("")}</td>`;
          })
        ];
        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");
    const pageBreak = idx < studentNames.length - 1 ? '<hr class="page-break" />' : "";
    return `
      <section class="sheet">
        <h1 class="sheet-title">${escapeHtml(studentName)}</h1>
        <p class="sheet-sub">Haftalık program (öğrenci bazlı)</p>
        <table class="matrix">
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </section>
      ${pageBreak}`;
  });

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Öğrenci haftalık program</title>
<style>${MATRIX_PRINT_CSS}</style>
</head>
<body>
${sections}
</body>
</html>`;

  downloadHtmlFile({ filename: fileName, html });
}

function sanitizeFileName(name) {
  return String(name ?? "")
    .replace(/[/\\:*?"<>|]/g, "_")
    .trim() || "dosya";
}

/**
 * Toplu program: her gün, öğretmen ve grup için ayrı HTML (tekli öğretmen/grup çıktılarıyla aynı tablo ve CSS);
 * hepsi bir ZIP içinde. Yazdırma veya tarayıcıdan PDF olarak kaydetmek için uygundur.
 */
export async function exportFullWeeklySchedulePdfAsZip({
  zipFileName = "ders-programi.zip",
  days,
  groupNames,
  timeSlots,
  assignmentsByDay,
  teacherViewEntries = {},
  groupLoadInfoByGroup = {},
  teacherFilter = null
}) {
  void groupLoadInfoByGroup;
  if (!days?.length || !groupNames?.length) return;

  let teachers = [...new Set(collectTeacherNamesFromAssignments(assignmentsByDay).concat(Object.keys(teacherViewEntries ?? {})))].sort((a, b) =>
    a.localeCompare(b, "tr")
  );
  if (teacherFilter && teacherFilter.length > 0) {
    const set = new Set(teacherFilter);
    teachers = teachers.filter((t) => set.has(t));
  }

  const zip = new JSZip();
  const headerRowDaySlots = buildMatrixHeaderRowFirstColumnLabel(timeSlots, "Gün");

  for (const day of days) {
    const section = buildDayGroupMatrixSectionHtml(day, groupNames, timeSlots, assignmentsByDay);
    const html = wrapMatrixHtmlDocument(`${day} — günlük program`, section);
    zip.file(`Günler/${sanitizeFileName(day)}.html`, html);
  }

  for (const teacherName of teachers) {
    const section = buildTeacherMatrixSectionHtml(
      teacherName,
      days,
      timeSlots,
      assignmentsByDay,
      teacherViewEntries,
      headerRowDaySlots
    );
    const html = wrapMatrixHtmlDocument(`${teacherName} — haftalık program`, section);
    zip.file(`Öğretmenler/${sanitizeFileName(teacherName)}.html`, html);
  }

  for (const group of groupNames) {
    const section = buildGroupMatrixSectionHtml(group, days, timeSlots, assignmentsByDay, headerRowDaySlots);
    const html = wrapMatrixHtmlDocument(`${group} — haftalık program`, section);
    zip.file(`Gruplar/${sanitizeFileName(group)}.html`, html);
  }

  const zipBlob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/zip"
  });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFileName;
  a.setAttribute("type", "application/zip");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportScheduleAsCsv({
  fileName = "ders-programi.csv",
  days,
  groupNames,
  timeSlots,
  assignmentsByDay
}) {
  const header = ["Grup", "Gün", "Ders Saati", "Saat Aralığı", "Ders", "Öğretmen", "Derslik"];
  const rows = [header.map(escapeCsvValue).join(",")];

  for (const day of days) {
    for (const group of groupNames) {
      for (const { slot, range } of timeSlots) {
        const cellKey = `${group}-${slot}`;
        const assignment = assignmentsByDay?.[day]?.[cellKey];

        const timeLabel = isBreakSlot(slot) ? slot : `${slot}. Ders`;

        rows.push(
          [
            group,
            day,
            timeLabel,
            range ?? "",
            assignment?.lesson ?? "",
            assignment?.teacher ?? "",
            assignment?.classroom ?? ""
          ].map(escapeCsvValue).join(",")
        );
      }
    }
  }

  downloadTextFile({
    filename: fileName,
    text: rows.join("\n"),
    mimeType: "text/csv;charset=utf-8;"
  });
}

