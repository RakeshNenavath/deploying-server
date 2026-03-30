useEffect(() => {
  const loadInterview = async () => {
    try {
      const data = await getInterview(id);
      setCurrentQuestionNum(data.currentQuestion);
      setTotalQuestions(data.totalQuestions);

      if (data.questions && data.questions.length > 0) {
        const qIndex = data.currentQuestion - 1;
        setCurrentQuestion(data.questions[qIndex] || data.questions[0]);
      }

      const interviewerMsgs = data.messages.filter(
        (m) => m.role === 'interviewer'
      );
      if (data.currentQuestion === 1 && interviewerMsgs.length >= 1) {
        setInterviewerText(interviewerMsgs[0].content);
      } else if (interviewerMsgs.length > 0) {
        setInterviewerText(interviewerMsgs[interviewerMsgs.length - 1].content);
      }

      if (data.currentQuestion === 1) {
        const audio = location.state?.audio || data.lastAudio;
        if (audio) {
          setCurrentAudio(audio);
          setInterviewerState(STATE_SPEAKING);
        } else {
          setInterviewerState(STATE_SPEAKING);
          setTimeout(() => setInterviewerState(STATE_LISTENING), 3000);
        }
      } else {
        setInterviewerState(STATE_LISTENING);
      }
    } catch (error) {
      toast.error('Failed to load interview');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  loadInterview();
}, [id, navigate, location.state]);

const handleAudioEnded = () => {
  if (interviewerState === STATE_FAREWELL) return;
  setTimeout(() => setInterviewerState(STATE_LISTENING), 3000);
};

const resetAnswerFields = () => {
  setTextAnswer('');
  setCode('');
  setCodeEvaluation(null);
  setShowTextFallback(false);
};

const processAnswerResult = (result) => {
  if (result.isComplete) {
    const farewellText =
      'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report...';
    setFarewellMessage(farewellText);
    setInterviewerState(STATE_FAREWELL);

    if (result.audio) {
      setTimeout(() => {
        setCurrentAudio(result.audio);
        setAudioKey((prev) => prev + 1);
      }, 100);
      setTimeout(() => handleEndInterview(), 10000);
    } else {
      setTimeout(() => handleEndInterview(), 4000);
    }
    return;
  }

  setInterviewerText(result.response);
  setCurrentQuestionNum(result.currentQuestion);
  setCurrentQuestion(result.question);
  setCurrentAudio(result.audio);
  setAudioKey((prev) => prev + 1);
  resetAnswerFields();

  setInterviewerState(STATE_SPEAKING);
  if (!result.audio) {
    setTimeout(() => setInterviewerState(STATE_LISTENING), 3000);
  }
};

const submitAndProcess = async (answerText) => {
  setSubmitting(true);
  setInterviewerState(STATE_THINKING);
  try {
    const result = await submitTextAnswer(id, answerText);
    processAnswerResult(result);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to submit answer');
    setInterviewerState(STATE_LISTENING);
  } finally {
    setSubmitting(false);
  }
};

const handleRecordingComplete = async (audioBlob) => {
  setSubmitting(true);
  setInterviewerState(STATE_THINKING);
  try {
    const data = await transcribeAudio(audioBlob);
    const answerText =
      data.text && !data.text.startsWith('[')
        ? data.text
        : 'The candidate provided a verbal response.';

    const result = await submitTextAnswer(id, answerText);
    processAnswerResult(result);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to submit answer');
    setInterviewerState(STATE_LISTENING);
  } finally {
    setSubmitting(false);
  }
};

const handleSubmitText = () => {
  if (!textAnswer.trim()) return toast.error('Please type your answer.');
  submitAndProcess(textAnswer);
};

const handleSubmitCode = async () => {
  if (!code.trim()) return toast.error('Please write some code.');
  setSubmitting(true);
  setInterviewerState(STATE_THINKING);
  try {
    const result = await submitCode(id, code, codeLanguage);
    setCodeEvaluation(result.evaluation);
    toast.success(`Code evaluated: ${result.evaluation.score}/100`);

    if (result.isComplete) {
      setFarewellMessage(
        'Thank you for completing the interview! I really enjoyed our conversation. Let me prepare your detailed feedback report...'
      );
      setInterviewerState(STATE_FAREWELL);
      if (result.audio) {
        setTimeout(() => {
          setCurrentAudio(result.audio);
          setAudioKey((prev) => prev + 1);
        }, 100);
        setTimeout(() => handleEndInterview(), 10000);
      } else {
        setTimeout(() => handleEndInterview(), 4000);
      }
      return;
    }

    setTimeout(() => processAnswerResult(result), 2500);
  } catch (error) {
    toast.error('Failed to evaluate code');
    setInterviewerState(STATE_LISTENING);
  } finally {
    setSubmitting(false);
  }
};

const handleEndInterview = async () => {
  setEnding(true);
  try {
    await endInterview(id);
    navigate(`/feedback/${id}`);
  } catch (error) {
    toast.error('Failed to generate feedback');
  } finally {
    setEnding(false);
  }
};