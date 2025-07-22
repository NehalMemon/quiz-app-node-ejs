// models/Year.js
const mongoose = require("mongoose");

const yearSchema = new mongoose.Schema({
  name: {
    type: Number,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("Year", yearSchema);
