
import React from 'react';

interface SessionBarProps {
  sessionName: string;
}

export const SessionBar: React.FC<SessionBarProps> = ({ sessionName }) => {
  return (
    <div className="flex-shrink-0 bg-[var(--bg-surface)] py-1 px-4 sm:px-6 text-center border-b border-[var(--border-color)] sticky top-[65px] sm:top-[81px] z-10">
      <p className="text-sm text-[var(--text-secondary)] font-medium truncate">
        {sessionName}
      </p>
    </div>
  );
};