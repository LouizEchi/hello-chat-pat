/* Port of your API */
const port = process.env.PORT || 8080;

/**
 * The API for Pat
 */
const url = "URL HERE;

/*
 *  The Client Id you were provided with by PAT
 */
const client = "CLIENT";

/*
 *  The Secret you were provided with by PAT
 */
const secret = "SECRET";

module.exports = {
  port,
  url,
  client,
  secret
};
