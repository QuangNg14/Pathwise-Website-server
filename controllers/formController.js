const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs"); // For temporary file cleanup
const path = require("path");
const Form = require("../models/Form");
const s3 = require("../config/s3Config");

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

    // Create and send the PutObjectCommand
    const command = new PutObjectCommand(uploadParams);
    const result = await s3.send(command);

    console.log("File uploaded to AWS S3:", result);

    // Save form data to database
    const newForm = await Form.create({
      ...formData,
      resumeUrl: `https://${process.env.FILES_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`, // Save the S3 file URL
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
