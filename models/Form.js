const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    school: { type: String, required: true },
    currentYear: {
      type: String,
      required: true,
      enum: ["Freshman", "Sophomore", "Junior", "Senior"],
    },
    industryPreference: {
      type: String,
      required: true,
    },
    linkedin: { type: String, required: true },
    leetcode: { type: String },
    github: { type: String },
    resumeUrl: { type: String, required: true },
    waitlistConsideration: {
      type: String,
      required: true,
      enum: ["No", "Yes"],
      default: "No",
    },
    message: { type: String },
  },
  {
    timestamps: true,
    strict: true,
  }
);

module.exports = mongoose.model("Form", formSchema);
