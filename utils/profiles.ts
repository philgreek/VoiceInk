import { SessionProfile, StudioTool, SessionProfileId, StudioToolId, TextStyleId } from '../types';
import {
    AudioSummaryIcon, VideoSummaryIcon, MindMapIcon, ReportIcon, FlashcardsIcon, TestIcon,
    BookOpenIcon, ScaleIcon, HeartHandshakeIcon, StethoscopeIcon, LineChartIcon, BrushIcon, LanguagesIcon, EmotionAnalysisIcon, TonalityAnalysisIcon
} from '../components/icons';

export const textStyles: { id: TextStyleId, nameKey: keyof typeof import('./translations').translations.en }[] = [
    { id: 'scientific', nameKey: 'styleScientific' },
    { id: 'business', nameKey: 'styleOfficialBusiness' },
    { id: 'publicistic', nameKey: 'stylePublicistic' },
    { id: 'artistic', nameKey: 'styleArtistic' },
    { id: 'conversational', nameKey: 'styleConversational' },
];

export const studioTools: Record<StudioToolId, StudioTool> = {
    audioSummary: { id: 'audioSummary', nameKey: 'toolAudioSummary', descriptionKey: 'toolAudioSummaryDescription', icon: AudioSummaryIcon, category: 'analysis' },
    videoSummary: { id: 'videoSummary', nameKey: 'toolVideoSummary', descriptionKey: 'toolVideoSummaryDescription', icon: VideoSummaryIcon, category: 'analysis' },
    emotionAnalysis: { id: 'emotionAnalysis', nameKey: 'toolEmotionAnalysis', descriptionKey: 'toolEmotionAnalysisDescription', icon: EmotionAnalysisIcon, category: 'psychological' },
    tonalityAnalysis: { id: 'tonalityAnalysis', nameKey: 'toolTonalityAnalysis', descriptionKey: 'toolTonalityAnalysisDescription', icon: TonalityAnalysisIcon, category: 'psychological' },
    mindMap: { id: 'mindMap', nameKey: 'toolMindMap', descriptionKey: 'toolMindMapDescription', icon: MindMapIcon, category: 'structuring' },
    reports: { id: 'reports', nameKey: 'toolReports', descriptionKey: 'toolReportsDescription', icon: ReportIcon, category: 'structuring' },
    flashcards: { id: 'flashcards', nameKey: 'toolFlashcards', descriptionKey: 'toolFlashcardsDescription', icon: FlashcardsIcon, category: 'learning' },
    test: { id: 'test', nameKey: 'toolTest', descriptionKey: 'toolTestDescription', icon: TestIcon, category: 'learning' },
    caseBrief: { id: 'caseBrief', nameKey: 'toolCaseBrief', descriptionKey: 'toolCaseBriefDescription', icon: ReportIcon, category: 'legal' },
    contractAnalysis: { id: 'contractAnalysis', nameKey: 'toolContractAnalysis', descriptionKey: 'toolContractAnalysisDescription', icon: TestIcon, category: 'legal' },
    interviewSummary: { id: 'interviewSummary', nameKey: 'toolInterviewSummary', descriptionKey: 'toolInterviewSummaryDescription', icon: ReportIcon, category: 'hr' },
    candidateEval: { id: 'candidateEval', nameKey: 'toolCandidateEval', descriptionKey: 'toolCandidateEvalDescription', icon: TestIcon, category: 'hr' },
    marketAnalysis: { id: 'marketAnalysis', nameKey: 'toolMarketAnalysis', descriptionKey: 'toolMarketAnalysisDescription', icon: LineChartIcon, category: 'business' },
    financialReport: { id: 'financialReport', nameKey: 'toolFinancialReport', descriptionKey: 'toolFinancialReportDescription', icon: ReportIcon, category: 'business' },
    scriptAnalysis: { id: 'scriptAnalysis', nameKey: 'toolScriptAnalysis', descriptionKey: 'toolScriptAnalysisDescription', icon: VideoSummaryIcon, category: 'creative' },
    brainstorm: { id: 'brainstorm', nameKey: 'toolBrainstorm', descriptionKey: 'toolBrainstormDescription', icon: MindMapIcon, category: 'creative' },
    translation: { id: 'translation', nameKey: 'toolTranslation', descriptionKey: 'toolTranslationDescription', icon: LanguagesIcon, category: 'language' },
    grammarCheck: { id: 'grammarCheck', nameKey: 'toolGrammarCheck', descriptionKey: 'toolGrammarCheckDescription', icon: TestIcon, category: 'language' },
    textStyle: { id: 'textStyle', nameKey: 'toolTextStyle', descriptionKey: 'toolTextStyleDescription', icon: BrushIcon, category: 'editing', isConfigurable: true },
};

export const profiles: Record<SessionProfileId, SessionProfile> = {
    pedagogical: {
        id: 'pedagogical',
        nameKey: 'profilePedagogical',
        icon: BookOpenIcon,
        tools: ['test', 'flashcards', 'mindMap', 'audioSummary'],
        recommendedExpertise: ['course_developer', 'tutor', 'speechwriter', 'coach', 'academic_researcher'],
        recommendedDomains: ['education', 'science', 'psychology', 'career_development', 'art_culture']
    },
    legal: {
        id: 'legal',
        nameKey: 'profileLegal',
        icon: ScaleIcon,
        tools: ['caseBrief', 'contractAnalysis', 'audioSummary', 'reports'],
        recommendedExpertise: ['legal_assistant', 'detective', 'interviewer', 'speechwriter'],
        recommendedDomains: ['law', 'litigation', 'constitutional_law', 'finance']
    },
    hr: {
        id: 'hr',
        nameKey: 'profileHr',
        icon: HeartHandshakeIcon,
        tools: ['interviewSummary', 'candidateEval', 'reports', 'audioSummary'],
        recommendedExpertise: ['recruiter', 'coach', 'therapist', 'customer_manager'],
        recommendedDomains: ['human_resources', 'career_development', 'psychology', 'business_management']
    },
    medical: {
        id: 'medical',
        nameKey: 'profileMedical',
        icon: StethoscopeIcon,
        tools: ['audioSummary', 'reports', 'flashcards', 'test'],
        recommendedExpertise: ['therapist', 'psychologist', 'academic_researcher', 'chef_nutritionist'],
        recommendedDomains: ['healthcare', 'psychology', 'science', 'cooking_nutrition']
    },
    economic: {
        id: 'economic',
        nameKey: 'profileEconomic',
        icon: LineChartIcon,
        tools: ['financialReport', 'marketAnalysis', 'reports', 'audioSummary'],
        recommendedExpertise: ['financial_advisor', 'business_analyst', 'marketing_analyst', 'project_manager'],
        recommendedDomains: ['finance', 'business_management', 'marketing_sales', 'technology']
    },
    creative: {
        id: 'creative',
        nameKey: 'profileCreative',
        icon: BrushIcon,
        tools: ['brainstorm', 'scriptAnalysis', 'mindMap', 'audioSummary'],
        recommendedExpertise: ['screenwriter', 'reporter', 'editor', 'speechwriter', 'marketing_analyst'],
        recommendedDomains: ['art_culture', 'filmmaking', 'journalism', 'marketing_sales']
    },
    linguistic: {
        id: 'linguistic',
        nameKey: 'profileLinguistic',
        icon: LanguagesIcon,
        tools: ['translation', 'grammarCheck', 'audioSummary', 'flashcards'],
        recommendedExpertise: ['translator', 'editor', 'speechwriter', 'tutor'],
        recommendedDomains: ['education', 'journalism', 'art_culture', 'law']
    }
};