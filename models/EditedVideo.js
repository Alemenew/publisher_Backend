// const mongoose = require('mongoose');
import mongoose from 'mongoose';
const editedVideoSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videopath: { type: String, required: true },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export const EditedVideo = mongoose.model("EditedVideo", editedVideoSchema);
