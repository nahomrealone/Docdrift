export function createUser(
  email: string,
  sendWelcomeEmail: boolean,
) {
  return {
    email,
    sendWelcomeEmail,
  };
}
