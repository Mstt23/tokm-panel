import AiProgrammerApp from './src/App.jsx';
import './src/styles.css';

export interface DersProgramiModuleProps {
  canEdit: boolean;
}

export default function DersProgramiModule({ canEdit }: DersProgramiModuleProps) {
  return (
    <div className="ai-programmer-embed">
      <AiProgrammerApp
        startOnSchedule
        showScheduleHeaderBack={false}
        allowScheduleEdit={canEdit}
      />
    </div>
  );
}
