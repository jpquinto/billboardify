// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Get current date
export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

// Get date 30 days ago
export const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
};
