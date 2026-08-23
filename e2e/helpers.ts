export const roleCreds = {
  admin: { email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD },
  cashier: { email: process.env.TEST_CASHIER_EMAIL, password: process.env.TEST_CASHIER_PASSWORD },
  kitchen: { email: process.env.TEST_KITCHEN_EMAIL, password: process.env.TEST_KITCHEN_PASSWORD },
};

export const hasRoleCreds = {
  admin: !!(roleCreds.admin.email && roleCreds.admin.password),
  cashier: !!(roleCreds.cashier.email && roleCreds.cashier.password),
  kitchen: !!(roleCreds.kitchen.email && roleCreds.kitchen.password),
};
