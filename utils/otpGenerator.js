

const otpStore = new Map(); 


export const generateOTP = (phoneNumber) => {
  if (!phoneNumber) throw new Error("Phone number is required");

  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  
  otpStore.set(phoneNumber, otp);

  return otp;
};


export const verifyOTP = (phoneNumber, otp) => {
  if (!phoneNumber || !otp) return false;

  const storedOtp = otpStore.get(phoneNumber);
  if (storedOtp === otp) {
    otpStore.delete(phoneNumber); 
    return true;
  }

  return false;
};