// models/Module.js
const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Year",
    required: true,
  },
});

module.exports = mongoose.model("Module", moduleSchema);
