const express = require("express");
const cors = require("cors");
const { json, urlencoded } = require("express");

const app = express();

// Load environment variables
require("dotenv").config();

// Basic middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// Load routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const facturasRoutes = require("./routes/facturas.routes");
const videosRoutes = require("./routes/videos.routes");

// Mount routes
app.use("/auth", authRoutes);
app.use("/usuarios", userRoutes);
app.use("/facturas", facturasRoutes);
app.use("/videos", videosRoutes);

// Error handling
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(status).json({
        success: false,
        status,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});

module.exports = app;
