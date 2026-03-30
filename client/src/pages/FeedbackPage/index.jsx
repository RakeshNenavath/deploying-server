useEffect(() => {
  const loadFeedback = async () => {
    try {
      const data = await getInterview(id);

      if (!data.feedback) {
        toast.error('No feedback available for this interview.');
        navigate('/');
        return;
      }

      setInterview(data);
    } catch (error) {
      toast.error('Failed to load feedback');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  loadFeedback();
}, [id, navigate]);