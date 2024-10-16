import mongoose from 'mongoose';
import Users from '../../models/users.js';

export const UsersDetailUpdate = async (req, res) => {
    const { _id, name, phoneNumber } = req.body;

    // Validate input
    if (!_id || !name || !phoneNumber) {
        return res.status(400).send('Missing required fields: _id, name, phone number.');
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).send('Invalid ID format.');
    }

    try {
        const user = await Users.findByIdAndUpdate(_id, {
            name: name,
            phoneNumber: phoneNumber
        }, { new: true, runValidators: true });  // 'new: true' returns the updated object

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).json({ message: "User updated successfully", data: user });
    } catch (error) {
        // It is helpful to log the error to the console for debugging
        console.error("Error updating user:", error);
        // Send more detailed error information to the client
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};
