"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load Neon .env.local first (has the real DATABASE_URL), then local .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env.local") });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check — proves the database connection works
app.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ok", database: "connected" });
    }
    catch (err) {
        console.error("Database health check failed:", err);
        res.status(500).json({ status: "error", database: "disconnected" });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
