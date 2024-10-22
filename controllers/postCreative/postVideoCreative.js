import express from 'express'
import path from 'path'
import PostVideoCreative from '../../models/postCreatives/postVideoCreatives.js'
import asyncHandler from "express-async-handler"
import fs from 'fs'
import logger from '../../logger/logger.js'
import upload from '../../middleware/upload.js';

const app = express()
export const createpostVideoCreative =[
    upload.single("file"),
    asyncHandler(async(req,res)=>{
        console.log(req.body);  // Log form data
        console.log(req.file); 
    try{
        const {isRequired,name,description,platform,selectedAdFormat,selected_creative_type,min_ad_duration,startTime,endTime} = req.body
        const file = req.file
        if (!file) return res.status(400).json({ message: 'File upload failed.' });
       
         const newPostVideoCreative = new PostVideoCreative({isRequired,name,description,platform,selectedAdFormat,selected_creative_type,min_ad_duration,startTime,endTime,filePath:file.path});
        await newPostVideoCreative.save()
        res.json({ message: "creative successfully saved!", data: newPostVideoCreative });
        logger.info("creative successfully saved");
    }
    catch(error){
        logger.error(error.message)
        res.status(500).json({ message: "Server error", error });

    }
})] 

export const getAllpostVideoCreative =  asyncHandler(async(req,res)=>{
    try{
        const creatives = await PostVideoCreative.find({})
        res.json({ data: creatives });
    
    }catch(error){
        res.status(500).json({ message: "Server error", error });
    }

})

export const getPrice = asyncHandler(async(req, res) => {
    try{
    const { position, length, startTime } = req.body;
    const positionPrices = {
        full_screen: 300,
        upper_half: 200,
        bottom: 100,
        side_panel: 50,
    };
    
    const startingTimePrices = {
        t_0: 200,
        t_1_4: 150,
        t_1_2: 100,
        t_3_4: 50,
        t_end: 20,
    };

// Function to determine the length price based on the ad length
    const getLengthPrice = (length) => {
    if (length > 30) {
    return { category: '>30_sec', price: 150 };
    } else if (length > 10) {
    return { category: '10_30_sec', price: 100 };
    } else if (length > 2) {
    return { category: '2_10_sec', price: 50 };
    } else {
    return { category: '0_2_sec', price: 20 };
    }
    };
    // Validation of input
    if (!positionPrices[position] || !startingTimePrices[startTime]) {
      return res
        .status(400)
        .json({ error: 'Invalid input. Check position or start time.' });
    }
  
    // Calculate the price for the ad position
    const positionPrice = positionPrices[position];
  
    // Determine the price based on the ad length (in seconds)
    const { category, price: lengthPrice } = getLengthPrice(length);
  
    // Calculate the price for the starting time
    const startTimePrice = startingTimePrices[startTime];
  
    // Final price is the sum of the individual prices
    const finalPrice = positionPrice + lengthPrice + startTimePrice;
  
    res.json({
      position,
      lengthCategory: category,
      startTime,
      positionPrice,
      lengthPrice,
      startTimePrice,
      finalPrice});
  
  logger.info('finalePrice:' + finalPrice);
    }
    catch(error){
        logger.error(error.message)
        res.status(500).json({ message: "Server error", error });
    }
})       
  
  // Endpoint to calculate the price
//   app.post('/calculatePrice', )

export const getpostVideoCreativebyPlatform = asyncHandler(async (req, res) => {
    try {
      // Extract platform query parameter from the request
      const { platform } = req.query;
      logger.info("platform", platform);
  
      // Build the query filter
      const filter = platform ? { platform: { $in: [platform] } } : {};
  
      // Fetch filtered creatives based on platform
      const creatives = await PostVideoCreative.find(filter);
  
      // Check if any creatives were found
      if (creatives.length === 0) {
        logger.info(`No creatives found for platform: ${platform}`);
        return res.status(204).send(); // 204 No Content
      }
  
      // Return creatives if found
      res.json({ data: creatives });
      logger.info("creatives filtered by platform");
    } catch (error) {
      logger.error(error.message);
      res.status(500).json({ message: "Server error", error });
    }
  });
  

