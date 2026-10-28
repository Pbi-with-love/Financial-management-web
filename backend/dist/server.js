"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_js_1 = require("./config.js");
const app_js_1 = require("./app.js");
const app = (0, app_js_1.createApp)();
app.listen(config_js_1.config.port, () => {
    console.log(`Server running on port ${config_js_1.config.port}`);
});
