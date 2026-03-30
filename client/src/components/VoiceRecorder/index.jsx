useEffect(() => {
  let timerId = null;

  if (isRecording) {
    timerId = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev + 1 >= MAX_RECORD_TIME) {
          stopRecording();
          toast.success('Maximum recording time reached (5 minutes).');
          return MAX_RECORD_TIME;
        }
        return prev + 1;
      });
    }, 1000);
  }

  return () => {
    if (timerId) {
      clearInterval(timerId);
    }
  };
}, [isRecording]);

useEffect(() => {
  return () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    }
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
  };
}, [mediaRecorder, audioPreviewUrl]);

const startRecording = async () => {
  try {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setRecordedBlob(null);
    setAudioPreviewUrl(null);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const options = { mimeType: 'audio/webm;codecs=opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'audio/webm';
    }

    const recorder = new MediaRecorder(stream, options);
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      setRecordedBlob(audioBlob);

      const previewUrl = URL.createObjectURL(audioBlob);
      setAudioPreviewUrl(previewUrl);

      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingTime(0);
  } catch (error) {
    console.error('Microphone access error:', error.message);
    toast.error(
      'Could not access microphone. Please allow microphone permissions.'
    );
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  setIsRecording(false);
};

const handleSubmit = () => {
  if (recordedBlob) {
    onRecordingComplete(recordedBlob);
    setRecordedBlob(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setRecordingTime(0);
  }
};

const handleReRecord = () => {
  if (audioPreviewUrl) {
    URL.revokeObjectURL(audioPreviewUrl);
  }
  setRecordedBlob(null);
  setAudioPreviewUrl(null);
  setRecordingTime(0);
};