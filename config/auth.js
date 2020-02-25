module.exports = {
  facebookAuth : {
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
  },
  mailgun:{
    apiKey: process.env.MAILGUN_API_KEY,
  },
  cryptr: {
    key: process.env.CRYPTR_KEY,
  }
};
