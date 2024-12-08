const Form = require("../models/Form");
const s3 = require("../config/s3Config");
const fs = require("fs"); // For temporary file cleanup
const path = require("path");

const uploadForm = async (formData, filePath) => {
  try {
    console.log("Uploading file to AWS S3...");

    // Read the file content
    const fileContent = fs.readFileSync(filePath);

    // Define S3 upload parameters
    const uploadParams = {
      Bucket: process.env.FILES_BUCKET_NAME,
      Key: `resumes/${path.basename(filePath)}`, // Define the key for the file in S3
      Body: fileContent,
      ContentType: "application/pdf", // Explicitly define the content type
    };

    // Upload the file to S3
    const result = await s3.upload(uploadParams).promise();

    console.log("File uploaded to AWS S3:", result.Location);

    // Save form data to database
    const newForm = await Form.create({
      ...formData,
      resumeUrl: result.Location, // Save the S3 file URL
    });

    console.log("Form data saved to database.");

    // Cleanup temporary file
    fs.unlinkSync(filePath);

    return newForm;
  } catch (error) {
    console.error("Error during file upload or database save:", error.message);
    throw new Error(error.message);
  }
};

module.exports = { uploadForm };
