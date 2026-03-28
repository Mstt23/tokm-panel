import React from "react";
import {
  downloadScheduleExportJsonFromBundle,
  parseImportJsonText,
  getLiveStorageDebugSnapshot,
  STORAGE_KEYS,
  buildExportBundleFromState,
} from "../../lib/scheduleStorageTransfer.js";

export default function ScheduleStorageTransferPanel({
  groupNames,
  onImportApplied,
  getScheduleSnapshot,
  programHasContent,
  debugSnapshot,
}) {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [statusType, setStatusType] = React.useState("info");
  const fileInputRef = React.useRef(null);

  function handleExport() {
    setStatus(null);
    try {
      if (typeof getScheduleSnapshot !== "function") {
        throw new Error("Dışa aktarma için anlık veri alınamadı.");
      }
      const snap = getScheduleSnapshot();
      const bundle = buildExportBundleFromState(snap.assignmentsByDay, snap.visibleGroups, snap.teacherViewEntries);
      downloadScheduleExportJsonFromBundle(bundle);
      setStatusType("success");
      setStatus("Yedek dosyası indirildi.");
    } catch (e) {
      setStatusType("error");
      setStatus(e instanceof Error ? e.message : "Dışa aktarma başarısız.");
    }
  }

  function handlePickFile() {
    setStatus(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseImportJsonText(text, groupNames);
      if (!result.ok) {
        setStatusType("error");
        setStatus(result.errors.join(" "));
        return;
      }
      try {
        onImportApplied({
          assignmentsByDay: result.assignmentsByDay,
          visibleGroups: result.visibleGroups,
          teacherViewEntries: result.teacherViewEntries,
        });
        setStatusType("success");
        setStatus("İçe aktarma tamamlandı; tablo güncellendi (Kaydet ile Supabase’e yazın).");
      } catch (e) {
        setStatusType("error");
        setStatus(e instanceof Error ? e.message : "Uygulama hatası.");
      }
    };
    reader.onerror = () => {
      setStatusType("error");
      setStatus("Dosya okunamadı.");
    };
    reader.readAsText(file, "UTF-8");
  }

  const debug = debugSnapshot ?? getLiveStorageDebugSnapshot({}, new Set(), {}, {});

  return (
    <div className="schedule-storage-panel-wrap">
      <button
        type="button"
        className="group-filter-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Program verisi
        <span className="group-filter-trigger-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div className="schedule-storage-popover" role="region" aria-label="Program verisi yedekleme">
          <p className="schedule-storage-hint">
            <strong>Not:</strong> Program ana verisi Supabase hesabınıza kaydedilir. JSON dışa/iça aktarma yedek veya
            taşıma içindir; dosyayı içe aktardıktan sonra değişiklikleri kalıcı yapmak için <strong>Kaydet</strong>{" "}
            kullanın.
          </p>

          {!programHasContent ? (
            <p className="schedule-storage-empty" role="status">
              Henüz tabloda kayıtlı ders / öğretmen görünümü yok.
            </p>
          ) : null}

          <div className="schedule-storage-actions">
            <button type="button" className="schedule-storage-btn" onClick={handleExport}>
              JSON dışa aktar
            </button>
            <button type="button" className="schedule-storage-btn schedule-storage-btn--secondary" onClick={handlePickFile}>
              JSON içe aktar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="schedule-storage-file-input"
              onChange={handleFileChange}
              aria-hidden="true"
            />
          </div>

          {status ? (
            <p
              className={
                statusType === "error"
                  ? "schedule-storage-msg schedule-storage-msg--error"
                  : statusType === "success"
                    ? "schedule-storage-msg schedule-storage-msg--ok"
                    : "schedule-storage-msg"
              }
              role="alert"
            >
              {status}
            </p>
          ) : null}

          <details className="schedule-storage-debug">
            <summary>Geliştirici (depolama özeti)</summary>
            <dl className="schedule-storage-debug-dl">
              <dt>Supabase program id</dt>
              <dd>
                <code>{debug.activeProgramId || "—"}</code>
              </dd>
              <dt>{STORAGE_KEYS.assignmentsByDay}</dt>
              <dd>
                <code>{debug.assignmentsKey}</code>
              </dd>
              <dt>Atama hücre sayısı</dt>
              <dd>{debug.assignmentCellCount}</dd>
              <dt>Görünür grup sayısı</dt>
              <dd>{debug.visibleGroupCount}</dd>
              <dt>Öğretmen görünümü (öğretmen sayısı)</dt>
              <dd>{debug.teacherViewTeacherCount}</dd>
            </dl>
            {debug.errors?.length > 0 ? (
              <ul className="schedule-storage-debug-errors">
                {debug.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
          </details>
        </div>
      ) : null}
    </div>
  );
}
