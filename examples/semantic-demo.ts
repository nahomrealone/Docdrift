export function createUser(
  email: string,
  options: {
    sendWelcomeEmail: boolean;
    role: string;
  },
) {
  return {
    email,
    ...options,
  };
}
