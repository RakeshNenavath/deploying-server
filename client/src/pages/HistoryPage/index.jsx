useEffect(() => {
  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory(page, ITEMS_PER_PAGE);
      setInterviews(data.entries);
      setTotalPages(data.totalPages);
      setTotalEntries(data.totalEntries);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  loadHistory();
}, [page]);

const handleDelete = async (id) => {
  try {
    await deleteHistoryItem(id);
    setInterviews((prev) => prev.filter((item) => item._id !== id));
    setTotalEntries((prev) => prev - 1);
    toast.success('Interview deleted');
  } catch (error) {
    toast.error('Failed to delete');
  }
};

const handleClearAll = async () => {
  if (!window.confirm('Are you sure you want to delete all interviews?'))
    return;

  try {
    await clearHistory();
    setInterviews([]);
    setTotalEntries(0);
    toast.success('All history cleared');
  } catch (error) {
    toast.error('Failed to clear history');
  }
};

const handleCardClick = (interview) => {
  if (interview.status === 'completed') {
    navigate(`/feedback/${interview._id}`);
  } else {
    navigate(`/interview/${interview._id}`);
  }
};