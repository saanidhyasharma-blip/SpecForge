export const normalPrompts: string[] = [
  "Build a CRM system for small businesses with secure login, a visual analytics dashboard, and roles for both admins and standard users to manage contacts.",
  "Create an e-commerce app with an online storefront, user shopping cart functionality, secure checkout, and an admin panel for product inventory control.",
  "Develop a secure task manager where teams can sign in, create project boards, assign tasks to members, and track completion progress with dashboard widgets.",
  "Build a medical clinic booking system featuring patient login to schedule appointments, doctors receiving notifications, and an admin panel for capacity limits.",
  "Design a social media app focusing on photo sharing, where authenticated users can upload media, leave comments, follow friends, and block spammers safely.",
  "Create an inventory backend for a warehouse, featuring barcode item scanning simulation, supplier contact databases, and alerts for managers on low stock levels.",
  "Develop an internal HR system for a company allowing employees to log working hours and request leave, alongside a manager role to approve or reject requests.",
  "Build a restaurant reservation platform with table mapping, customer accounts for repeat booking discounts, and an admin view for checking daily diner volumes.",
  "Launch a dedicated recipe sharing platform allowing home cooks to authenticate, publish their recipes with metadata tags, and save recipes from other creators.",
  "Construct a personal finance tracking tool where users register, input daily expenses, categorize transactions, and view long-term budget analytics visually."
];

export const edgeCasePrompts: string[] = [
  // A. Vague Prompts
  "Build something useful that people want to use on their phones.",
  "Create an app with a really good user interface.",
  
  // B. Conflicting Requirements
  "Build an enterprise management system with login and passwords, but absolutely no authentication layer or role checking allowed.",
  "I need a complete digital payments processing platform that holds thousands of credit transactions, but there should be no users or customer accounts.",
  
  // C. Incomplete Prompts
  "Dashboard with analytics",
  "Give me a system with 'admin', 'moderator', and 'user' roles but no actual features or data.",
  "Build a CRM",
  "Just create a complete API for some database tables.",
  
  // D. Logical Inconsistencies
  "Make an admin control panel for deleting accounts and tracking bans, but the system should actively not store any users.",
  "Create a dynamic real-time chat app for my friends but make sure it has no messaging functionality, just profiles."
];
