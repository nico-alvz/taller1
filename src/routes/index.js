const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const userRoutes = require("./users.routes");
const videosRoutes = require("./videos.routes");
const facturasRoutes = require("./facturas.routes");

router.use("/auth", authRoutes);
router.use("/usuarios", userRoutes);
router.use("/videos", videosRoutes);
router.use("/facturas", facturasRoutes);

module.exports = router;
