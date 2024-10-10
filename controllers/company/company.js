import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js";
import { checkEmptyString, checkIntersection, logStackTrace, returnErrorMessage } from "../util.js";
import Company, { companySchemaDescription, requiredCompanySchemaObject } from "../../models/company/company.js";
import Auth, { Role, authSchemaDescription, requiredAuthSchemaObject, requiredRegistrationAuthSchemaObject } from "../../models/auth/auth.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"




// @desc    Create Company
// @route   POST /company
// @access  Private
export const createCompany = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let authSchemaSet = new Set(Object.keys(requiredRegistrationAuthSchemaObject))
    let intersection = checkIntersection(authSchemaSet, dataSet)
    if ([...intersection].length == [...authSchemaSet].length) {
      let companySchemaSet = new Set(Object.keys(requiredCompanySchemaObject))
      intersection = checkIntersection(companySchemaSet, dataSet)
      if ([...intersection].length == [...companySchemaSet].length) {
        const _role = await Role.findOne({ 'name': data.role.toString().toLowerCase() })
        if (_role !== null) {
          const _auth = await Auth.findOne({ username: data.username })
          if (_auth === null) {
            // Create an Auth row to be assigned to the company.
            const salt = await bcrypt.genSalt(10)
            data.password = await bcrypt.hash(data.password, salt)
            data.role = _role.id
            const newAuth = new Auth(data)
            await newAuth.save()

            // Create a company
            data.auth_id = newAuth._id
            const newCompany = new Company(data)
            await newCompany.save()

            res.status(201).json(newCompany)
          } else {
            logger.error("username already taken")
            res.status(400).send("username already taken")
          }
        } else {
          logger.error("Role doesn't exist.")
          res.status(400).send("Role doesn't exist.")
        }
      } else {
        let message = returnErrorMessage(Object.keys(requiredCompanySchemaObject), dataSet, companySchemaDescription)
        logger.error(message);
        res.status(400).send(message)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredRegistrationAuthSchemaObject), dataSet, authSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Login Company
// @route   POST /company/login
// @access  Public

export const loginCompany = asyncHandler(async (req, res) => {
  try {
    const data = req.body;
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredAuthSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const _auth = await Auth.findOne({ username: data.username })
      if (_auth !== null) {
        const isMatch = await _auth.comparePassword(data.password)
        if (isMatch) {
          _auth.last_login = new Date()
          _auth.save()

          const _company = await Company.findOne({ 'auth_id': _auth._id })
          if (_company !== null) {
            const token = jwt.sign({ id: _auth._id }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRATION_TIME
            })
            res.json({
              message: 'Authenticated successfully',
              company: _company,
              username: _auth.username,
              "last_login": _auth.last_login,
              token
            })
          } else {
            logger.error('No company found with these credentials')
            res.status(401).send('No company found with these credentials');
          }

        } else {
          logger.error('Invalid credentials')
          res.status(401).send('Invalid credentials');
        }
      } else {
        logger.error("user not found")
        res.status(400).send("user not found")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredAuthSchemaObject), dataSet, authSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get Companies
// @route   GET /company
// @access  Private
export const getCompanies = asyncHandler(async (req, res) => {
  try {
    const companies = await Company.find()
    res.status(200).json(companies)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Company
// @route   GET /company/:id -> mongodb ObjectID
// @access  Private
export const getCompany = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No company with that ID")
      return res.status(404).send('No company with that ID')
    }
    const company = await Company.findById(_id)
    res.json(company)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(409).json({ message: error.message })
  }
})

export const updateCompany = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No company with this ID");
      return res.status(404).send("No company with this ID")
    }
    let _company = await Company.findById(_id)
    if (_company !== null) {
      const updatedCompany = await Company.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
      res.json(updatedCompany)
    } else {
      logger.error(`No company found under ID '${_id}'`);
      res.status(400).send(`No company found under ID '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create Company
// @route   POST /company/update_password/:id -> mongodb ObjectID
// @access  Private
export const updateCompanyPassword = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid company ID");
      return res.status(404).send("Invalid company ID")
    }
    let _company = await Company.findById(_id)
    if (_company !== null) {
      if (data.password) {
        const _auth = await Auth.findById(_company.auth_id)
        if (_auth) {
          const salt = await bcrypt.genSalt(10)
          data.password = await bcrypt.hash(data.password, salt)
          let tempData = {
            "password": data.password,
            "_id": _auth._id
          }

          const updatedAuth = await Auth.findByIdAndUpdate(_auth._id, { ...tempData }, { new: true })
          res.status(200).send("Password updated successfully.")
        } else {
          logger.error(`Authentication not found under company ${_company.name}`);
          res.status(400).send(`Authentication not found under company ${_company.name}`)
        }
      } else {
        logger.error(`Password is required.`);
        res.status(400).send(`Password is required.`)
      }
    } else {
      logger.error(`No company found under ID '${_id}'`);
      res.status(400).send(`No company found under ID '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})




