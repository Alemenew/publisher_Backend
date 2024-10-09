import mongoose from "mongoose";


export const requiredCampaignSchemaObject = {
  "name": String,
  "company_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  "channel_categories_list": [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChannelCategory' }],
  "campaign_goal_list": [{ type: mongoose.Schema.Types.ObjectId, ref: 'CampaignGoal' }],
  "day_sections_list": [{ type: mongoose.Schema.Types.ObjectId, ref: 'DaySection' }],
  "KPI": String,
  "budget": Number,
  "campaign_start_date": Date,
  "campaign_end_date": Date
}

export const campaignSchemaDescription = {
  "name": "Name of the campaign",
  "company_id": "Company ID",
  "channel_categories_list": "List of channel categories",
  "day_sections_list": "List of day sections",
  "campaign_goal_list": "List of campaign goals",
  "campaign_start_date": "Campaign start date",
  "campaign_end_date": "Campaign end date",
  "KPI": "Key performance indicator",
  "budget": "Budget of the campaign",
  "status": "Campaign status"
}

const campaignSchema = mongoose.Schema({
  ...requiredCampaignSchemaObject,
  "status": { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true,
})

const Campaign = mongoose.model("Campaign", campaignSchema)
export default Campaign
