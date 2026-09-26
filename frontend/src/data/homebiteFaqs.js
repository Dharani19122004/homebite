// Predefined HomeBite FAQ content - the single source for every chatbot text.
// Nothing here is generated or fetched, and none of it contains
// customer-specific data. `icon` is a Lucide icon name that AIChat.jsx maps
// to the component. `related` lists the follow-up questions offered after
// that FAQ's answer.

export const LIVE_INFO_NOTE =
  "Please open the My Orders or My Bookings section in your Customer Dashboard to view your latest information.";

export const SUPPORT_FAQ_ID = "contact-support";

export const BOT_NAME = "HomeBite Support";

export const WELCOME_MESSAGE =
  "Hi! 👋 Welcome to HomeBite Support.\n\nI'm here to help you with food ordering, groceries, home chef bookings, payments, orders, and delivery.\n\nPlease select a question below to get started.";

export const EMPTY_STATE_TEXT =
  "Choose a question below, and I'll help you with HomeBite.";

export const FOLLOW_UP_PROMPT = "Would you like to know anything else?";

export const NO_RESULTS_TEXT = "No matching questions found.";

// Questions offered under the welcome message.
export const INITIAL_SUGGESTION_IDS = [
  "what-is-homebite",
  "place-order",
  "order-groceries",
  "payment-methods",
  "order-status",
  "cancel-order",
  "book-home-chef",
  SUPPORT_FAQ_ID,
];

export const FAQ_CATEGORIES = [
  { id: "about", title: "About HomeBite", icon: "Info" },
  { id: "ordering", title: "Food & Grocery Ordering", icon: "ShoppingBasket" },
  { id: "payment", title: "Cart & Payment", icon: "CreditCard" },
  { id: "delivery", title: "Orders & Delivery", icon: "Truck" },
  { id: "chef", title: "Home Chef Booking", icon: "ChefHat" },
  { id: "support", title: "Account & Support", icon: "LifeBuoy" },
];

export const FAQS = [
  // ---------------------------------------------------
  // ABOUT HOMEBITE
  // ---------------------------------------------------
  {
    id: "what-is-homebite",
    categoryId: "about",
    question: "What is HomeBite?",
    answer:
      "HomeBite is a food and grocery ordering platform that connects customers with restaurants, grocery vendors, and home chefs. Customers can explore products, place orders, book home chefs, and track their orders through the platform.",
    keywords: ["about", "homebite", "platform", "introduction"],
    related: ["place-order", "order-groceries", SUPPORT_FAQ_ID],
  },
  {
    id: "services",
    categoryId: "about",
    question: "What services does HomeBite provide?",
    answer:
      "HomeBite provides food ordering, grocery ordering, home chef booking, order tracking, delivery services, and food rescue features, depending on the available services in the application.",
    keywords: ["services", "features", "food rescue", "delivery", "offer"],
    related: ["place-order", "order-groceries", "book-home-chef"],
  },

  // ---------------------------------------------------
  // FOOD AND GROCERY ORDERING
  // ---------------------------------------------------
  {
    id: "place-order",
    categoryId: "ordering",
    question: "How can I place an order?",
    answer:
      "To place an order, log in to your HomeBite customer account, open Restaurants or Groceries, select your preferred products, add them to your cart, review your order details, choose a payment method, and complete checkout.",
    keywords: ["order", "buy", "checkout", "place", "purchase"],
    related: ["find-restaurants", "order-groceries", "payment-methods"],
  },
  {
    id: "find-restaurants",
    categoryId: "ordering",
    question: "How can I find restaurants?",
    answer:
      "Open the Restaurants section from your Customer Dashboard. You can browse available restaurants and explore their food products.",
    keywords: ["restaurant", "food", "browse", "find"],
    related: ["place-order", "view-cart", "payment-methods"],
  },
  {
    id: "order-groceries",
    categoryId: "ordering",
    question: "How can I order groceries?",
    answer:
      "Open the Groceries section from your Customer Dashboard. Select a grocery vendor, choose the products you need, add them to your cart, and proceed to checkout.",
    keywords: ["grocery", "groceries", "vegetables", "store", "vendor"],
    related: ["food-and-groceries-together", "view-cart", "payment-methods"],
  },
  {
    id: "food-and-groceries-together",
    categoryId: "ordering",
    question: "Can I order food and groceries together?",
    answer:
      "HomeBite currently supports products from one vendor per cart. If you try to add products from another vendor, the application will display a cart conflict message. You can complete your current order before ordering from another vendor.",
    keywords: ["together", "mix", "multiple", "vendor", "conflict", "cart"],
    related: ["view-cart", "place-order", "payment-methods"],
  },

  // ---------------------------------------------------
  // CART AND PAYMENT
  // ---------------------------------------------------
  {
    id: "view-cart",
    categoryId: "payment",
    question: "How can I view my cart?",
    answer:
      "Open the Cart section from your Customer Dashboard to review selected products, quantities, subtotal, delivery charges, and total amount.",
    keywords: ["cart", "basket", "items", "total"],
    related: ["payment-methods", "place-order", "food-and-groceries-together"],
  },
  {
    id: "payment-methods",
    categoryId: "payment",
    question: "What payment methods are available?",
    answer:
      "HomeBite supports the payment methods configured in the checkout page, such as Cash on Delivery and the available online payment option. Please check the checkout page for the currently enabled methods.",
    keywords: ["payment", "pay", "cod", "cash on delivery", "razorpay", "online"],
    related: ["payment-not-working", "place-order", "order-status"],
  },
  {
    id: "payment-not-working",
    categoryId: "payment",
    question: "Why is my payment not working?",
    answer:
      "Check your internet connection, verify your payment details, and try again. If the problem continues, contact HomeBite support. Do not retry a payment repeatedly if money has already been deducted.\n\nTo see the payment status of a specific order, open My Orders in your Customer Dashboard.",
    keywords: ["payment", "failed", "not working", "error", "deducted", "money"],
    related: ["payment-status", SUPPORT_FAQ_ID, "payment-methods"],
  },
  {
    id: "payment-status",
    categoryId: "payment",
    question: "What is my payment status?",
    answer: LIVE_INFO_NOTE,
    keywords: ["payment", "status", "paid", "pending", "my payment"],
    related: ["order-status", "payment-not-working", SUPPORT_FAQ_ID],
  },

  // ---------------------------------------------------
  // ORDERS AND DELIVERY
  // ---------------------------------------------------
  {
    id: "order-status",
    categoryId: "delivery",
    question: "How can I check my order status?",
    answer: `Open the My Orders section from your Customer Dashboard to view your orders and their current status.\n\n${LIVE_INFO_NOTE}`,
    keywords: ["order", "status", "track", "my order", "where"],
    related: ["order-statuses", "where-is-delivery", "cancel-order"],
  },
  {
    id: "order-statuses",
    categoryId: "delivery",
    question: "What are the order statuses?",
    answer:
      "An order can show these statuses: Pending, Accepted, Preparing, Ready, Out For Delivery, and Delivered. An order can also be Cancelled or Rejected.\n\nOnce your order is ready, a delivery partner is assigned and the delivery moves through Delivery Partner Assigned and Picked Up before it is Out For Delivery. The status shown in My Orders depends on the progress of your order.",
    keywords: [
      "status",
      "statuses",
      "pending",
      "accepted",
      "preparing",
      "ready",
      "delivered",
      "picked up",
      "stages",
    ],
    related: ["where-is-delivery", "order-delayed", "cancel-order"],
  },
  {
    id: "cancel-order",
    categoryId: "delivery",
    question: "How can I cancel my order?",
    answer:
      "Open My Orders and choose the cancel option for the order. You can cancel eligible orders, except when the order is already Delivered, Cancelled, or Rejected.",
    keywords: ["cancel", "cancellation", "order", "stop"],
    related: ["order-status", SUPPORT_FAQ_ID, "place-order"],
  },
  {
    id: "where-is-delivery",
    categoryId: "delivery",
    question: "Where is my delivery?",
    answer: `Open My Orders to check your order and delivery status. If delivery tracking information is available, it will be displayed there.\n\n${LIVE_INFO_NOTE}`,
    keywords: ["delivery", "where", "track", "tracking", "location", "partner"],
    related: ["order-delayed", "order-statuses", SUPPORT_FAQ_ID],
  },
  {
    id: "order-delayed",
    categoryId: "delivery",
    question: "What should I do if my order is delayed?",
    answer:
      "Check your order status in My Orders. If the order remains delayed, contact HomeBite support with your order details.",
    keywords: ["delay", "delayed", "late", "slow", "waiting"],
    related: ["where-is-delivery", SUPPORT_FAQ_ID, "cancel-order"],
  },

  // ---------------------------------------------------
  // HOME CHEF BOOKING
  // ---------------------------------------------------
  {
    id: "book-home-chef",
    categoryId: "chef",
    question: "How can I book a home chef?",
    answer:
      "Open the Home Chefs section, select an available home chef, review the chef details, and choose the booking or appointment request option shown on the page.",
    keywords: ["book", "booking", "home chef", "chef", "appointment", "event"],
    related: ["check-booking", "cancel-booking", SUPPORT_FAQ_ID],
  },
  {
    id: "check-booking",
    categoryId: "chef",
    question: "How can I check my home chef booking?",
    answer: `Open My Bookings from your Customer Dashboard to view your home chef booking details and status.\n\n${LIVE_INFO_NOTE}`,
    keywords: ["booking", "status", "my booking", "chef", "check"],
    related: ["cancel-booking", "book-home-chef", SUPPORT_FAQ_ID],
  },
  {
    id: "cancel-booking",
    categoryId: "chef",
    question: "Can I cancel my home chef booking?",
    answer:
      "Open My Bookings and check whether cancellation is available for your booking. The available cancellation options depend on the booking status and HomeBite's implemented rules.",
    keywords: ["cancel", "booking", "chef", "cancellation"],
    related: ["check-booking", "book-home-chef", SUPPORT_FAQ_ID],
  },

  // ---------------------------------------------------
  // ACCOUNT AND SUPPORT
  // ---------------------------------------------------
  {
    id: "update-profile",
    categoryId: "support",
    question: "How can I update my profile?",
    answer:
      "Open the Profile section from your Customer Dashboard. You can update the profile information supported by the application.",
    keywords: ["profile", "account", "update", "edit", "name", "phone"],
    related: ["forgot-password", "place-order", SUPPORT_FAQ_ID],
  },
  {
    id: "forgot-password",
    categoryId: "support",
    question: "I forgot my password. What should I do?",
    answer:
      "Use the Forgot Password option on the login page. HomeBite will guide you through OTP verification, and then you can set a new password on the Reset Password page.",
    keywords: ["password", "forgot", "reset", "otp", "login", "verification"],
    related: ["update-profile", SUPPORT_FAQ_ID, "place-order"],
  },
  {
    id: SUPPORT_FAQ_ID,
    categoryId: "support",
    question: "How can I contact customer support?",
    answer:
      "Support contact details are not available yet. Please contact the HomeBite administrator.",
    keywords: ["support", "contact", "help", "email", "phone", "administrator"],
    related: ["order-status", "place-order", "thank-you"],
  },
  {
    id: "thank-you",
    categoryId: "support",
    question: "Thank you",
    answer: "You're welcome! I'm happy to help you with HomeBite.",
    keywords: ["thanks", "thank", "thank you"],
    related: ["what-is-homebite", "place-order", "book-home-chef"],
  },
];

// ---------------------------------------------------
// LOOKUP HELPERS (local data only)
// ---------------------------------------------------

export const getFaqById = (id) => FAQS.find((faq) => faq.id === id);

export const getFaqsByIds = (ids) =>
  ids.map(getFaqById).filter(Boolean);

export const getFaqsByCategory = (categoryId) =>
  FAQS.filter((faq) => faq.categoryId === categoryId);

export const getFollowUps = (faqId) =>
  getFaqsByIds(getFaqById(faqId)?.related || []);

// Every word typed must appear in the question, its keywords or its
// category title. Runs on the local list only.
export const searchFaqs = (query) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  if (words.length === 0) return [];

  return FAQS.filter((faq) => {
    const category = FAQ_CATEGORIES.find((c) => c.id === faq.categoryId);
    const haystack = [faq.question, ...faq.keywords, category?.title || ""]
      .join(" ")
      .toLowerCase();

    return words.every((word) => haystack.includes(word));
  });
};
