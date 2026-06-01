export type AuthContext = {
  userId: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
};

export type AccessTokenPayload = {
  sub: string;
  organizationId: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  organizationId: string;
  familyId: string;
  jti: string;
  type: "refresh";
};
