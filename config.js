/* Port of your API */
const port = process.env.PORT || 8080;

/**
 * The API for Pat
 */
const url = process.env.PAT_URL;

/*
 *  The Client Id you were provided with by PAT
 */
const client = process.env.CLIENT;

/*
 *  The Secret you were provided with by PAT
 */
const secret = process.env.SECRET;

module.exports = {
  port,
  url,
  client,
  secret
};
