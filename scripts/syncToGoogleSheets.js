const { google } = require("googleapis");
const mongoose = require("mongoose");
require("dotenv").config();

// Import your Form model
const Form = require("../models/Form");

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME =
  process.env.GOOGLE_SHEET_NAME || "Mentee Applications Tracking Batch 5/2025";

// Initialize Google Sheets API
async function initializeGoogleSheets() {
  try {
    // Use service account credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    return sheets;
  } catch (error) {
    console.error("Error initializing Google Sheets:", error);
    throw error;
  }
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

// Fetch all form submissions from MongoDB
async function fetchFormSubmissions() {
  try {
    const forms = await Form.find({}).sort({ createdAt: -1 });
    console.log(`Fetched ${forms.length} form submissions from MongoDB`);
    return forms;
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    throw error;
  }
}

// Convert MongoDB documents to Google Sheets format
function formatDataForSheets(forms) {
  if (forms.length === 0) {
    return [["No data available"]];
  }

  // Define headers to match the new form structure
  const headers = [
    "Full Name",
    "Email",
    "Phone",
    "School",
    "Current Year",
    "Industry Preference",
    "LinkedIn",
    "Leetcode",
    "Github",
    "Resume URL",
    "Waitlist Consideration",
    "Message",
    "Submitted At",
    "Updated At",
  ];

  // Convert form data to rows with better error handling
  const rows = forms.map((form, index) => {
    try {
      return [
        form.fullName || "",
        form.email || "",
        form.phone || "", // Updated field name
        form.school || "",
        form.currentYear || "",
        form.industryPreference || "",
        form.linkedin || "", // Added linkedin field
        form.leetcode || "",
        form.github || "",
        form.resumeUrl || "",
        form.waitlistConsideration || "No",
        form.message || "", // Added message field
        form.createdAt ? form.createdAt.toISOString() : "",
        form.updatedAt ? form.updatedAt.toISOString() : "",
      ];
    } catch (error) {
      console.error(
        `⚠️  Error formatting form at index ${index}:`,
        error.message
      );
      console.error(`   Form ID: ${form._id || "Unknown"}`);
      // Return a row with error information
      return [
        form.fullName || "ERROR",
        form.email || "ERROR",
        "ERROR FORMATTING DATA",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
    }
  });

  console.log(`📊 Formatted ${rows.length} form submissions for Google Sheets`);
  return [headers, ...rows];
}

// Get or create the target sheet
async function ensureSheetExists(sheets) {
  try {
    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    console.log(`📋 Spreadsheet: "${spreadsheet.data.properties.title}"`);
    console.log(
      `📄 Available sheets: ${spreadsheet.data.sheets
        .map((s) => `"${s.properties.title}"`)
        .join(", ")}`
    );

    // Check if our target sheet exists
    const targetSheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === SHEET_NAME
    );

    if (targetSheet) {
      console.log(`✅ Found target sheet: "${SHEET_NAME}"`);
      return SHEET_NAME;
    }

    // If target sheet doesn't exist, try to use the first sheet
    const firstSheet = spreadsheet.data.sheets[0];
    if (firstSheet) {
      const firstSheetName = firstSheet.properties.title;
      console.log(
        `⚠️  Target sheet "${SHEET_NAME}" not found. Using first sheet: "${firstSheetName}"`
      );
      return firstSheetName;
    }

    throw new Error("No sheets found in the spreadsheet");
  } catch (error) {
    console.error("Error checking sheet existence:", error);
    throw error;
  }
}

// Clear existing data and write new data to Google Sheets
async function updateGoogleSheet(sheets, data) {
  try {
    // Ensure the sheet exists and get the correct name
    const actualSheetName = await ensureSheetExists(sheets);

    // Clear existing data
    console.log(`🧹 Clearing existing data from sheet: "${actualSheetName}"`);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${actualSheetName}'!A:Z`,
    });

    console.log("✅ Cleared existing data from Google Sheet");

    // Write new data
    console.log(
      `📝 Writing ${data.length} rows to sheet: "${actualSheetName}"`
    );
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${actualSheetName}'!A1`,
      valueInputOption: "RAW",
      resource: {
        values: data,
      },
    });

    console.log(`✅ Updated Google Sheet with ${data.length} rows`);
    return { response, sheetName: actualSheetName };
  } catch (error) {
    console.error("❌ Error updating Google Sheet:", error.message);

    // Provide specific troubleshooting
    if (error.message.includes("Unable to parse range")) {
      console.error("\n🔧 Sheet Range Issue:");
      console.error("   1. Check if the sheet name exists in your spreadsheet");
      console.error("   2. Verify GOOGLE_SHEET_NAME environment variable");
      console.error(
        "   3. Make sure sheet name doesn't have special characters"
      );
    }

    throw error;
  }
}

// Format the sheet (optional - makes it look better)
async function formatSheet(sheets, actualSheetName) {
  try {
    console.log(`🎨 Applying formatting to sheet: "${actualSheetName}"`);

    // Get sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === actualSheetName
    );
    if (!sheet) {
      console.log(
        `⚠️  Sheet "${actualSheetName}" not found, skipping formatting`
      );
      return;
    }

    const sheetId = sheet.properties.sheetId;

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: 15,
              },
            },
          },
        ],
      },
    });

    console.log("✅ Applied formatting to Google Sheet");
  } catch (error) {
    console.error("⚠️  Error formatting sheet:", error.message);
    // Don't throw error for formatting issues
  }
}

// Main sync function
async function syncToGoogleSheets() {
  try {
    console.log("🚀 Starting MongoDB to Google Sheets sync...");
    console.log("⏰ Timestamp:", new Date().toISOString());
    console.log("🎯 Target sheet name:", SHEET_NAME);

    // Initialize connections
    console.log("\n📡 Initializing connections...");
    const sheets = await initializeGoogleSheets();
    await connectToMongoDB();

    // Fetch data from MongoDB
    console.log("\n📊 Fetching data from MongoDB...");
    const forms = await fetchFormSubmissions();

    // Format data for Google Sheets
    console.log("\n🔄 Formatting data for Google Sheets...");
    const sheetData = formatDataForSheets(forms);

    // Update Google Sheet
    console.log("\n📝 Updating Google Sheet...");
    const updateResult = await updateGoogleSheet(sheets, sheetData);

    // Apply formatting
    console.log("\n🎨 Applying formatting...");
    await formatSheet(sheets, updateResult.sheetName);

    console.log("\n🎉 Sync completed successfully!");
    console.log(`📈 Synced ${forms.length} form submissions to Google Sheets`);
    console.log(`📋 Sheet used: "${updateResult.sheetName}"`);
  } catch (error) {
    console.error("\n❌ Sync failed:", error.message);

    // Provide helpful debugging information
    console.error("\n🔧 Debugging information:");
    console.error(`   Spreadsheet ID: ${SPREADSHEET_ID}`);
    console.error(`   Target sheet name: ${SHEET_NAME}`);
    console.error(`   Error type: ${error.constructor.name}`);

    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncToGoogleSheets();
}

module.exports = { syncToGoogleSheets };
