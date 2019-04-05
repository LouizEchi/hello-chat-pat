"use-strict";

const bodyParser = require("body-parser");
const express = require("express");
const axios = require("axios");

const { port, url, client, secret } = require("./config");

/* Initialize your server */
const app = express().use(bodyParser());
/*
 * Setup Express Routes
 */
app.get("/init", initialize);
app.post("/chat", sendChatMessage);

/**
 * Initialization of the session with authentication and preloading conversation context is key
 * for our chat bot's knowledge
 */
async function initialize(_, res) {
  try {
    const response = await axios.get(
      `${url}/authenticate?client=${client}&secret=${secret}&response_type=code`
    );

    const { auth_token } = response.data.data;
    if (!auth_token) {
      throw {
        statusCode: 401,
        message: "Unauthorized access"
      };
    }

    /**
     *
     * Preloading conversations can initialize the session with Pat knowing
     */
    const preloaded_conversation = ["the shark bit the surfer"];

    let user_key = "";
    for (const data_to_match of preloaded_conversation) {
      const data = JSON.stringify({
        data_to_match,
        user_key
      });
      const response = await axios.post(`${url}/converse`, data, {
        headers: {
          Authorization: auth_token,
          "Content-Type": "application/json"
        }
      });
      const { user_key: key } = response.data.data;
      user_key = key;
    }

    res.status(200);
    res.json({
      success: true,
      token: auth_token,
      user_key
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    const message = error.data ? error.data.message : error.message;
    res.json({
      success: false,
      error: message
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
      authorization: Authorization // Retrieved during initialization
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
     * For this sample we will use NothingFound to identify if pat got the sentence
     */
    const success = !ConverseResultData.NothingFound;

    if (success) {
      res.status(200);
    } else {
      res.status(400);
    }

    res.json({
      success,
      user_key: userKey,
      message: WhatSaid
    });
  } catch (error) {
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
