const tenant  = import.meta.env.VITE_B2C_TENANT_NAME;
const policy  = import.meta.env.VITE_B2C_POLICY || 'B2C_1_signupsignin';
const clientId = import.meta.env.VITE_B2C_CLIENT_ID;

export const msalConfig = {
  auth: {
    clientId,
    authority:             `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${policy}`,
    knownAuthorities:      [`${tenant}.b2clogin.com`],
    redirectUri:           window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
};

export const loginRequest = {
  scopes: [`https://${tenant}.onmicrosoft.com/api/requests.read`],
};
