export const getRoleFromEnv = () => {
  const normalized = (process.env.ARBITER_ROLE || "").trim().toLowerCase();
  return normalized || "unknown";
};
