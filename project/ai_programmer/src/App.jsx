import React from "react";
import ManualScheduleTable from "./components/manual/ScheduleTable.jsx";
import "./styles.css";

/**
 * @param {{
 *   startOnSchedule?: boolean;
 *   showScheduleHeaderBack?: boolean;
 *   allowScheduleEdit?: boolean;
 * }} props
 */
export default function App({
  startOnSchedule = false,
  showScheduleHeaderBack = true,
  allowScheduleEdit = true,
  supabaseUserId = null,
} = {}) {
  const [screen, setScreen] = React.useState(startOnSchedule ? "schedule" : "home");
  const [scheduleMode, setScheduleMode] = React.useState("view");

  React.useEffect(() => {
    if (!allowScheduleEdit && scheduleMode === "edit") {
      setScheduleMode("view");
    }
  }, [allowScheduleEdit, scheduleMode]);

  if (screen === "home") {
    return (
      <main className="app app--home">
        <div className="home-screen">
          <h1 className="home-title">Ana Menü</h1>
          <p className="home-lead">Ders programı ve diğer işlemler için bir bölüm seçin.</p>
          <button
            type="button"
            className="home-primary-btn"
            onClick={() => {
              setScheduleMode("view");
              setScreen("schedule");
            }}
          >
            Ders Programı Hazırlama
          </button>
        </div>
      </main>
    );
  }

  const effectiveEditMode = allowScheduleEdit && scheduleMode === "edit";

  return (
    <main className="app">
      <header className="app-header app-header--schedule">
        {showScheduleHeaderBack ? (
          <button type="button" className="btn-nav-home" onClick={() => setScreen("home")}>
            Ana Ekrana Git
          </button>
        ) : (
          <div className="btn-nav-home btn-nav-home--placeholder" aria-hidden="true" />
        )}
        <h1 className="app-title app-title--schedule">Ders Programı Hazırlama Modülü</h1>
        <div className="app-header-schedule-spacer" aria-hidden="true" />
      </header>

      <section className="app-branch-panel" aria-label="Ders programı ekranı">
        <ManualScheduleTable
          canEdit={effectiveEditMode}
          allowScheduleEdit={allowScheduleEdit}
          scheduleEditModeActive={scheduleMode === "edit"}
          onToggleScheduleEditMode={() =>
            setScheduleMode((m) => (m === "edit" ? "view" : "edit"))
          }
          supabaseUserId={supabaseUserId}
        />
      </section>
    </main>
  );
}
