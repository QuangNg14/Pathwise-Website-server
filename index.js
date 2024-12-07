require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/dbConfig");
const formRoutes = require("./routes/formRoutes");

const app = express();

// Middleware for CORS
const allowedOrigins = [
  "http://localhost:3000", // Local development frontend
  "http://localhost:5001", // Local development backend
  "https://www.thepathwise.org", // Deployed frontend
  "https://pathwise-website-c55a.vercel.app", // Deployed frontend (Vercel link)
  "https://pathwise-website-server.onrender.com", // Deployed backend
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies and other credentials
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.use("/api/forms", formRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
