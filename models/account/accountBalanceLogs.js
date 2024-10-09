import mongoose from "mongoose";


export const requiredAccountBalanceLogSchemaObject = {
  "account_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  "is_credit": {
    type: Boolean,
    default: false
  },
  "is_debit": {
    type: Boolean,
    default: false
  },
  "balance": {
    type: String,
    default: "0.00"
  },
  "amount": {
    type: String,
    default: "0.00"
  },
  "transaction_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountTransaction'
  }
}

export const requiredAccountBalanceLogSchemaDescription = {
  "account_id": "Account ID",
  "is_credit": "Is credit",
  "is_debit": "Is debit",
  "balance": "balance",
  "amount": "Amount",
  "earning_id": "Earning ID",
  "transaction_id": "Transaction ID"
}

const accountBalanceLogSchema = mongoose.Schema({
  ...requiredAccountBalanceLogSchemaObject, "earning_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IndividualEarning'
  },
}, {
  timestamps: true,
})

const AccountBalanceLog = mongoose.model('AccountBalanceLog', accountBalanceLogSchema)

export default AccountBalanceLog



