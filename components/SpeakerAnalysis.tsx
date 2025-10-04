import React from 'react';
import { Session } from '../types';
import { t, Language } from '../utils/translations';

export const SpeakerAnalysis: React.FC<{ session: Session }> = ({ session }) => {
    const lang = session.settings.language as Language;

    const analysis = React.useMemo(() => {
        const transcriptionMessages = session.messages.filter(m => m.timestamp !== -1 && (m.sender === 'user' || m.sender === 'interlocutor'));
        
        let userWords = 0;
        let interlocutorWords = 0;

        transcriptionMessages.forEach(msg => {
            const wordCount = msg.text.split(/\s+/).filter(Boolean).length;
            if (msg.sender === 'user') {
                userWords += wordCount;
            } else {
                interlocutorWords += wordCount;
            }
        });

        const totalWords = userWords + interlocutorWords;
        const userPercentage = totalWords > 0 ? (userWords / totalWords) * 100 : 0;
        const interlocutorPercentage = totalWords > 0 ? (interlocutorWords / totalWords) * 100 : 0;
        
        return { userWords, interlocutorWords, totalWords, userPercentage, interlocutorPercentage };
    }, [session.messages]);

    if (analysis.totalWords === 0) {
        return <div className="p-4 text-center text-sm text-slate-500">{t('noTranscriptionForAnalysis', lang)}</div>;
    }

    const radius = 38;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const userDashoffset = circumference * (1 - analysis.userPercentage / 100);

    return (
        <div className="p-4 space-y-6">
            <h3 className="font-semibold text-slate-200">{t('speakerContribution', lang)}</h3>
            <div className="relative w-40 h-40 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--bg-element)" strokeWidth={strokeWidth} />
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="var(--text-secondary)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={0}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                    />
                    {analysis.userPercentage > 0 && (
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="var(--accent-primary)"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={userDashoffset}
                            transform="rotate(-90 50 50)"
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                        />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold">{analysis.totalWords}</span>
                    <span className="text-xs text-slate-400">{t('totalWords', lang)}</span>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]"></div>
                        <span>{t('you', lang)}</span>
                    </div>
                    <div className="text-right">
                        <span className="font-semibold">{analysis.userPercentage.toFixed(0)}%</span>
                        <p className="text-xs text-slate-400">{analysis.userWords} {t('wordCount', lang)}</p>
                    </div>
                </div>
                 <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[var(--text-secondary)]"></div>
                        <span>{t('speaker', lang)}</span>
                    </div>
                    <div className="text-right">
                        <span className="font-semibold">{analysis.interlocutorPercentage.toFixed(0)}%</span>
                        <p className="text-xs text-slate-400">{analysis.interlocutorWords} {t('wordCount', lang)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};