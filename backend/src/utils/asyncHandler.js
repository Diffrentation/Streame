const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Async handler error:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message || "An unexpected error occurred",
      });
      next(error); // Pass the error to the next middleware
    });
  };
};
export default asyncHandler;

// const asyncHandler = (fn) => {
//   async (req, res, next) => {
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//       console.error("Async handler error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Internal Server Error",
//         error: error.message || "An unexpected error occurred",
//       });
//       next(error); // Pass the error to the next middleware
//     }
//   };
// };
// export default asyncHandler;
