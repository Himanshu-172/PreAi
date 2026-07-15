import mongoose from 'mongoose';
import { ChatConversation } from '../models/ChatConversation.js';
import { MockInterview } from '../models/MockInterview.js';
import { Question, questionDifficulties, questionModules } from '../models/Question.js';
import { ResumeAnalysis } from '../models/ResumeAnalysis.js';
import { UserProgress } from '../models/UserProgress.js';

type PracticeModule = (typeof questionModules)[number];
type QuestionDifficulty = (typeof questionDifficulties)[number];

type ModuleCounts = Record<PracticeModule, number>;
type DifficultyCounts = Record<QuestionDifficulty, number>;

const emptyModuleCounts: ModuleCounts = {
  DSA: 0,
  SQL: 0,
  Aptitude: 0
};

const emptyDifficultyCounts: DifficultyCounts = {
  Easy: 0,
  Medium: 0,
  Hard: 0
};

function toObjectId(userId: string) {
  return new mongoose.Types.ObjectId(userId);
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function cloneModuleCounts() {
  return { ...emptyModuleCounts };
}

function cloneDifficultyCounts() {
  return { ...emptyDifficultyCounts };
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function getActivityTime(activity: { timestamp: string | null }) {
  return activity.timestamp ? new Date(activity.timestamp).getTime() : 0;
}

export async function getAnalytics(userId: string) {
  const userObjectId = toObjectId(userId);
  const [questions, progress, resumeAnalyses, mockInterviews, chatConversations] = await Promise.all([
    Question.find({}).select('module questionId title difficulty').lean(),
    UserProgress.find({ userId: userObjectId }).select('module questionId solved favorite notes solvedAt updatedAt createdAt').lean(),
    ResumeAnalysis.find({ userId: userObjectId })
      .select('fileName status analysis analyzedAt createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean(),
    MockInterview.find({ userId: userObjectId })
      .select('interviewType category difficulty status evaluation evaluationStatus startedAt completedAt createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean(),
    ChatConversation.find({ userId: userObjectId }).select('title messages createdAt updatedAt').sort({ updatedAt: -1 }).lean()
  ]);

  const totalByModule = cloneModuleCounts();
  const solvedByModule = cloneModuleCounts();
  const difficultyBreakdown = questionModules.reduce<Record<PracticeModule, DifficultyCounts>>(
    (breakdown, module) => ({
      ...breakdown,
      [module]: cloneDifficultyCounts()
    }),
    {} as Record<PracticeModule, DifficultyCounts>
  );
  const questionMap = new Map<string, (typeof questions)[number]>();

  questions.forEach((question) => {
    totalByModule[question.module] += 1;
    questionMap.set(`${question.module}:${question.questionId}`, question);
  });

  progress.forEach((item) => {
    if (item.solved) {
      solvedByModule[item.module] += 1;
      const question = questionMap.get(`${item.module}:${item.questionId}`);

      if (question) {
        difficultyBreakdown[item.module][question.difficulty] += 1;
      }
    }
  });

  const solvedOverall = Object.values(solvedByModule).reduce((total, value) => total + value, 0);
  const questionTotal = questions.length;
  const favoriteCount = progress.filter((item) => item.favorite).length;
  const completedResumeAnalyses = resumeAnalyses.filter((item) => item.analysis);
  const atsScores = completedResumeAnalyses
    .map((item) => item.analysis?.atsScore)
    .filter((score): score is number => typeof score === 'number');
  const completedInterviews = mockInterviews.filter((interview) => interview.status === 'completed');
  const evaluatedInterviews = mockInterviews.filter((interview) => interview.evaluation);
  const chatMessageCount = chatConversations.reduce((total, conversation) => total + conversation.messages.length, 0);

  const practiceActivity = progress
    .filter((item) => item.solved || item.favorite || item.notes)
    .map((item) => {
      const question = questionMap.get(`${item.module}:${item.questionId}`);
      return {
        type: item.solved ? 'practice_solved' : item.favorite ? 'favorite_added' : 'note_added',
        label: item.solved ? `${item.module} solved` : item.favorite ? `${item.module} favorite` : `${item.module} note`,
        detail: question?.title ?? `${item.module} question ${item.questionId}`,
        timestamp: serializeDate(item.updatedAt)
      };
    });
  const resumeActivity = resumeAnalyses.map((analysis) => ({
    type: 'resume_analysis',
    label: analysis.status === 'completed' ? 'Resume analyzed' : 'Resume uploaded',
    detail: analysis.fileName,
    timestamp: serializeDate(analysis.analyzedAt ?? analysis.updatedAt ?? analysis.createdAt)
  }));
  const interviewActivity = mockInterviews.map((interview) => ({
    type: 'mock_interview',
    label: interview.status === 'completed' ? 'Mock interview completed' : 'Mock interview started',
    detail: `${interview.interviewType} - ${interview.category}`,
    timestamp: serializeDate(interview.completedAt ?? interview.startedAt ?? interview.createdAt)
  }));
  const chatActivity = chatConversations.map((conversation) => ({
    type: 'chat_conversation',
    label: 'AI chat conversation',
    detail: conversation.title,
    timestamp: serializeDate(conversation.updatedAt ?? conversation.createdAt)
  }));
  const recentActivityTimeline = [...practiceActivity, ...resumeActivity, ...interviewActivity, ...chatActivity]
    .sort((left, right) => getActivityTime(right) - getActivityTime(left))
    .slice(0, 10);

  return {
    practice: {
      dsaSolved: solvedByModule.DSA,
      sqlSolved: solvedByModule.SQL,
      aptitudeSolved: solvedByModule.Aptitude,
      overallSolved: solvedOverall,
      remaining: Math.max(questionTotal - solvedOverall, 0),
      accuracy: percentage(solvedOverall, questionTotal),
      totalQuestions: questionTotal,
      totalsByModule: totalByModule,
      solvedByModule,
      difficultyBreakdown
    },
    resume: {
      totalAnalyses: resumeAnalyses.length,
      averageAtsScore: average(atsScores),
      bestAtsScore: atsScores.length > 0 ? Math.max(...atsScores) : 0,
      latestResumeAnalysis: resumeAnalyses[0]
        ? {
            id: resumeAnalyses[0]._id.toString(),
            fileName: resumeAnalyses[0].fileName,
            status: resumeAnalyses[0].status,
            atsScore: resumeAnalyses[0].analysis?.atsScore ?? null,
            analyzedAt: serializeDate(resumeAnalyses[0].analyzedAt),
            createdAt: serializeDate(resumeAnalyses[0].createdAt)
          }
        : null
    },
    mockInterview: {
      totalInterviews: mockInterviews.length,
      completedInterviews: completedInterviews.length,
      averageOverallScore: average(
        evaluatedInterviews.map((interview) => interview.evaluation?.overallScore).filter((score): score is number => typeof score === 'number')
      ),
      averageCommunication: average(
        evaluatedInterviews.map((interview) => interview.evaluation?.communication).filter((score): score is number => typeof score === 'number')
      ),
      averageTechnical: average(
        evaluatedInterviews.map((interview) => interview.evaluation?.technicalKnowledge).filter((score): score is number => typeof score === 'number')
      ),
      averageConfidence: average(
        evaluatedInterviews.map((interview) => interview.evaluation?.confidence).filter((score): score is number => typeof score === 'number')
      )
    },
    aiChat: {
      totalConversations: chatConversations.length,
      totalMessages: chatMessageCount,
      latestConversation: chatConversations[0]
        ? {
            id: chatConversations[0]._id.toString(),
            title: chatConversations[0].title,
            messageCount: chatConversations[0].messages.length,
            updatedAt: serializeDate(chatConversations[0].updatedAt)
          }
        : null
    },
    overall: {
      totalActivity: solvedOverall + resumeAnalyses.length + mockInterviews.length + chatMessageCount + favoriteCount,
      overallProgress: percentage(solvedOverall, questionTotal),
      favoriteCount,
      recentActivityTimeline
    }
  };
}
