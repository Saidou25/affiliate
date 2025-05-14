"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECRET = void 0;
// src/config.ts
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env or .env.production based on NODE_ENV
const envFile = process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env";
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../", envFile) });
// Now export your JWT secret (and any other shared config)
exports.SECRET = process.env.JWT_SECRET;
if (!exports.SECRET) {
    throw new Error("Missing JWT_SECRET in environment");
}
