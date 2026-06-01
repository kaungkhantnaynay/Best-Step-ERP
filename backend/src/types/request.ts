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
