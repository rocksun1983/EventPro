
export const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== "string") return false;

  
  const regex = /^\+[1-9]\d{9,14}$/;
  return regex.test(phoneNumber);
};