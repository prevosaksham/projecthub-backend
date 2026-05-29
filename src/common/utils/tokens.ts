import jwt from "jsonwebtoken";

type TokenPayload = {
  id: string;
  role: string;
};

export const generateAccessToken = (payload: TokenPayload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN;

  if (!secret) throw new Error("JWT_SECRET is missing");
  if (!expiresIn) throw new Error("JWT_EXPIRES_IN is missing");

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const generateRefreshToken = (payload: TokenPayload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN;

  if (!secret) throw new Error("JWT_REFRESH_SECRET is missing");
  if (!expiresIn) throw new Error("JWT_REFRESH_EXPIRES_IN is missing");

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
};
