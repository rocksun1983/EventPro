
const rateLimitStore = new Map(); 

const MAX_SMS = 3; 
const WINDOW_MS = 10 * 60 * 1000; 

export const smsRateLimiter = (req, res, next) => {
  const phoneNumber = req.body.phoneNumber;
  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone number required" });
  }

  const now = Date.now();
  const record = rateLimitStore.get(phoneNumber);

  if (!record) {
    
    rateLimitStore.set(phoneNumber, { count: 1, firstRequestTime: now });
    return next();
  }

  const { count, firstRequestTime } = record;

  if (now - firstRequestTime < WINDOW_MS) {
   
    if (count >= MAX_SMS) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Max ${MAX_SMS} SMS per 10 minutes.`
      });
    } else {
      
      rateLimitStore.set(phoneNumber, { count: count + 1, firstRequestTime });
      return next();
    }
  } else {
    
    rateLimitStore.set(phoneNumber, { count: 1, firstRequestTime: now });
    return next();
  }
};