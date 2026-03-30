useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setIsSupported(false);
    return;
  }

  const recog = new SpeechRecognition();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = 'en-US';

  let accumulated = '';

  recog.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript + ' ';
      } else {
        interim = transcript;
      }
    }

    if (final) {
      accumulated = final.trim();
      setFinalText(accumulated);
    }
    setLiveText(interim);

    clearSilenceTimer();
    startSilenceTimer(accumulated || interim);
  };

  recog.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'no-speech') {
      return;
    }
    setIsListening(false);
  };

  recog.onend = () => {
    setIsListening(false);
  };

  setRecognition(recog);

  return () => {
    recog.abort();
    clearSilenceTimer();
  };
}, []);

useEffect(() => {
  if (recognition && isSupported && !disabled) {
    startListening();
  }
}, [recognition, isSupported, disabled]);

const clearSilenceTimer = () => {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    setSilenceTimer(null);
  }
  setAutoSubmitCountdown(null);
};

const startSilenceTimer = (currentText) => {
  const timer = setTimeout(() => {
    if (currentText && currentText.trim().length > 0) {
      handleAutoSubmit(currentText.trim());
    }
  }, SILENCE_TIMEOUT);
  setSilenceTimer(timer);

  setAutoSubmitCountdown(3);
  setTimeout(() => setAutoSubmitCountdown(2), 1000);
  setTimeout(() => setAutoSubmitCountdown(1), 2000);
};

const startListening = () => {
  if (!recognition) return;
  try {
    setLiveText('');
    setFinalText('');
    setAutoSubmitCountdown(null);
    recognition.start();
    setIsListening(true);
  } catch (error) {
    console.error('Recognition start error:', error.message);
  }
};

const stopListening = () => {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch (error) {
    // Already stopped
  }
  setIsListening(false);
  clearSilenceTimer();
};

const handleAutoSubmit = (text) => {
  stopListening();
  if (onAutoSubmit) {
    onAutoSubmit(text);
  }
};

const handleManualSubmit = () => {
  const text = (finalText + ' ' + liveText).trim();
  if (!text) return;
  stopListening();
  if (onAutoSubmit) {
    onAutoSubmit(text);
  }
};

const handleRestart = () => {
  setLiveText('');
  setFinalText('');
  clearSilenceTimer();
  startListening();
};