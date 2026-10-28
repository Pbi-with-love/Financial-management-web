"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const config_js_1 = require("./config.js");
const app_js_1 = require("./app.js");
const app = (0, app_js_1.createApp)();
app.listen(config_js_1.config.port, () => {
    console.log(`Server running on port ${config_js_1.config.port}`);
});
