export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload extends JwtPayload {
  iat: number;
  exp: number;
}
