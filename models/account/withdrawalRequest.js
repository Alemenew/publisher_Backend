import mongoose from "mongoose";


export const requiredWithdrawalRequestSchemaObject = {
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "withdrawal_amount": String
}

export const requiredWithdrawalRequestSchemaDescription = {
  "channel_id": "Channel ID",
  "withdrawal_amount": "Withdrawal Amount"
}

const withdrawalRequestSchema = mongoose.Schema({
  ...requiredWithdrawalRequestSchemaObject,
  "approved_at": Date,
  "is_approved": { type: Boolean, default: false },
  "account_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }
}, {
  timestamps: true,
})

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema)

export default WithdrawalRequest

