const extractId = (url, pattern) => {
  const match = url.match(pattern);
  if (!match) return null;

  const id = parseInt(match[1], 10);
  return isNaN(id) || id < 1 ? null : id;
};

const isAdminRoute = (url) => {
  return (
    url.startsWith("/api/admin/") || url === "/admin" || url === "/admin.html"
  );
};

export { extractId, isAdminRoute };
