const mongoose = require("mongoose");

(async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/princetongreen-affiliate");
    const Affiliate = require("../dist/models/Affiliate").default;

    const refId = process.argv[2] || "v-rOl-I7";
    const doc = await Affiliate.findOne({ refId }).lean();

    if (!doc) {
      console.log(`No affiliate found for refId=${refId}`);
      process.exit(0);
    }

    const last = (doc.notifications || []).slice(-10).reverse();
    console.log(JSON.stringify({
      refId: doc.refId,
      total: (doc.notifications || []).length,
      last
    }, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.connection.close();
  }
})();
