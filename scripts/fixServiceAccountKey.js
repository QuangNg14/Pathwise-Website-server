require("dotenv").config();

function validateAndFixServiceAccountKey() {
  console.log("🔧 Google Service Account Key Validator & Fixer\n");

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.error(
      "❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in environment variables"
    );
    console.log("\n💡 Make sure you have this variable set in your .env file");
    return;
  }

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  console.log(`📊 Raw key length: ${rawKey.length} characters`);
  console.log(`📊 First 100 characters: ${rawKey.substring(0, 100)}...`);
  console.log(
    `📊 Last 50 characters: ...${rawKey.substring(rawKey.length - 50)}`
  );

  // Clean the key
  const cleanedKey = rawKey.trim();

  // Check if it starts and ends correctly
  const startsCorrectly = cleanedKey.startsWith("{");
  const endsCorrectly = cleanedKey.endsWith("}");

  console.log(`\n🔍 Analysis:`);
  console.log(`   Starts with '{': ${startsCorrectly ? "✅" : "❌"}`);
  console.log(`   Ends with '}': ${endsCorrectly ? "✅" : "❌"}`);

  if (!startsCorrectly || !endsCorrectly) {
    console.error("\n❌ The JSON doesn't have proper start/end braces");
    console.log(
      "💡 Your service account key should start with { and end with }"
    );
    return;
  }

  // Try to parse
  try {
    const parsed = JSON.parse(cleanedKey);
    console.log("\n✅ JSON is valid!");

    // Check required fields
    const requiredFields = [
      "type",
      "project_id",
      "private_key_id",
      "private_key",
      "client_email",
      "client_id",
    ];
    const missingFields = requiredFields.filter((field) => !parsed[field]);

    if (missingFields.length > 0) {
      console.error(
        `\n❌ Missing required fields: ${missingFields.join(", ")}`
      );
      console.log(
        "💡 Make sure you downloaded the complete service account key file"
      );
    } else {
      console.log("\n✅ All required fields present");
      console.log(`📋 Project ID: ${parsed.project_id}`);
      console.log(`📋 Client Email: ${parsed.client_email}`);
      console.log(`📋 Type: ${parsed.type}`);
    }

    // Generate properly formatted version for .env
    console.log("\n📝 Properly formatted for .env file:");
    console.log("   Copy this line to your .env file:");
    console.log("   ----------------------------------------");
    console.log(`GOOGLE_SERVICE_ACCOUNT_KEY='${JSON.stringify(parsed)}'`);
    console.log("   ----------------------------------------");
  } catch (error) {
    console.error("\n❌ JSON parsing failed:", error.message);

    // Common issues and fixes
    console.log("\n🔧 Common issues and fixes:");

    if (error.message.includes("Unexpected token")) {
      console.log("   1. Check for unescaped quotes in the JSON");
      console.log("   2. Make sure the JSON is on a single line in .env");
      console.log("   3. Try wrapping the entire JSON in single quotes");
    }

    if (error.message.includes("Unexpected end")) {
      console.log("   1. The JSON might be truncated");
      console.log("   2. Check if you copied the complete service account key");
    }

    console.log("\n💡 How to fix:");
    console.log("   1. Go to Google Cloud Console");
    console.log("   2. Navigate to IAM & Admin > Service Accounts");
    console.log("   3. Find your service account and create a new key");
    console.log("   4. Download as JSON");
    console.log("   5. Copy the ENTIRE content and paste it in your .env file");
    console.log("   6. Wrap it in single quotes like this:");
    console.log(
      '      GOOGLE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\''
    );

    // Try to identify the specific issue
    const lines = cleanedKey.split("\n");
    if (lines.length > 1) {
      console.log("\n⚠️  Your JSON appears to be on multiple lines");
      console.log("   This can cause parsing issues in .env files");
      console.log(
        "   Try putting it all on one line, wrapped in single quotes"
      );
    }
  }
}

if (require.main === module) {
  validateAndFixServiceAccountKey();
}

module.exports = { validateAndFixServiceAccountKey };
