import mongoose from "mongoose";


export const requiredIndividualBotsSchemaObject = {
  "username": String,
  "token": String,
  "type": { type: String, enum: ['test', 'prod'], default: 'test' }
}

export const requiredIndividualBotsSchemaDescription = {
  "username": "Bot username",
  "token": "Bot token",
  "type": "Type"
}

const individualBotSchema = mongoose.Schema(requiredIndividualBotsSchemaObject, {
  timestamps: true,
})

const IndividualBot = mongoose.model('IndividualBot', individualBotSchema)

export default IndividualBot




