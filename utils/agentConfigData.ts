import { AIAgentExpertiseItem, AIAgentDomainItem } from '../types';

export const allExpertise: AIAgentExpertiseItem[] = [
  // Business & Strategy
  { id: 'business_analyst', nameKey: 'agentBusiness_analyst', category: 'categoryBusiness', relatedDomains: ['business_management', 'finance', 'technology', 'marketing_sales'] },
  { id: 'financial_advisor', nameKey: 'agentFinancial_advisor', category: 'categoryBusiness', relatedDomains: ['finance', 'business_management'] },
  { id: 'marketing_analyst', nameKey: 'agentMarketing_analyst', category: 'categoryBusiness', relatedDomains: ['marketing_sales', 'business_management', 'data_science'] },
  { id: 'product_manager', nameKey: 'agentProduct_manager', category: 'categoryBusiness', relatedDomains: ['product_management', 'technology', 'ux_ui_design', 'marketing_sales'] },
  { id: 'project_manager', nameKey: 'agentProject_manager', category: 'categoryBusiness', relatedDomains: ['business_management', 'technology', 'general'] },
  { id: 'strategist', nameKey: 'agentStrategist', category: 'categoryBusiness', relatedDomains: ['strategic_planning', 'business_management', 'finance', 'marketing_sales'] },
  // Tech & Data
  { id: 'data_scientist', nameKey: 'agentData_scientist', category: 'categoryTech', relatedDomains: ['data_science', 'technology', 'finance', 'science'] },
  { id: 'software_developer', nameKey: 'agentSoftware_developer', category: 'categoryTech', relatedDomains: ['software_development', 'technology'] },
  { id: 'tech_support', nameKey: 'agentTech_support', category: 'categoryTech', relatedDomains: ['technology', 'customer_service', 'software_development'] },
  { id: 'ux_researcher', nameKey: 'agentUx_researcher', category: 'categoryTech', relatedDomains: ['ux_ui_design', 'product_management', 'technology'] },
  // Communication & Creative
  { id: 'editor', nameKey: 'agentEditor', category: 'categoryCreative', relatedDomains: ['journalism', 'art_culture', 'marketing_sales'] },
  { id: 'pr_specialist', nameKey: 'agentPr_specialist', category: 'categoryCreative', relatedDomains: ['public_relations', 'marketing_sales', 'journalism'] },
  { id: 'reporter', nameKey: 'agentReporter', category: 'categoryCreative', relatedDomains: ['journalism', 'general'] },
  { id: 'screenwriter', nameKey: 'agentScreenwriter', category: 'categoryCreative', relatedDomains: ['filmmaking', 'art_culture'] },
  { id: 'speechwriter', nameKey: 'agentSpeechwriter', category: 'categoryCreative', relatedDomains: ['public_relations', 'general'] },
  { id: 'translator', nameKey: 'agentTranslator', category: 'categoryCreative', relatedDomains: ['general', 'art_culture', 'law'] },
  // Research & Education
  // FIX: The domain 'sociology' is not a valid AIAgentDomain. Replaced with 'psychology' which is a valid and related domain.
  { id: 'academic_researcher', nameKey: 'agentAcademic_researcher', category: 'categoryResearch', relatedDomains: ['science', 'education', 'healthcare', 'psychology'] },
  { id: 'course_developer', nameKey: 'agentCourse_developer', category: 'categoryResearch', relatedDomains: ['education', 'career_development'] },
  { id: 'sociologist', nameKey: 'agentSociologist', category: 'categoryResearch', relatedDomains: ['science', 'psychology'] },
  { id: 'tutor', nameKey: 'agentTutor', category: 'categoryResearch', relatedDomains: ['education', 'general'] },
  // People & HR
  { id: 'coach', nameKey: 'agentCoach', category: 'categoryPeople', relatedDomains: ['career_development', 'business_management', 'psychology'] },
  { id: 'customer_manager', nameKey: 'agentCustomer_manager', category: 'categoryPeople', relatedDomains: ['customer_service', 'marketing_sales'] },
  { id: 'interviewer', nameKey: 'agentInterviewer', category: 'categoryPeople', relatedDomains: ['human_resources', 'journalism', 'general'] },
  { id: 'psychologist', nameKey: 'agentPsychologist', category: 'categoryPeople', relatedDomains: ['psychology', 'healthcare'] },
  { id: 'recruiter', nameKey: 'agentRecruiter', category: 'categoryPeople', relatedDomains: ['human_resources', 'career_development'] },
  { id: 'therapist', nameKey: 'agentTherapist', category: 'categoryPeople', relatedDomains: ['psychology', 'healthcare'] },
  // Specialized
  { id: 'chef_nutritionist', nameKey: 'agentChef_nutritionist', category: 'categorySpecialized', relatedDomains: ['cooking_nutrition', 'healthcare'] },
  { id: 'detective', nameKey: 'agentDetective', category: 'categorySpecialized', relatedDomains: ['law', 'general'] },
  { id: 'legal_assistant', nameKey: 'agentLegal_assistant', category: 'categorySpecialized', relatedDomains: ['law', 'litigation', 'constitutional_law'] },
];

export const allDomains: AIAgentDomainItem[] = [
  // Business
  { id: 'business_management', nameKey: 'domainBusiness_management', category: 'categoryBusiness', relatedExpertise: ['project_manager', 'business_analyst', 'strategist', 'product_manager'] },
  { id: 'finance', nameKey: 'domainFinance', category: 'categoryBusiness', relatedExpertise: ['financial_advisor', 'business_analyst', 'strategist'] },
  { id: 'human_resources', nameKey: 'domainHuman_resources', category: 'categoryBusiness', relatedExpertise: ['recruiter', 'interviewer', 'coach'] },
  { id: 'marketing_sales', nameKey: 'domainMarketing_sales', category: 'categoryBusiness', relatedExpertise: ['marketing_analyst', 'pr_specialist', 'customer_manager'] },
  { id: 'product_management', nameKey: 'domainProduct_management', category: 'categoryBusiness', relatedExpertise: ['product_manager', 'ux_researcher', 'software_developer', 'marketing_analyst'] },
  { id: 'strategic_planning', nameKey: 'domainStrategic_planning', category: 'categoryBusiness', relatedExpertise: ['strategist', 'business_analyst', 'product_manager'] },
  // Tech
  { id: 'data_science', nameKey: 'domainData_science', category: 'categoryTech', relatedExpertise: ['data_scientist', 'academic_researcher'] },
  { id: 'software_development', nameKey: 'domainSoftware_development', category: 'categoryTech', relatedExpertise: ['software_developer', 'tech_support', 'product_manager'] },
  { id: 'technology', nameKey: 'domainTechnology', category: 'categoryTech', relatedExpertise: ['software_developer', 'tech_support', 'data_scientist', 'ux_researcher'] },
  { id: 'ux_ui_design', nameKey: 'domainUx_ui_design', category: 'categoryTech', relatedExpertise: ['ux_researcher', 'product_manager'] },
  // Creative
  { id: 'art_culture', nameKey: 'domainArt_culture', category: 'categoryCreative', relatedExpertise: ['screenwriter', 'editor', 'reporter'] },
  { id: 'filmmaking', nameKey: 'domainFilmmaking', category: 'categoryCreative', relatedExpertise: ['screenwriter'] },
  { id: 'journalism', nameKey: 'domainJournalism', category: 'categoryCreative', relatedExpertise: ['reporter', 'editor', 'speechwriter'] },
  { id: 'public_relations', nameKey: 'domainPublic_relations', category: 'categoryCreative', relatedExpertise: ['pr_specialist', 'speechwriter', 'marketing_analyst'] },
  // Science & Health
  { id: 'cooking_nutrition', nameKey: 'domainCooking_nutrition', category: 'categoryScienceHealth', relatedExpertise: ['chef_nutritionist'] },
  { id: 'healthcare', nameKey: 'domainHealthcare', category: 'categoryScienceHealth', relatedExpertise: ['therapist', 'psychologist', 'academic_researcher'] },
  { id: 'psychology', nameKey: 'domainPsychology', category: 'categoryScienceHealth', relatedExpertise: ['psychologist', 'therapist', 'sociologist', 'coach'] },
  { id: 'science', nameKey: 'domainScience', category: 'categoryScienceHealth', relatedExpertise: ['academic_researcher', 'sociologist', 'data_scientist'] },
  // Social & Legal
  { id: 'career_development', nameKey: 'domainCareer_development', category: 'categorySocialLegal', relatedExpertise: ['coach', 'recruiter', 'tutor'] },
  { id: 'customer_service', nameKey: 'domainCustomer_service', category: 'categorySocialLegal', relatedExpertise: ['customer_manager', 'tech_support'] },
  { id: 'education', nameKey: 'domainEducation', category: 'categorySocialLegal', relatedExpertise: ['course_developer', 'tutor', 'academic_researcher'] },
  { id: 'law', nameKey: 'domainLaw', category: 'categorySocialLegal', relatedExpertise: ['legal_assistant', 'detective', 'reporter'] },
  { id: 'constitutional_law', nameKey: 'domainConstitutional_law', category: 'categorySocialLegal', relatedExpertise: ['legal_assistant'] },
  { id: 'litigation', nameKey: 'domainLitigation', category: 'categorySocialLegal', relatedExpertise: ['legal_assistant', 'detective'] },
  // General
  { id: 'general', nameKey: 'domainGeneral', category: 'categoryGeneral', relatedExpertise: [] },
];