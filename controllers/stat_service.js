import puppeteer from 'puppeteer';
import fs from 'fs';
import logger from '../logger/logger.js';
import { cleanRawFetchedChannelMessages, createOrUpdateChannelMessageView, replaceValuesFromView } from './util.js';
import { LAST_POST_COUNT } from './constants.js';


export const fetchChannelMessageAndSaveStats = async (channel_id, channel_username, message_id, last_message_id) => {
  const TELEGRAM_URL = process.env.TELEGRAM_URL
  let messages = {}
  let maxRetries = 0
  let saveIndex = 50
  let current = 0
  let messageID = parseInt(message_id)

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: `/usr/bin/google-chrome`,
    args: [`--no-sandbox`, `--headless`, `--disable-dev-shm-usage`]
  });
  while ((messageID <= parseInt(last_message_id) && maxRetries <= (LAST_POST_COUNT + 5))) {
    let isSkip = false
    logger.info(`SCRAPING FOR MESSAGE ID: ${messageID}, \nLINK: ${TELEGRAM_URL}${channel_username}/${messageID}`)

    const page = await browser.newPage();

    //go to target website 
    await page.goto(`${TELEGRAM_URL}${channel_username}/${messageID}?embed=1&mode=tme`, {
      //wait for content to load 
      waitUntil: 'networkidle0',
    });

    let message_content = await page.evaluate(() => {
      try {
        const message = document.body.querySelector(".tgme_widget_message_text")

        if (message !== undefined) {
          return message.innerHTML
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    let views = await page.evaluate(() => {
      try {
        const span = document.body.querySelector(".tgme_widget_message_views")

        if (span !== undefined) {
          return span.innerText
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    let post_date = await page.evaluate(() => {
      try {
        const p_date = document.body.querySelector(".datetime")

        if (p_date !== undefined) {
          return p_date.innerText
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    let image_html = await page.evaluate(() => {
      try {
        const post_image_html = document.body.querySelector(".tgme_widget_message_grouped_wrap")

        if (post_image_html !== undefined && post_image_html !== null) {
          return post_image_html.innerHTML
        }
        else {
          const post_image_html_one = document.body.querySelector(".tgme_widget_message_photo_wrap")
          return post_image_html_one.style.cssText
        }
      } catch (error) {
        // console.log(error.message)
        return null
      }
    })


    let messageC = ""
    let messageV = ""
    let messagePD = ""
    let messageIH = ""

    if (views) {
      messageV = replaceValuesFromView(views)
    } else {
      messageV = ""
      logger.info(`No views found for post ${messageID}`, 'warn')
    }

    if (message_content) {
      messageC = message_content
      maxRetries = 0
    } else {
      messageC = ""
      logger.info(`No content found for post ${messageID}`, 'warn')
      maxRetries += 1
      isSkip = true
      logger.info(`Retry: ${maxRetries}`, 'warn')

    }

    if (post_date) {
      messagePD = post_date
    } else {
      messagePD = ""
      logger.info(`No date found for post ${messageID}`, 'warn')
    }

    if (image_html) {
      messageIH = image_html
    } else {
      messageIH = ""
      logger.info(`No image found for post ${messageID}`, 'warn')
    }

    if (!isSkip) {
      messages[messageID] = {
        "channel_username": channel_username,
        "channel_id": channel_id,
        "message_id": messageID,
        "message_link": `${TELEGRAM_URL}${channel_username}/${messageID}`,
        "views": messageV,
        "message_content": messageC,
        "date": messagePD,
        "image_html": messageIH
      }
    }

    // fs.writeFileSync('response_1.html', html); 
    await page.close()

    messageID += 1
  }

  await browser.close();
  let cleanedJSON = cleanRawFetchedChannelMessages(messages)
  await createOrUpdateChannelMessageView(cleanedJSON)
  logger.info(`VIEWS SAVED/UPDATED FOR CHANNEL: ${channel_username} ${(last_message_id - message_id)} MESSAGES FROM MESSAGE ID ${message_id} - ${last_message_id}`)

}

export const fetchChannelLastXPostStats = async (channelUsername, lastMessageID, channelLastPostCount, channelLastXPostAds, maxRetry = 10) => {
  const TELEGRAM_URL = process.env.TELEGRAM_URL
  let list_view_stats = []
  let startMessageID = lastMessageID - channelLastPostCount
  if (startMessageID <= 0) startMessageID = 1
  let retries = 0

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: `/usr/bin/google-chrome`,
    args: [`--no-sandbox`, `--headless`, `--disable-gpu`, `--disable-dev-shm-usage`]
  })

  while (retries < maxRetry && startMessageID < lastMessageID && startMessageID > 0) {
    // logger.info(`FETCHING STAT FOR CHANNEL ${channelUsername}, MESSAGE_ID ${startMessageID}`)
    console.log(`${TELEGRAM_URL}${channelUsername}/${startMessageID}?embed=1&mode=tme`)
    const page = await browser.newPage()

    //go to target website 
    await page.goto(`${TELEGRAM_URL}${channelUsername}/${startMessageID}?embed=1&mode=tme`, {
      //wait for content to load 
      waitUntil: 'networkidle0',
    });

    let span = await page.evaluate(() => {
      try {
        const span = document.body.querySelector(".tgme_widget_message_views")

        if (span !== undefined) {
          return span.innerText
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })
    if (span) {
      list_view_stats.push({
        "message_id": startMessageID,
        "view_count": replaceValuesFromView(span),
        "timestamp": Date.now(),
        "last_message_id": lastMessageID
      })
    } else {
      retries += 1
    }

    startMessageID += 1

  }
  logger.info(`SAVING STAT FOR CHANNEL ${channelUsername}`)
  // console.log(list_view_stats)
  let tempList = channelLastXPostAds.post_count_list
  channelLastXPostAds.post_count_list = [...tempList, ...list_view_stats]
  await channelLastXPostAds.save()
  logger.info(`STAT SAVED FOR CHANNEL ${channelUsername}`)

}


export const fetchStats = async (postedAds) => {
  const TELEGRAM_URL = process.env.TELEGRAM_URL
  // console.log(TELEGRAM_URL)
  let list_view_counts = {}

  //initiate the browser 
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: `/usr/bin/google-chrome`,
    args: [`--no-sandbox`, `--headless`, `--disable-gpu`, `--disable-dev-shm-usage`]
  });
  for (let postedAd of postedAds) {


    //create a new in headless chrome 
    const page = await browser.newPage();

    //go to target website 
    await page.goto(`${TELEGRAM_URL}${postedAd.channel_username}/${postedAd.message_id}?embed=1&mode=tme`, {
      //wait for content to load 
      waitUntil: 'networkidle0',
    });
    //get full page html 
    // const html = await page.content();

    // fs.writeFileSync(`response_1.html`, html); 


    let span = await page.evaluate(() => {
      try {
        const span = document.body.querySelector(".tgme_widget_message_views")

        if (span !== undefined) {
          return span.innerText
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    // console.log(span)  
    if (span) {
      list_view_counts[postedAd.posted_ad_id] = replaceValuesFromView(span)
    } else {
      logger.error(`No stat found for post ${postedAd.posted_ad_id}`)
    }

    // fs.writeFileSync('response_1.html', html); 
    await page.close()
  }
  //close headless chrome 
  await browser.close();

  return list_view_counts
}

export const fetchStatsTest = async (postedAds) => {
  const TELEGRAM_URL = process.env.TELEGRAM_URL
  // console.log(TELEGRAM_URL)
  let list_view_counts = {}

  //initiate the browser 
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: `/usr/bin/google-chrome`,
    args: [`--no-sandbox`, `--headless`, `--disable-dev-shm-usage`]
  });
  for (let postedAd of postedAds) {


    //create a new in headless chrome 
    const page = await browser.newPage();

    //go to target website 
    await page.goto(`${TELEGRAM_URL}${postedAd.channel_username}/${postedAd.message_id}?embed=1&mode=tme`, {
      //wait for content to load 
      waitUntil: 'networkidle0',
    });
    //get full page html 
    // const html = await page.content();

    // fs.writeFileSync(`response_1.html`, html); 


    let span = await page.evaluate(() => {
      try {
        const span = document.body.querySelector(".tgme_widget_message_views")

        if (span !== undefined) {
          return span.innerText
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    console.log(span)
    if (span) {
      list_view_counts[postedAd.posted_ad_id] = replaceValuesFromView(span)
    } else {
      logger.error(`No stat found for post ${postedAd.posted_ad_id}`)
    }

    // fs.writeFileSync('response_1.html', html); 
    await page.close()
  }
  //close headless chrome 
  await browser.close();

  return list_view_counts
}

export const fetchMessageTest = async (posts) => {
  const TELEGRAM_URL = process.env.TELEGRAM_URL
  // console.log(TELEGRAM_URL)
  let messages = {}

  for (let post of posts) {

    //initiate the browser 
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: `/usr/bin/google-chrome`,
      args: [`--no-sandbox`, `--headless`, `--disable-dev-shm-usage`]
    });

    //create a new in headless chrome 
    const page = await browser.newPage();

    //go to target website 
    await page.goto(`${TELEGRAM_URL}${post.channel_username}/${post.message_id}?embed=1&mode=tme`, {
      //wait for content to load 
      waitUntil: 'networkidle0',
    });
    //get full page html 
    // const html = await page.content();

    // fs.writeFileSync(`response_1.html`, html); 


    let message_content = await page.evaluate(() => {
      try {
        const message = document.body.querySelector(".tgme_widget_message_text")

        if (message !== undefined) {
          return message.innerHTML
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    let views = await page.evaluate(() => {
      try {
        const span = document.body.querySelector(".tgme_widget_message_views")

        if (span !== undefined) {
          return span.innerText
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    let post_date = await page.evaluate(() => {
      try {
        const p_date = document.body.querySelector(".datetime")

        if (p_date !== undefined) {
          return p_date.innerText
        }
        else {
          return null
        }
      } catch (error) {
        return null
      }
    })

    let image_html = await page.evaluate(() => {
      try {
        const post_image_html = document.body.querySelector(".tgme_widget_message_grouped_wrap")

        if (post_image_html !== undefined && post_image_html !== null) {
          return post_image_html.innerHTML
        }
        else {
          const post_image_html_one = document.body.querySelector(".tgme_widget_message_photo_wrap")
          return post_image_html_one.style.cssText
        }
      } catch (error) {
        // logger.error(error.message)
        return error.message
      }
    })

    messages[post.message_id] = {
      "channel_username": post.channel_username,
      "message_id": post.message_id,
      "message_link": `${TELEGRAM_URL}${post.channel_username}/${post.message_id}`
    }
    if (views) {
      messages[post.message_id]['views'] = replaceValuesFromView(views)
    } else {
      messages[post.message_id]['views'] = ""
      logger.error(`No views found for post ${post.message_id}`)
    }

    if (message_content) {
      messages[post.message_id]['message_content'] = message_content
    } else {
      messages[post.message_id]['message_content'] = ""
      logger.error(`No content found for post ${post.message_id}`)
    }

    if (post_date) {
      messages[post.message_id]['date'] = post_date
    } else {
      messages[post.message_id]['date'] = ""
      logger.error(`No date found for post ${post.message_id}`)
    }

    if (image_html) {
      messages[post.message_id]['image_html'] = image_html
    } else {
      messages[post.message_id]['image_html'] = ""
      logger.error(`No image found for post ${post.message_id}`)
    }

    // fs.writeFileSync('response_1.html', html); 

    //close headless chrome 
    await browser.close();
  }

  return messages
}