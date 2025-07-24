class ApiResponse{
    constructor(statusCode, message, data = null, error = null) {
        this.statusCode = statusCode;
        this.success = statusCode >= 200 && statusCode < 300; // Determine success based on status code
        this.message = message;
        this.data = data; // Data can be null if not applicable
        this.error = error; // Error can be null if not applicable
        this.timestamp = new Date().toISOString(); // Add a timestamp for when the response was created
    }
}
export default ApiResponse;