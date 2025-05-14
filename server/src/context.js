// import jwt from "jsonwebtoken";
import * as jwt from 'jsonwebtoken';
import Affiliate from "./models/Affiliate";
const SECRET = process.env.JWT_SECRET;
if (!SECRET)
    throw new Error("Missing JWT_SECRET in environment");
export const createContext = async ({ req, }) => {
    const authHeader = req.headers.authorization || "";
    console.log("🧾 Auth header:", authHeader);
    // Handle missing or invalid authorization header
    if (!authHeader.startsWith("Bearer ")) {
        console.warn("⚠️ No Bearer token found");
        return {}; // or { affiliate: null }
    }
    const token = authHeader.slice(7); // Remove "Bearer "
    console.log("🔑 Token received:", token); // 👈 ADD THIS
    try {
        // Decode and verify the token
        const payload = jwt.verify(token, SECRET);
        console.log("🔓 Token verified. Payload:", payload);
        // Fetch the affiliate from the database using affiliateId
        const foundAffiliate = await Affiliate.findById(payload.affiliateId);
        if (!foundAffiliate) {
            console.warn("⚠️ No affiliate found with ID:", payload.affiliateId);
            return {}; // or return { affiliate: null }
        }
        // Create the affiliate object to return in the context
        const affiliate = {
            id: foundAffiliate.id.toString(),
            name: foundAffiliate.name,
            email: foundAffiliate.email,
            refId: foundAffiliate.refId,
            totalClicks: foundAffiliate.totalClicks,
            totalCommissions: foundAffiliate.totalCommissions,
        };
        console.log("👤 Context affiliate:", affiliate);
        return { affiliate }; // This is the context being passed
    }
    catch (error) {
        console.warn("❌ Token verification failed:", error);
        return {}; // or return { affiliate: null }
    }
};
