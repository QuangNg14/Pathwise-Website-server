const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    location: {
      type: String,
      required: true,
      enum: ["Vietnam", "USA", "Australia", "Singapore", "Other"],
    },
    school: { type: String, required: true },
    currentYear: {
      type: String,
      required: true,
      enum: ["Freshman", "Sophomore", "Junior", "Senior"],
    },
    industryPreference: {
      type: String,
      required: true,
      enum: [
        "Investment Banking",
        "Software Engineering",
        "Data Engineering/Data Science/Machine Learning",
        "Consulting",
        "Other",
      ],
    },
    helpDescription: { type: String },
    resumeUrl: { type: String, required: true },
    questionsForUs: { type: String },
    waitlistConsideration: {
      type: String,
      enum: ["No", "Yes"],
      default: "No",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Form", formSchema);
