import mongoose from "mongoose";
import bcrypt from 'bcrypt'
/**
 * Authentication
 */

export const requiredAuthSchemaObject = {
  "username": String,
  "password": String
}

export const requiredRegistrationAuthSchemaObject = {
  "username": String,
  "password": String,
  "role": Object
}

export const authSchemaDescription = {
  "username": "Username",
  "password": "Password",
  "role": "Role"
}

const authSchema = mongoose.Schema({
  ...requiredAuthSchemaObject,
  "role": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  "last_login": Date
}, {
  timestamps: true,
})

authSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Auth = mongoose.model('Auth', authSchema)



export default Auth


export const requiredRoleSchemaObject = {
  "name": String,
  "permissions": Object
}

export const roleSchemaDescription = {
  "name": "Name of role",
  "permissions": "Model's permission"
}

const roleSchema = mongoose.Schema(requiredRoleSchemaObject, {
  timestamps: true,
})

export const Role = mongoose.model("Role", roleSchema)
