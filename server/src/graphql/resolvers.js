"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var bcrypt_1 = require("bcrypt");
var jsonwebtoken_1 = require("jsonwebtoken");
var Affiliate_1 = require("../models/Affiliate");
var Referral_1 = require("../models/Referral");
// import dotenv from "dotenv";
// dotenv.config();
var SECRET = "dev-secret-123456";
if (!SECRET) {
    throw new Error("JWT SECRET is not defined in environment variables");
}
var resolvers = {
    Query: {
        // Only logged-in users can list affiliates:
        getAffiliates: function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Affiliate_1.default.find()];
            });
        }); },
        getAffiliate: function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
            var id = _b.id;
            return __generator(this, function (_c) {
                return [2 /*return*/, Affiliate_1.default.findOne({ _id: id })];
            });
        }); },
        me: function (_parent, _, context) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!context.affiliate) {
                    throw new Error("Not authenticated");
                }
                return [2 /*return*/, Affiliate_1.default.findOne({ _id: context.affiliate.id })];
            });
        }); },
        // Only affiliates (via your custom header) can get their own referrals:
        getReferrals: function (_parent_1, _args_1, _a) { return __awaiter(void 0, [_parent_1, _args_1, _a], void 0, function (_parent, _args, _b) {
            var affiliate = _b.affiliate;
            return __generator(this, function (_c) {
                if (!affiliate) {
                    throw new Error("No affiliate credentials provided");
                }
                // filter referrals by the affiliate’s refId:
                return [2 /*return*/, Referral_1.default.find({ affiliateRefId: affiliate.refId })];
            });
        }); },
    },
    Mutation: {
        login: function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
            var affiliate, valid, token;
            var email = _b.email, password = _b.password;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("🔐 Login attempt:", email);
                        console.log("📥 Incoming password:", password);
                        return [4 /*yield*/, Affiliate_1.default.findOne({ email: email })];
                    case 1:
                        affiliate = _c.sent();
                        console.log("🔐 Hashed password in DB:", affiliate === null || affiliate === void 0 ? void 0 : affiliate.password);
                        if (!affiliate) {
                            console.warn("❌ No affiliate found for email:", email);
                            throw new Error("Affiliate not found");
                        }
                        return [4 /*yield*/, bcrypt_1.default.compare(password.trim(), affiliate.password.trim())];
                    case 2:
                        valid = _c.sent();
                        // const valid = password.trim() === affiliate.password.trim();
                        console.log("📥 Incoming password (trimmed):", password.trim());
                        console.log("🔐 Hashed password (trimmed):", affiliate.password.trim());
                        console.log("🔍 Password valid?", valid);
                        if (!valid) {
                            console.warn("❌ Invalid password for email:", email);
                            throw new Error("Invalid credentials");
                        }
                        token = jsonwebtoken_1.default.sign({ affiliateId: affiliate.id }, SECRET, {
                            expiresIn: "1h",
                        });
                        console.log("✅ Login success. Token:", token);
                        return [2 /*return*/, { token: token, affiliate: affiliate }];
                }
            });
        }); },
        registerAffiliate: function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
            var affiliate, token, error_1;
            var name = _b.name, email = _b.email, refId = _b.refId, totalClicks = _b.totalClicks, password = _b.password, totalCommissions = _b.totalCommissions;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        console.log("🔐 Register input:", name, email, refId, totalClicks, password, totalCommissions);
                        console.log("📥 Raw password at registration:", password);
                        affiliate = new Affiliate_1.default({
                            name: name,
                            email: email,
                            password: password,
                            refId: refId,
                            totalClicks: totalClicks,
                            totalCommissions: totalCommissions,
                        });
                        return [4 /*yield*/, affiliate.save()];
                    case 1:
                        _c.sent();
                        token = jsonwebtoken_1.default.sign({ affiliateId: affiliate.id }, SECRET, {
                            expiresIn: "1h",
                        });
                        console.log("✅ Registered affiliate:", affiliate);
                        console.log("📦 Token:", token);
                        // ✅ Return both the token and the affiliate
                        return [2 /*return*/, { token: token, affiliate: affiliate }];
                    case 2:
                        error_1 = _c.sent();
                        console.error("Error creating affiliate:", error_1); // Log any errors that occur during user creation
                        throw new Error("Failed to create affiliate");
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        deleteAffiliate: function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
            var error_2;
            var id = _b.id;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Affiliate_1.default.findOneAndDelete({ _id: id })];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2:
                        error_2 = _c.sent();
                        throw new Error("Failed to delete affiliate");
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        updateAffiliate: function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
            var error_3;
            var id = _b.id, name = _b.name, email = _b.email, refId = _b.refId, totalClicks = _b.totalClicks, totalCommissions = _b.totalCommissions;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Affiliate_1.default.findOneAndUpdate({ _id: id }, __assign(__assign(__assign(__assign(__assign({}, (name && { name: name })), (email && { email: email })), (refId && { refId: refId })), (totalClicks !== undefined && { totalClicks: totalClicks })), (totalCommissions !== undefined && { totalCommissions: totalCommissions })), { new: true })];
                    case 1: return [2 /*return*/, _c.sent()];
                    case 2:
                        error_3 = _c.sent();
                        throw new Error("Failed to update affiliate");
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        trackReferral: function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
            var newReferral, error_4;
            var refId = _b.refId, event = _b.event, email = _b.email;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        newReferral = new Referral_1.default({ refId: refId, event: event, email: email });
                        return [4 /*yield*/, newReferral.save()];
                    case 1:
                        _c.sent();
                        return [2 /*return*/, newReferral];
                    case 2:
                        error_4 = _c.sent();
                        throw new Error("Failed to create referral");
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        logClick: function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
            var updatedAffiliate, error_5;
            var refId = _b.refId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Affiliate_1.default.findOneAndUpdate({ refId: refId }, { $inc: { totalClicks: 1 } }, { new: true })];
                    case 1:
                        updatedAffiliate = _c.sent();
                        if (!updatedAffiliate) {
                            throw new Error("Affiliate not found");
                        }
                        return [2 /*return*/, true];
                    case 2:
                        error_5 = _c.sent();
                        console.error("Error logging click:", error_5);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
    },
};
exports.default = resolvers;
