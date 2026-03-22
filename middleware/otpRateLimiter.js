const otpRateLimitStore = new Map();

export const otpRateLimiter = (options = {}) => {
  const {
    max = 5,
    windowMs = 10 * 60 * 1000,
    field = "phone"
  } = options;

  return (req, res, next) => {
    const raw = req?.body?.[field];
    const phone = typeof raw === "string" ? raw.trim() : "";

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const now = Date.now();
    const record = otpRateLimitStore.get(phone);

    if (!record) {
      otpRateLimitStore.set(phone, { count: 1, firstRequestTime: now });
      return next();
    }

    const { count, firstRequestTime } = record;

    if (now - firstRequestTime < windowMs) {
      if (count >= max) {
        return res.status(429).json({
          message: `Rate limit exceeded. Max ${max} OTP requests per ${Math.round(windowMs / 60000)} minutes.`
        });
      }
      otpRateLimitStore.set(phone, { count: count + 1, firstRequestTime });
      return next();
    }

    otpRateLimitStore.set(phone, { count: 1, firstRequestTime: now });
    return next();
  };
};

