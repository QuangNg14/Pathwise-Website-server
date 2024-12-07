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
