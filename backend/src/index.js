import connectDB from "./db/db.js";
import app from "./app.js";
import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.error("Server error:", err);
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
