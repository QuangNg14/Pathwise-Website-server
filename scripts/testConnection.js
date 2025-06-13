const mongoose = require("mongoose");
const { google } = require("googleapis");
require("dotenv").config();

// Test MongoDB connection
async function testMongoDB() {
  try {
    console.log("🔍 Testing MongoDB connection...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connection successful!");

    // Test if Form collection exists and count documents
    const Form = require("../models/Form");
    const count = await Form.countDocuments();
    console.log(`📊 Found ${count} form submissions in database`);

    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    return false;
  }
}

// Test Google Sheets connection
async function testGoogleSheets() {
  try {
    console.log("🔍 Testing Google Sheets connection...");

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not found in environment");
    }

    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID not found in environment");
    }

    // Debug: Check the format of the service account key
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
    console.log(
      `🔍 Service account key length: ${serviceAccountKey.length} characters`
    );
    console.log(
      `🔍 First 50 characters: ${serviceAccountKey.substring(0, 50)}...`
    );

    // Try to parse the JSON
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
      console.log("✅ Service account key JSON is valid");
      console.log(`🔍 Project ID: ${credentials.project_id || "Not found"}`);
      console.log(
        `🔍 Client email: ${credentials.client_email || "Not found"}`
      );
    } catch (parseError) {
      console.error("❌ Failed to parse service account key JSON:");
      console.error("   Error:", parseError.message);
      console.error("   This usually means:");
      console.error("   1. The JSON is malformed or incomplete");
      console.error("   2. There are extra characters or spaces");
      console.error("   3. The JSON is not properly escaped in your .env file");
      console.error("\n💡 Solutions:");
      console.error(
        "   1. Make sure your .env file has the JSON on a single line"
      );
      console.error("   2. Ensure all quotes are properly escaped");
      console.error(
        "   3. Try wrapping the entire JSON in single quotes in .env"
      );
      console.error(
        "   4. Verify the JSON is complete (starts with { and ends with })"
      );
      throw parseError;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Test by getting spreadsheet metadata
    console.log("🔍 Attempting to access spreadsheet...");
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    });

    console.log("✅ Google Sheets connection successful!");
    console.log(`📋 Spreadsheet: "${spreadsheet.data.properties.title}"`);
    console.log(
      `📄 Sheets: ${spreadsheet.data.sheets
        .map((s) => s.properties.title)
        .join(", ")}`
    );

    return true;
  } catch (error) {
    console.error("❌ Google Sheets connection failed:", error.message);

    // Provide specific troubleshooting based on error type
    if (error.message.includes("JSON")) {
      console.error(
        "\n🔧 JSON Parsing Issue - Check your GOOGLE_SERVICE_ACCOUNT_KEY format"
      );
    } else if (error.message.includes("403")) {
      console.error("\n🔧 Permission Issue - Make sure:");
      console.error(
        "   1. Google Sheets API is enabled in your Google Cloud project"
      );
      console.error("   2. Your service account has access to the spreadsheet");
      console.error(
        "   3. You've shared the spreadsheet with the service account email"
      );
    } else if (error.message.includes("404")) {
      console.error("\n🔧 Spreadsheet Not Found - Check:");
      console.error("   1. GOOGLE_SPREADSHEET_ID is correct");
      console.error("   2. Spreadsheet exists and is accessible");
      console.error(
        "   3. Service account has permission to view the spreadsheet"
      );
    }

    return false;
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log("🔍 Checking environment variables...");

  const required = [
    "MONGO_URI",
    "GOOGLE_SPREADSHEET_ID",
    "GOOGLE_SERVICE_ACCOUNT_KEY",
  ];

  const optional = ["GOOGLE_SHEET_NAME", "AWS_REGION", "FILES_BUCKET_NAME"];

  let allGood = true;

  console.log("\n📋 Required variables:");
  required.forEach((key) => {
    const exists = !!process.env[key];
    console.log(
      `  ${exists ? "✅" : "❌"} ${key}: ${exists ? "Set" : "Missing"}`
    );
    if (!exists) allGood = false;
  });

  console.log("\n📋 Optional variables:");
  optional.forEach((key) => {
    const exists = !!process.env[key];
    console.log(
      `  ${exists ? "✅" : "⚠️"} ${key}: ${exists ? "Set" : "Not set"}`
    );
  });

  return allGood;
}

// Main test function
async function runTests() {
  console.log("🚀 Starting connection tests...\n");

  const envOk = testEnvironmentVariables();
  console.log("\n" + "=".repeat(50) + "\n");

  if (!envOk) {
    console.log(
      "❌ Environment variables test failed. Please check your .env file."
    );
    process.exit(1);
  }

  const mongoOk = await testMongoDB();
  console.log("\n" + "=".repeat(50) + "\n");

  const sheetsOk = await testGoogleSheets();
  console.log("\n" + "=".repeat(50) + "\n");

  if (mongoOk && sheetsOk) {
    console.log("🎉 All tests passed! Your setup is ready for sync.");
    console.log("\n💡 Next steps:");
    console.log("   1. Run: npm run sync-sheets (to test manual sync)");
    console.log("   2. Push to GitHub to enable daily automated sync");
  } else {
    console.log("❌ Some tests failed. Please check the errors above.");
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testMongoDB, testGoogleSheets, testEnvironmentVariables };
