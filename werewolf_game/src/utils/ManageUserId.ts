export function getOrCreateUserId(): string {
    let userId = sessionStorage.getItem("userId");
    if (!userId) {
      userId = crypto.randomUUID();
      sessionStorage.setItem("userId", userId);
    }
    return userId;
  }
  