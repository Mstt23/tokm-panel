import React from "react";
import {
  downloadScheduleExportJson,
  parseImportJsonText,
  hasMeaningfulSavedProgram,
  getStorageDebugSnapshot,
  STORAGE_KEYS,
} from "../../lib/scheduleStorageTransfer.js";

export default function ScheduleStorageTransferPanel({ groupNames, onImportApplied }) {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [statusType, setStatusType] = React.useState("info");
  const fileInputRef = React.useRef(null);

  const [hasData, setHasData] = React.useState(() => hasMeaningfulSavedProgram());
  const [debug, setDebug] = React.useState(() => getStorageDebugSnapshot());

  const refreshLocal = React.useCallback(() => {
    setHasData(hasMeaningfulSavedProgram());
    setDebug(getStorageDebugSnapshot());
  }, []);

  React.useEffect(() => {
    if (!open) return;
    refreshLocal();
    const onStorage = (e) => {
      if (
        e.key === STORAGE_KEYS.assignmentsByDay ||
        e.key === STORAGE_KEYS.visibleGroups ||
        e.key === STORAGE_KEYS.teacherViewEntries
      ) {
        refreshLocal();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [open, refreshLocal]);

  function handleExport() {
    setStatus(null);
    try {
      downloadScheduleExportJson();
      setStatusType("success");
      setStatus("Yedek dosyası indirildi.");
      refreshLocal();
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
        setStatus("İçe aktarma tamamlandı; tablo güncellendi.");
        refreshLocal();
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
            <strong>Not:</strong> Localhost ve canlı site farklı <em>origin</em> olduğu için{" "}
            <code>localStorage</code> verileri otomatik ortak değildir. Taşımak için buradan JSON
            dışa/iça aktarın.
          </p>

          {!hasData ? (
            <p className="schedule-storage-empty" role="status">
              Bu tarayıcı için kayıtlı program bulunamadı (veya tablo boş).
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
                  : "schedule-storage-msg schedule-storage-msg--ok"
              }
              role="alert"
            >
              {status}
            </p>
          ) : null}

          <details className="schedule-storage-debug">
            <summary>Geliştirici (depolama özeti)</summary>
            <dl className="schedule-storage-debug-dl">
              <dt>assignmentsByDay key</dt>
              <dd>
                <code>{debug.assignmentsKey}</code>
              </dd>
              <dt>Atama hücre sayısı</dt>
              <dd>{debug.assignmentCellCount}</dd>
              <dt>Görünür grup sayısı</dt>
              <dd>{debug.visibleGroupCount}</dd>
              <dt>Öğretmen görünümü (öğretmen sayısı)</dt>
              <dd>{debug.teacherViewTeacherCount}</dd>
              <dt>Okuma</dt>
              <dd>
                assignments: {debug.readOk.assignments ? "evet" : "hayır"} · visibleGroups:{" "}
                {debug.readOk.visibleGroups ? "evet" : "hayır"} · teacherView:{" "}
                {debug.readOk.teacherView ? "evet" : "hayır"}
              </dd>
            </dl>
            {debug.errors.length > 0 ? (
              <ul className="schedule-storage-debug-errors">
                {debug.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
            <button type="button" className="schedule-storage-refresh-debug" onClick={refreshLocal}>
              Özeti yenile
            </button>
          </details>
        </div>
      ) : null}
    </div>
  );
}
