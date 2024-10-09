import mongoose from "mongoose";

export const requiredAccountTransactionSchemaObject = {
  "from_account_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  "to_account_id": {
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
  "amount": {
    type: String,
    default: "0.00"
  }
}

export const requiredAccountTransactionSchemaDescription = {
  "from_account_id": "From Account ID",
  "to_account_id": "To Account ID",
  "is_credit": "Is Credit",
  "is_debit": "Is Debit",
  "amount": "Amount"
}

const accountTransactionSchema = mongoose.Schema(requiredAccountTransactionSchemaObject, {
  timestamps: true,
})

const AccountTransaction = mongoose.model('AccountTransaction', accountTransactionSchema)

export default AccountTransaction

