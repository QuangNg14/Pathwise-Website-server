const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs"); // For temporary file cleanup
const path = require("path");
const Form = require("../models/Form");
const s3 = require("../config/s3Config");

const uploadForm = async (formData, filePath) => {
  try {
    console.log("Uploading file to AWS S3...");
    console.log("Form data received in controller:", formData);

    // Read the file content
    const fileContent = fs.readFileSync(filePath);

    // Define S3 upload parameters
    const uploadParams = {
      Bucket: process.env.FILES_BUCKET_NAME,
      Key: `resumes/${Date.now()}-${path.basename(filePath)}`, // Add timestamp to avoid conflicts
      Body: fileContent,
      ContentType: "application/pdf", // Explicitly define the content type
    };

    // Create and send the PutObjectCommand
    const command = new PutObjectCommand(uploadParams);
    const result = await s3.send(command);

    console.log("File uploaded to AWS S3:", result);

    // Prepare form data object with explicit field mapping
    const formDataToSave = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone, // Ensure this is phone, not phoneNumber
      school: formData.school,
      currentYear: formData.currentYear,
      industryPreference: formData.industryPreference,
      linkedin: formData.linkedin,
      leetcode: formData.leetcode || "",
      github: formData.github || "",
      waitlistConsideration: formData.waitlistConsideration,
      resumeUrl: `https://${process.env.FILES_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`,
    };

    // Add message if provided
    if (formData.message) {
      formDataToSave.message = formData.message;
    }

    console.log("Prepared form data for database:", formDataToSave);

    // Save form data to database with explicit field mapping
    const newForm = await Form.create(formDataToSave);

    console.log("Form data saved to database:", newForm);

    // Cleanup temporary file
    fs.unlinkSync(filePath);

    return newForm;
  } catch (error) {
    console.error("Error during file upload or database save:", error.message);
    console.error("Full error details:", error);
    throw new Error(error.message);
  }
};

module.exports = { uploadForm };
