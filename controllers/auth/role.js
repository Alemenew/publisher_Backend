import asyncHandler from "express-async-handler"
import { logStackTrace, checkIntersection, returnErrorMessage, validatePermissions, convertKeysToLowerCase } from "../util.js"
import logger from "../../logger/logger.js"
import { Role, requiredRoleSchemaObject, roleSchemaDescription } from "../../models/auth/auth.js"
import mongoose from "mongoose"


export const createRole = asyncHandler(async (req, res) => {
  try {
    const db = mongoose.connection
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredRoleSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)

    if ([...intersection].length === [...schemaSet].length) {
      let collectionsList = await (await db.db.listCollections().toArray()).map((c) => c.name)
      let isForce = data.force === undefined ? false : data.force
      let isValid = validatePermissions(data.permissions, collectionsList, isForce)

      if (isValid === null) {
        const _role = await Role.findOne({ 'name': data.name })
        data.permissions = convertKeysToLowerCase(data.permissions)
        if (_role === null) {
          let newRole = new Role(data)
          await newRole.save()
          res.status(201).json(newRole)
        } else {
          let _id = _role.id
          const updatedRole = await Role.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
          res.json(updatedRole)
        }
      } else {
        logger.error(isValid)
        res.status(400).send(isValid)
      }
    }
    else {
      let message = returnErrorMessage(Object.keys(requiredRoleSchemaObject), dataSet, roleSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

export const getRoles = asyncHandler(async (req, res) => {
  try {
    let roles = await Role.find()
    res.json(roles)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})