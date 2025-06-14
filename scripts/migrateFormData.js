const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Migration function to update existing form data
async function migrateFormData() {
  try {
    console.log("🚀 Starting form data migration...");
    console.log("⏰ Timestamp:", new Date().toISOString());

    await connectToMongoDB();

    // Get the raw collection to work with existing data structure
    const db = mongoose.connection.db;
    const formsCollection = db.collection("forms");

    // Find all existing forms
    const existingForms = await formsCollection.find({}).toArray();
    console.log(`📊 Found ${existingForms.length} existing form submissions`);

    if (existingForms.length === 0) {
      console.log("ℹ️  No existing forms to migrate");
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const form of existingForms) {
      try {
        const updateOperations = {};
        let needsUpdate = false;

        // Prepare $set operations for regular field updates
        const setOperations = {};

        // Prepare $unset operations for field removals
        const unsetOperations = {};

        // Migrate phoneNumber to phone
        if (form.phoneNumber && !form.phone) {
          setOperations.phone = form.phoneNumber;
          unsetOperations.phoneNumber = "";
          needsUpdate = true;
          console.log(`📝 Migrating phoneNumber to phone for form ${form._id}`);
        }

        // Remove deprecated fields if they exist
        const deprecatedFields = [
          "location",
          "helpDescription",
          "questionsForUs",
        ];

        deprecatedFields.forEach((field) => {
          if (form[field] !== undefined) {
            unsetOperations[field] = "";
            needsUpdate = true;
            console.log(
              `🗑️  Removing deprecated field '${field}' from form ${form._id}`
            );
          }
        });

        // Add missing required fields with default values if they don't exist
        if (!form.linkedin) {
          setOperations.linkedin = ""; // Will need manual update
          needsUpdate = true;
          console.log(
            `⚠️  Adding empty linkedin field for form ${form._id} - needs manual update`
          );
        }

        if (!form.waitlistConsideration) {
          setOperations.waitlistConsideration = "No";
          needsUpdate = true;
          console.log(
            `📝 Setting default waitlistConsideration for form ${form._id}`
          );
        }

        // Build the update operations object
        if (Object.keys(setOperations).length > 0) {
          updateOperations.$set = setOperations;
        }

        if (Object.keys(unsetOperations).length > 0) {
          updateOperations.$unset = unsetOperations;
        }

        // Apply updates if needed
        if (needsUpdate) {
          await formsCollection.updateOne({ _id: form._id }, updateOperations);
          migratedCount++;
          console.log(`✅ Migrated form ${form._id}`);
        }
      } catch (error) {
        console.error(`❌ Error migrating form ${form._id}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   Total forms: ${existingForms.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(
      `   No changes needed: ${
        existingForms.length - migratedCount - errorCount
      }`
    );

    if (migratedCount > 0) {
      console.log("\n⚠️  Important Notes:");
      console.log("   1. Forms with empty linkedin fields need manual updates");
      console.log(
        "   2. Deprecated fields (location, helpDescription, questionsForUs) have been removed"
      );
      console.log("   3. phoneNumber fields have been renamed to phone");
      console.log(
        "   4. Test your application to ensure everything works correctly"
      );
    }

    console.log("\n🎉 Migration completed!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateFormData();
}

module.exports = { migrateFormData };
