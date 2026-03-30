useEffect(() => {
  const loadResume = async () => {
    try {
      const data = await getResume();
      if (data) {
        setResumeText(data.text);
        setResumeFileName(data.fileName);
      }
    } catch (error) {
      // No resume found - that's okay
    }
  };

  loadResume();
}, []);

const handleResumeUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    toast.error('Please upload a PDF file.');
    return;
  }

  setUploadingResume(true);

  try {
    const data = await uploadResume(file);
    setResumeText(data.text);
    setResumeFileName(data.fileName);
    toast.success('Resume uploaded successfully!');
  } catch (error) {
    const message =
      error.response?.data?.message || 'Failed to upload resume';
    toast.error(message);
  } finally {
    setUploadingResume(false);
  }
};

const handleStartInterview = async () => {
  if (!selectedRole) {
    toast.error('Please select a role.');
    return;
  }
  if (!resumeText) {
    toast.error('Please upload your resume.');
    return;
  }

  setLoading(true);

  try {
    const difficultyConfig = DIFFICULTY_LEVELS.find(
      (d) => d.id === selectedDifficulty
    );
    const totalQuestions = difficultyConfig ? difficultyConfig.questions : 5;
    const data = await startInterview(
      selectedRole,
      resumeText,
      totalQuestions
    );
    toast.success('Interview started!');
    navigate(`/interview/${data.interviewId}`, {
      state: { audio: data.audio },
    });
  } catch (error) {
    const message =
      error.response?.data?.message || 'Failed to start interview';
    toast.error(message);
  } finally {
    setLoading(false);
  }
};

const handleNext = () => {
  if (step === 1 && !selectedRole) {
    toast.error('Please select a role.');
    return;
  }
  setStep((prev) => Math.min(prev + 1, 3));
};

const handleBack = () => {
  setStep((prev) => Math.max(prev - 1, 1));
};