"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var jwt = require("jsonwebtoken");
var server_1 = require("@apollo/server");
var standalone_1 = require("@apollo/server/standalone");
var database_1 = require("./database"); // Import your DB connection function
var typeDefs_1 = require("./graphql/typeDefs");
var resolvers_1 = require("./graphql/resolvers");
var Affiliate_1 = require("./models/Affiliate");
// dotenv.config();
// const SECRET = process.env.SECRET;
var SECRET = "dev-secret-123456";
if (!SECRET) {
    throw new Error("JWT SECRET is not defined in environment variables");
}
// Define ApolloServer with your custom context type
var server = new server_1.ApolloServer({
    typeDefs: typeDefs_1.default,
    resolvers: resolvers_1.default,
});
function startApolloServer() {
    return __awaiter(this, void 0, void 0, function () {
        var url;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🟢 Starting server...");
                    return [4 /*yield*/, (0, database_1.connectToDatabase)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, standalone_1.startStandaloneServer)(server, {
                            context: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var auth, affiliate, token, decoded, affiliateId, err_1;
                                var req = _b.req;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            auth = req.headers.authorization || "";
                                            if (!auth.startsWith("Bearer ")) return [3 /*break*/, 6];
                                            token = auth.replace("Bearer ", "");
                                            _c.label = 1;
                                        case 1:
                                            _c.trys.push([1, 5, , 6]);
                                            if (!SECRET) {
                                                throw new Error("JWT SECRET is missing");
                                            }
                                            decoded = jwt.verify(token, SECRET);
                                            if (!(typeof decoded === "object" &&
                                                decoded !== null &&
                                                "affiliateId" in decoded &&
                                                typeof decoded.affiliateId === "string")) return [3 /*break*/, 3];
                                            affiliateId = decoded.affiliateId;
                                            return [4 /*yield*/, Affiliate_1.default.findById(affiliateId)];
                                        case 2:
                                            affiliate = _c.sent();
                                            if (!affiliate) {
                                                console.warn("⚠️ Affiliate not found in database.");
                                            }
                                            return [3 /*break*/, 4];
                                        case 3:
                                            console.warn("⚠️ Invalid token payload structure.");
                                            _c.label = 4;
                                        case 4: return [3 /*break*/, 6];
                                        case 5:
                                            err_1 = _c.sent();
                                            console.warn("⚠️ Invalid token:", err_1);
                                            return [3 /*break*/, 6];
                                        case 6: return [2 /*return*/, { affiliate: affiliate }];
                                    }
                                });
                            }); },
                        })];
                case 2:
                    url = (_a.sent()).url;
                    console.log("\uD83D\uDE80 Server is running! \uD83D\uDCED Query at ".concat(url));
                    return [2 /*return*/];
            }
        });
    });
}
startApolloServer().catch(function (err) {
    console.error("❌ Server failed to start:", err);
});
