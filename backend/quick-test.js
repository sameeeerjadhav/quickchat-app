// quick-test.js - UPDATED
const mongoose = require('mongoose');

const uri = "mongodb+srv://sameer_db_user:eK4RHOPS2Gu1Nv4W@quickchat-cluster-dev.gwsxzaq.mongodb.net/quickchat?retryWrites=true&w=majority";

async function test() {
  console.log("🔗 Testing MongoDB connection...");
  console.log("URI (masked):", uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  try {
    // SIMPLER connection - remove deprecated options
    await mongoose.connect(uri);
    
    console.log("✅ SUCCESS! Connected to MongoDB!");
    console.log("📊 Database:", mongoose.connection.name);
    console.log("📍 Host:", mongoose.connection.host);
    console.log("🔌 Ready State:", mongoose.connection.readyState);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📁 Collections:");
    if (collections.length > 0) {
      collections.forEach(col => console.log("  -", col.name));
    } else {
      console.log("  No collections yet (empty database)");
    }
    
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed.");
    
  } catch (error) {
    console.error("\n❌ CONNECTION FAILED!");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log("\n💡 Possible issues:");
      console.log("1. Wrong username/password");
      console.log("2. IP not whitelisted (but you added it)");
      console.log("3. Network/firewall issue");
      console.log("4. Try removing '/quickchat' from URI");
    }
    
    if (error.message.includes('auth')) {
      console.log("\n🔑 Authentication issue!");
      console.log("Double-check username: sameer_db_user");
      console.log("Double-check password: eK4RHOPS2Gu1Nv4W");
    }
  }
}

test();