export const endInterview = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  if (interview.status === 'completed' && interview.feedback) {
    return {
      interviewId: interview._id,
      feedback: interview.feedback,
      overallScore: interview.overallScore,
    };
  }

  const conversationHistory = buildConversationHistory(interview.messages);

  let codeSubmissionsSummary = '';
  if (interview.codeSubmissions.length > 0) {
    codeSubmissionsSummary = interview.codeSubmissions
      .map((sub, i) => `Submission ${i + 1} (${sub.language}):\n${sub.code}\nEvaluation: ${JSON.stringify(sub.evaluation)}`)
      .join('\n\n');
  }

  const feedbackPrompt = FEEDBACK_PROMPT(interview.role, conversationHistory, codeSubmissionsSummary);
  const feedbackResponse = await askGemini(feedbackPrompt);
  const feedback = parseGeminiJSON(feedbackResponse);

  interview.feedback = feedback;
  interview.overallScore = feedback.overallScore || 0;
  interview.status = 'completed';
  await interview.save();

  return {
    interviewId: interview._id,
    feedback,
    overallScore: feedback.overallScore,
  };
};

export const getInterviewById = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId }).select('-__v');
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }
  return interview;
};