import type { PreSignUpTriggerHandler } from "aws-lambda";

export const handler: PreSignUpTriggerHandler = async (event) => {
  const allowedDomainsRaw = process.env.ALLOWED_EMAIL_DOMAINS || "";
  const allowedDomains = allowedDomainsRaw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (allowedDomains.length === 0) {
    return event;
  }

  const email = event.request.userAttributes["email"];
  const domain = email?.split("@")[1]?.toLowerCase();

  if (!domain || !allowedDomains.includes(domain)) {
    throw new Error("このメールドメインからのサインアップは許可されていません。");
  }

  return event;
};
