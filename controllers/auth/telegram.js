import Users from '../../models/users.js';


// Controller for tracking platform clicks
export const trackTelegram = async (req, res) => {
    const { userId, platform } = req.body;

    // Validate request payload
    if (!userId || !platform) {
        return res.status(400).json({ error: "User ID and platform are required" });
    }

    try {
        // Update the user's platform array, adding 'Telegram' (or other platforms) only if it's not already in the array
        const user = await Users.findOneAndUpdate(
            { _id: userId },
            { $addToSet: { platforms: platform } },  // Adds the platform without duplicating existing ones
            { new: true }  // Return the updated document
        );

        // Check if user was found and updated
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Respond with success if platform was updated
        res.status(200).json({ success: true, message: `Platform ${platform} added successfully` });

    } catch (error) {
        // Handle any server errors
        console.error('Error updating platform:', error);
        res.status(500).json({ success: false, message: 'Error updating platform' });
    }
};


