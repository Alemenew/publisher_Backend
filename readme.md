# Ad Back-end API

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)
- [Ad Back-end API](#ad-back-end-api)
  - [Controllers](#controllers)
  - [Logger](#logger)
  - [Models](#model)
  - [Routes](#routes)
  - [index.js](#index)
***
API for **Telegram As Ads Platform**
***
## Usage
To use this API, you'll need an API client like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/). The API runs on http://localhost:[PORT] remember to set PORT in your .env file.

## installation
Nodejs express Server
```
git clone https://github.com/AiQeM-Tech/ad-back-end-api
cd ad-back-end-api
npm install
npm start
curl --request GET  --url http://localhost:[PORT]/hello 
>>>>>{"message":"Hello"}
```

## Directory Structure

- `controllers`: Contains modules for handling different aspects of the application, such as account management, authentication, campaigns, channels, etc.
- `models`: Contains modules for defining the data models and schemas used in the application, such as account, campaign, channel, etc.
- `routes`: Contains modules for defining the API routes and their corresponding handlers.
- `middleware`: Contains modules for defining middleware functions that can be used to intercept and modify incoming requests.
- `logger`: Contains a module for configuring and managing application logging.
- `cron_jobs`: Contains modules for defining cron jobs and their corresponding functions.
- `constants.js`: Contains constant values used throughout the application.
- `index.js`: The entry point of the application.

## API Documentation
Please use this [API Documentation](https://google,com) as a guideline.

