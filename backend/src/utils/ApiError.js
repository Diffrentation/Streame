class ApiError extends Error {
  constructor(statusCode, message, error = [], stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.success = false; // Indicates failure
    this.error = ApiError.formatError(error); // Normalize errors
    this.timestamp = new Date().toISOString(); // Add timestamp
    this.data = null; // Optional: attach relevant data if needed
    this.name = this.constructor.name; // Set class name
    this.isOperational = true; // Differentiate from programming errors

    if (stack) {
      this.stack = stack; // Use provided stack trace
    } else {
      Error.captureStackTrace(this, this.constructor); // Capture current stack
    }
  }

  static formatError(error) {
    if (Array.isArray(error)) return error;
    if (typeof error === "object" && error !== null) return [error];
    return [{ message: error }];
  }
}

export default ApiError;
