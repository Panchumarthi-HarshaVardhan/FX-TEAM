// Helper function to get safe image src
export const getSafeImageSrc = (src) => {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  return src;
};

// Helper function to get safe initial
export const getSafeInitial = (name) => {
  if (!name || typeof name !== "string" || name.trim() === "") return "U";
  return name.trim().charAt(0).toUpperCase();
};
