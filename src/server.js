require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || "127.0.0.1";

app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
