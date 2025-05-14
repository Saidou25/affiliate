import * as jwt from 'jsonwebtoken';
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectToDatabase } from "./database"; // Import your DB connection function
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import Affiliate from "./models/Affiliate";
// dotenv.config();
// const SECRET = process.env.SECRET;
const SECRET = "dev-secret-123456";
if (!SECRET) {
    throw new Error("JWT SECRET is not defined in environment variables");
}
// Define ApolloServer with your custom context type
const server = new ApolloServer({
    typeDefs,
    resolvers,
});
async function startApolloServer() {
    console.log("🟢 Starting server...");
    await connectToDatabase();
    const { url } = await startStandaloneServer(server, {
        context: async ({ req }) => {
            const auth = req.headers.authorization || "";
            let affiliate;
            if (auth.startsWith("Bearer ")) {
                const token = auth.replace("Bearer ", "");
                try {
                    if (!SECRET) {
                        throw new Error("JWT SECRET is missing");
                    }
                    const decoded = jwt.verify(token, SECRET);
                    // Type guard to safely check for affiliateId
                    if (typeof decoded === "object" &&
                        decoded !== null &&
                        "affiliateId" in decoded &&
                        typeof decoded.affiliateId === "string") {
                        const { affiliateId } = decoded;
                        affiliate = await Affiliate.findById(affiliateId);
                        if (!affiliate) {
                            console.warn("⚠️ Affiliate not found in database.");
                        }
                    }
                    else {
                        console.warn("⚠️ Invalid token payload structure.");
                    }
                }
                catch (err) {
                    console.warn("⚠️ Invalid token:", err);
                }
            }
            return { affiliate };
        },
    });
    console.log(`🚀 Server is running! 📭 Query at ${url}`);
}
startApolloServer().catch((err) => {
    console.error("❌ Server failed to start:", err);
});
