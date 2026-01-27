

const videoViewSchema = {
  videoId: {
    type: "string",
    required: true
  },
  userId: {
    type: "string", // can be null for guest
    required: false
  },
  sessionId: {
    type: "string",
    required: true
  },

  watchTime: {
    type: "number",
    required: true
  },
  videoDuration: {
    type: "number",
    required: true
  },
  completionRate: {
    type: "number",
    required: true
  },

  device: {
    type: "string", // mobile | desktop | tv
    required: true
  },
  os: {
    type: "string", // android | ios | windows
    required: true
  },
  browser: {
    type: "string",
    required: true
  },

  country: {
    type: "string",
    required: true
  },
  city: {
    type: "string",
    required: false
  },

  referrer: {
    type: "string", 
    required: true
  },
  networkType: {
    type: "string", 
    required: false
  },

//   timestamp: {
//     type: "date",
//     required: true
//   }
};

module.exports = videoViewSchema;
