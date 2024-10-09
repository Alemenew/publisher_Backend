import mongoose from "mongoose";


/**
 * Channel
 */


export const requiredChannelSchemaObject = {
  "channel_handle": String,
  "id": String,
  "title": String,
  "username": String,
  "type": String,
  "active_usernames": Array,
  "category_key": String,
  "category_value": String,
  "is_admin": Boolean,
  "is_active": {
    type: Boolean,
    default: false
  },
  "user_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
}

export const channelSchemaObjectDescription = {
  "channel_handle": "Channel handle",
  "id": "Channel ID",
  "title": "Channel title",
  "username": "Channel username",
  "type": "Channel type",
  "active_usernames": "Channel active usernames",
  "category_key": "Channel category key",
  "category_value": "Channel category value",
  "is_admin": "Admin access of channel",
  "is_active": "Is active status of channel",
  "user_id": "Channel owner/admin"
}



const channelSchema = mongoose.Schema({
  ...requiredChannelSchemaObject,
  "extra_info": Object,
  "channel_category_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelCategory'
  },
  "is_individual": {
    type: Boolean,
    default: false
  },
  "number_of_subscribers": {
    type: Number,
    default: 0
  },
  "number_of_subscribers_data": Array,
  "average_post_per_day": {
    type: Number,
    default: 0
  },
  "recent_average_view": {
    type: Number,
    default: 0
  },
  "average_view_data": Array,
  "channel_tier": String,
  "channel_tier_values": Array
}, {
  timestamps: true,
})

const Channel = mongoose.model('Channel', channelSchema)

export default Channel

/**
 * Channel Preference
 */

export const requiredChannelPreferenceSchemaObject = {
  "content_interest": Array,
  "post_time": Array
}

export const channelPreferenceSchemaObjectDescription = {
  "channel_id": "Channel ID",
  "channel_username": "Channel username",
  "content_interest": "Ad category interest",
  "post_time": "Ad post time frame"
}

const ChannelPreferenceSchema = mongoose.Schema({
  ...requiredChannelPreferenceSchemaObject,
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "channel_username": String,
  "post_ads_per_week": Boolean,
  "post_frequency": Object,
  "post_time_ids": [{ type: mongoose.Schema.Types.ObjectId, ref: 'DaySection' }],
  "content_interest_ids": [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChannelCategory' }]
}, {
  timestamps: true,
})

export const ChannelPreference = mongoose.model('ChannelPreference', ChannelPreferenceSchema)

/**
 * Channel Stat
 */

export const requiredChannelStatSchemaObject = {

}

export const channelStatDescription = {
  "last_7_days_avg_view_count": "Last 7 days average view count",
  "last_30_days_avg_view_count": "Last 30 days average view count",
  "channel_id": "Channel ID"
}

const channelStatSchema = mongoose.Schema(
  {
    "last_7_days_avg_view_count": Number,
    "last_30_days_avg_view_count": Number,
    "subscriber_count": Number,
    "7_days_avg_view_count_list": [{ type: Number }],
    "30_days_avg_view_count_list": [{ type: Number }],
    "channel_id": {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    }
  },
  {
    timestamps: true,
  }
)

export const ChannelAvgViewStat = mongoose.model("ChannelAvgViewStat", channelStatSchema)


/**
 * Channel Last X Number of Post Stat
 */
export const requiredChannelLastXNumberOfPostSchemaObject = {
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "last_post_count": Number,
  "last_message_id": Number
}


export const requiredChannelLastXNumberOfPostSchemaDescription = {
  "channel_id": "Channel ID",
  "last_post_count": "Last post count",
  "last_message_id": "Last message ID"
}

const channelLastXNumberOfPostSchema = mongoose.Schema({
  ...requiredChannelLastXNumberOfPostSchemaObject,
  "post_count_list": Array
},
  {
    timestamps: true,
  })

export const ChannelLastXNumberOfPostStat = mongoose.model("ChannelLastXNumberOfPostStat", channelLastXNumberOfPostSchema)

export const channelMessagesRequiredSchemaObject = {
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "message_id": Number,
  "message_link": String,
  "recent_view": String,
  "message_content": String,
  "date": String,
  "image_url": Array
}

const channelMessageSchema = mongoose.Schema(
  channelMessagesRequiredSchemaObject,
  {
    timestamps: true,
  }
)

export const ChannelMessage = mongoose.model('ChannelMessage', channelMessageSchema)


export const channelMessageStatSchemaObject = {
  "channel_message_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelMessage'
  },
  "recent_view": String,
  "view_records": Array
}

const channelMessageStatSchema = mongoose.Schema(
  channelMessageStatSchemaObject,
  {
    timestamps: true,
  }
)

export const ChannelMessageStat = mongoose.model('ChannelMessageStat', channelMessageStatSchema)
