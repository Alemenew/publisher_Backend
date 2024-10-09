import mongoose from "mongoose";

export const requiredCompanySchemaObject = {
  "name": String
}

export const companySchemaDescription = {
  "name": "Name of company",
  "auth_id": "Authentication credentials"
}

const companySchema = mongoose.Schema(
  {
    ...requiredCompanySchemaObject, "auth_id": {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auths'
    }
  },
  {
    timestamps: true,
  }
)

const Company = mongoose.model('Company', companySchema)
export default Company


