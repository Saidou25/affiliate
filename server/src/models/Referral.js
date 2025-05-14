"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var ReferralSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    refId: { type: String, required: true },
    event: { type: String, required: true },
    //   timestamp: { type: Date, default: Date.now },
});
var Refferal = mongoose_1.default.model("Refferal", ReferralSchema);
exports.default = Refferal;
