import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: String,
  permissions: [String],
  // other fields...
});

export const Role = mongoose.model('Role', roleSchema);

