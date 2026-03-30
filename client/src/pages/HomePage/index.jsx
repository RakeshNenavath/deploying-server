useEffect(() => {
  const loadHistory = async () => {
    try {
      const allData = await getHistory(1, 100);
      setAllInterviews(allData.entries);
      setRecentInterviews(allData.entries.slice(0, 3));
    } catch (error) {
      console.error('Failed to load history:', error.message);
    } finally {
      setLoading(false);
    }
  };

  loadHistory();
}, []);

const handleDelete = async (id) => {
  try {
    await deleteHistoryItem(id);
    setAllInterviews((prev) => {
      const updated = prev.filter((item) => item._id !== id);
      setRecentInterviews(updated.slice(0, 3));
      return updated;
    });
    toast.success('Interview deleted');
  } catch (error) {
    toast.error('Failed to delete interview');
  }
};

const handleCardClick = (interview) => {
  if (interview.status === 'completed') {
    navigate(`/feedback/${interview._id}`);
  } else {
    navigate(`/interview/${interview._id}`);
  }
};

const completedCount = allInterviews.filter(
  (i) => i.status === 'completed'
).length;

const avgScore =
  allInterviews.length > 0
    ? Math.round(
        allInterviews
          .filter((i) => i.overallScore)
          .reduce((sum, i) => sum + i.overallScore, 0) /
          (allInterviews.filter((i) => i.overallScore).length || 1)
      )
    : 0;