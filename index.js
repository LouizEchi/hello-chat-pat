"use-strict";

const bodyParser = require("body-parser");
const express = require("express");
const axios = require("axios");

/* Intialize your server */
const app = express().use(bodyParser());

/* Port of your API */
const port = process.env.PORT || 8080;

/**
 * The API for Pat
 */
const url = process.env.PAT_URL || "https://app.pat.ai/api/public/v1";
/*
 *  The Client Id you were provided with by PAT
 */
const client = process.env.CLIENT;

/*
 *  The Secret you were provided with by PAT
 */
const secret = process.env.SECRET;

/*
 * Setup Express Routes
 */
app.get("/initialize", initialize);
app.post("/chat", sendChatMessage);

/**
 * Initialization of the session with authentication and preloading conversation context is key
 * for our chat bot's knowledge
 */
async function initialize(_, res) {
  try {
    const response = await axios.get(`${url}/authenticate`, {
      params: {
        client: encodeURI(client),
        secret: encodeURI(secret),
        response_type: "code"
      }
    });

    const { auth_token } = response.data.data;
    if (!auth_token) {
      throw {
        statusCode: 401,
        message: "Unauthorized access"
      };
    }
    res.status(200);
    res.json({
      success: true,
      token: auth_token
    });
  } catch (e) {
    res.status(error.statusCode || 500);
    res.json({
      success: false,
      error: error.message
    });
  } finally {
    res.end();
  }
}

/**
 * Will send chat messages for current session.
 */
async function sendChatMessage(req, res) {
  const {
    data_to_match, // Text input from user
    user_key // A unique session key that is generated on the first conversation thread
  } = req.body;

  try {
    const {
      authorization: Authorization // Retrieved during authenticate
    } = req.headers;

    const data = JSON.stringify({
      data_to_match,
      user_key
    });

    const response = await axios.post(`${url}/converse`, data, {
      headers: {
        Authorization,
        "Content-Type": "application/json"
      }
    });

    const {
      user_key: userKey = user_key,
      converse_response
    } = response.data.data;
    const {
      WhatSaid, // Text reply of Pat
      /*
    "ConverseResultData": {
        "MatchNumber": 0, // Shows the number of words matched
        "FoundNumber": 0, // Number of words found in the resulting sentence, based on meaning
        "NoPolarFound": false, // A system failure – there is no valid case for the context in question.
        "PolarNoFound": false, // Means the check of the polar question didn’t match context, so we need to say “No”.
        "PolarYesFound": false, // Means the check of the polar question matched context, so we need to say “Yes”.
        "NoContentFound": false, // Means the “”I don’t know”” is in response to a who/what/where question, but there was no match
        "ContentFound": false, // If the user asks a who/what/when/where/how/why question, the NLU responds with the correct answer
        "NothingFound": false // no sentences were found Pat will return the “”I didn’t get that”” variants. worst error possible
      }
    */
      ConverseResultData
    } = converse_response.CurrentResponse;

    /*
     * For this sample we will use ContentFound to identify if pat
     */
    const success = ConverseResultData.ContentFound;

    if (success) {
      res.status(400);
    } else {
      res.status(200);
    }

    res.json({
      success,
      user_key: userKey,
      message: WhatSaid
    });
  } catch (error) {
    console.log(error);
    /*
    Handle errors
  */
    res.status(error.statusCode || 500);
    const errors =
      error.response && error.response.data.errors
        ? error.response.data.errors
        : {};
    const message = "I don't understand";

    res.json({
      success: false,
      message,
      user_key,
      errors
    });
  } finally {
    res.end();
  }
}

app.listen(port, () =>
  console.log(`Hello Pat Chat API commencing at port ${port}`)
);
