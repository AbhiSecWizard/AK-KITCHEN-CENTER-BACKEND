require("dotenv/config");

const express = require("express");
const cors = require("cors");

const contactRoutes = require("./src/routes/contactRoute");

const app = express();
const port = process.env.PORT || 5000;

// Comma-separated list, no trailing slashes.
const allowedOrigins = (
  process.env.FRONTEND_URL || "https://ak-kitchen-center-rho.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, health checks) that send no Origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["POST", "GET", "OPTIONS"],
  })
);

app.use(express.json({ limit: "20kb" }));

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/contact", contactRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});