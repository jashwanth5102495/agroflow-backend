export const getPaginationOptions = (query: any, defaultLimit: number = 20) => {
  const page = parseInt(query.page as string) || 1;
  const reqLimit = query.limit ? parseInt(query.limit as string) : defaultLimit;
  const limit = isNaN(reqLimit) || reqLimit <= 0 ? defaultLimit : reqLimit;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPagination = (page: number, limit: number, total: number) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};
