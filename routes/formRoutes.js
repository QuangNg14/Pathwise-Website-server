const express = require("express");
const multer = require("multer");
const { uploadForm } = require("../controllers/formController");

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Temporary storage for files

// Form submission with file upload
router.post("/submit", upload.single("resume"), async (req, res) => {
  try {
    console.log("Received a form submission request.");

    const formData = req.body;
    console.log("Form data received:", formData);

    // Validate required fields - updated to match current schema
    const requiredFields = [
      "fullName",
      "email",
      "phone", // Changed from phoneNumber to phone
      "school",
      "currentYear",
      "industryPreference",
      "linkedin",
      "waitlistConsideration",
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate industry preference enum values
    const validIndustries = [
      "Investment Banking",
      "Software Engineering",
      "Data Engineering/Data Science/Machine Learning",
      "Consulting",
      "Finance (FP&A, corp fin, accounting,..)",
      "Other",
    ];

    if (!validIndustries.includes(formData.industryPreference)) {
      console.error(
        "Invalid industry preference:",
        formData.industryPreference
      );
      return res.status(400).json({
        success: false,
        message: `Invalid industry preference. Must be one of: ${validIndustries.join(
          ", "
        )}`,
      });
    }

    // Validate waitlist consideration enum values
    const validWaitlistOptions = ["No", "Yes"];
    if (!validWaitlistOptions.includes(formData.waitlistConsideration)) {
      console.error(
        "Invalid waitlist consideration:",
        formData.waitlistConsideration
      );
      return res.status(400).json({
        success: false,
        message: `Invalid waitlist consideration. Must be one of: ${validWaitlistOptions.join(
          ", "
        )}`,
      });
    }

    // Check if file is present
    if (!req.file) {
      console.error("Resume file is missing.");
      return res
        .status(400)
        .json({ success: false, message: "Resume file is required." });
    }

    // Check if the file is a PDF
    if (req.file.mimetype !== "application/pdf") {
      console.error("Invalid file type. Only PDFs are allowed.");
      return res
        .status(400)
        .json({ success: false, message: "Only PDF files are allowed." });
    }

    console.log("File uploaded successfully:", req.file.path);

    const newForm = await uploadForm(formData, req.file.path);

    console.log("Form saved successfully in the database:", newForm);
    res.status(201).json({ success: true, data: newForm });
  } catch (error) {
    console.error("Error occurred during form submission:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
