import jwt from "jsonwebtoken";

type TokenPayload = {
  id: string;
  role: string;
};

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,

    process.env.JWT_SECRET!,

    {
      expiresIn: "5h",
    },
  );
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,

    process.env.JWT_REFRESH_SECRET!,

    {
      expiresIn: "7d",
    },
  );
};
