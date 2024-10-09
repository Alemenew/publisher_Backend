import mongoose from "mongoose";

export const requiredCampaignGoalSchemaObject = {
  "campaign_goal_key": String,
  "campaign_goal_value": String
}

export const campaignGoalSchemaDescription = {
  "campaign_goal_key": "Campaign goal key",
  "campaign_goal_value": "Campaign goal value"
}

const campaignGoalSchema = mongoose.Schema(requiredCampaignGoalSchemaObject,{
  timestamps: true
})

const CampaignGoal = mongoose.model("CampaignGoal", campaignGoalSchema)
export default CampaignGoal


