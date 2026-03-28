import type { ComponentType } from 'react';
import AiProgrammerApp from './src/App.jsx';
import './src/styles.css';

type AiAppProps = {
  startOnSchedule?: boolean;
  showScheduleHeaderBack?: boolean;
  allowScheduleEdit?: boolean;
  supabaseUserId?: string | null;
};

const ScheduleApp = AiProgrammerApp as ComponentType<AiAppProps>;

export interface DersProgramiModuleProps {
  canEdit: boolean;
  /** Supabase auth kullanıcı id — ders programı kalıcı depolama için */
  supabaseUserId: string | null;
}

export default function DersProgramiModule({ canEdit, supabaseUserId }: DersProgramiModuleProps) {
  return (
    <div className="ai-programmer-embed">
      <ScheduleApp
        startOnSchedule
        showScheduleHeaderBack={false}
        allowScheduleEdit={canEdit}
        supabaseUserId={supabaseUserId}
      />
    </div>
  );
}
