import { AiChatbot } from '../pages/AiChatbot';
import { Analytics } from '../pages/Analytics';
import { Aptitude } from '../pages/Aptitude';
import { Dashboard } from '../pages/Dashboard';
import { DsaPractice } from '../pages/DsaPractice';
import { MockInterview } from '../pages/MockInterview';
import { Profile } from '../pages/Profile';
import { ResumeAnalyzer } from '../pages/ResumeAnalyzer';
import { SqlPractice } from '../pages/SqlPractice';

export type AppRoute = {
  path: string;
  label: string;
  element: () => JSX.Element;
};

export const appRoutes: AppRoute[] = [
  { path: '/dashboard', label: 'Dashboard', element: Dashboard },
  { path: '/dsa-practice', label: 'DSA Practice', element: DsaPractice },
  { path: '/sql-practice', label: 'SQL Practice', element: SqlPractice },
  { path: '/aptitude', label: 'Aptitude', element: Aptitude },
  { path: '/resume-analyzer', label: 'Resume Analyzer', element: ResumeAnalyzer },
  { path: '/mock-interview', label: 'Mock Interview', element: MockInterview },
  { path: '/ai-chatbot', label: 'AI Chatbot', element: AiChatbot },
  { path: '/analytics', label: 'Analytics', element: Analytics },
  { path: '/profile', label: 'Profile', element: Profile }
];
