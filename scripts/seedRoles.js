import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/users.js'; // Adjust the path as needed

dotenv.config();

const seedRoles = async () => {
  const roles = [
    { name: 'admin' },
    { name: 'publisher' },
    { name: 'user' },
  ];

  try {
    for (const role of roles) {
      const existingRole = await Role.findOne({ name: role.name });
      if (!existingRole) {
        await Role.create(role);
        console.log(`Role ${role.name} created`);
      }
    }
    console.log('Roles seeded successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
  } finally {
    mongoose.connection.close();
  }
};

mongoose.connect(process.env.CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    seedRoles();
  })
  .catch(err => console.log('MongoDB connection error:', err));

