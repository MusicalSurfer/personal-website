export const services = [
  { value: "website-management", label: "Website management" },
  { value: "website-creation", label: "Website creation" },
  { value: "custom-application", label: "Custom application" },
  { value: "not-sure", label: "Let’s work it out together" },
];

export const limits = { name: 100, email: 254, message: 5000 };
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_{}|~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isEmail(value) {
  return typeof value === "string" && value.length <= limits.email && value.split("@")[0].length <= 64 && emailPattern.test(value);
}

export function fieldErrors(fields) {
  const errors = {};
  if (typeof fields.name !== "string" || fields.name.trim().length < 2 || fields.name.trim().length > limits.name || /[\u0000-\u001f\u007f]/.test(fields.name)) errors.name = "Enter your name (2–100 characters).";
  if (typeof fields.email !== "string" || !isEmail(fields.email.trim())) errors.email = "Enter a valid email address so I can reply.";
  if (!services.some(service => service.value === fields.service)) errors.service = "Choose a service, or select that you’re not sure yet.";
  if (typeof fields.message !== "string" || fields.message.trim().length < 20 || fields.message.trim().length > limits.message || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(fields.message)) errors.message = "Tell me a little about your project (20–5,000 characters).";
  return errors;
}
