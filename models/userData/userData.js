import mongoose from "mongoose";

const userDataSchema = mongoose.Schema({
  'data': Object,
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
}, {
  timestamps: true,
})

const UserData = mongoose.model('UserData', userDataSchema)

export default UserData
