import mongoose from "mongoose";

export const requiredAccountSchemaObject = {
  "is_admin": {
    type: Boolean,
    default: false
  },
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "balance": {
    type: String,
    default: "0.00"
  }
}

export const requiredAccountSchemaDescription = {
  "is_admin": "Is Admin",
  "channel_id": "Channel ID",
  "balance": "Balance"
}

const AccountSchema = mongoose.Schema(
  { ...requiredAccountSchemaObject, "history": Array }, {
  timestamps: true,
})

const Account = mongoose.model('Account', AccountSchema)
export default Account


export const requiredAccountBalanceHistoryObject = {
  "action": String,
  "amount": String,
  "previous_balance": String,
  "current_balance": String,
  "transaction_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountTransaction'
  }
}

export const requiredAccountBalanceHistoryDescription = {
  "action": "Action (credit/debit)",
  "amount": "Amount",
  "previous_balance": "Previous Balance",
  "current_balance": "Current Balance",
  "transaction_id": "Transaction ID"
}
