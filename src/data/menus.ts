import type { Menu } from "@/types";

/** Menus indexed by restaurantId. Tier 3 restaurants don't have menus —
 *  they use the restaurant's `estimatedCart` field instead. */
export const MENUS: Record<string, Menu> = {
  "pita-jungle": {
    restaurantId: "pita-jungle",
    items: [
      {
        id: "power-bowl",
        name: "Power Bowl",
        desc: "Build-your-own bowl with protein, base, and sauce",
        price: 14.5,
        category: "Bowls",
        servingSize: 1,
        modifierGroups: [
          { id: "base", name: "Base", required: true, options: ["Quinoa", "Brown rice", "Greens"] },
          { id: "protein", name: "Protein", required: true, options: ["Chicken", "Falafel", "Salmon", "Tofu", "Beef gyro"] },
          { id: "sauce", name: "Sauce", required: true, options: ["Tzatziki", "Tahini", "Garlic", "Hummus"] },
          { id: "toppings", name: "Toppings", required: false, multi: true, options: ["Cucumber", "Tomato", "Red onion", "Feta", "Olives", "Pickled turnips"] },
        ],
      },
      {
        id: "med-bowl",
        name: "Mediterranean Bowl",
        desc: "Build-your-own with Mediterranean toppings",
        price: 13.5,
        category: "Bowls",
        servingSize: 1,
        modifierGroups: [
          { id: "base", name: "Base", required: true, options: ["Quinoa", "Brown rice", "Greens"] },
          { id: "protein", name: "Protein", required: true, options: ["Chicken", "Falafel", "Tofu"] },
          { id: "sauce", name: "Sauce", required: true, options: ["Tzatziki", "Tahini", "Garlic", "Hummus"] },
          { id: "toppings", name: "Toppings", required: false, multi: true, options: ["Cucumber", "Tomato", "Olives", "Pickled turnips", "Feta"] },
        ],
      },
      {
        id: "shawarma-wrap",
        name: "Chicken Shawarma Wrap",
        desc: "Marinated chicken in pita with garlic sauce",
        price: 12.95,
        category: "Wraps",
        servingSize: 1,
        modifierGroups: [
          { id: "spice", name: "Spice level", required: true, options: ["Mild", "Medium", "Spicy"] },
        ],
      },
      {
        id: "falafel-wrap",
        name: "Falafel Wrap",
        desc: "Crispy falafel with tahini and veggies",
        price: 11.95,
        category: "Wraps",
        servingSize: 1,
        modifierGroups: [
          { id: "sauce", name: "Sauce", required: true, options: ["Tahini", "Garlic", "Hummus"] },
        ],
      },
      {
        id: "greek-salad",
        name: "Greek Salad",
        desc: "Romaine, tomato, cucumber, feta, olives",
        price: 10.95,
        category: "Salads",
        servingSize: 1,
        modifierGroups: [
          { id: "addProtein", name: "Add protein (+$3)", required: false, options: ["None", "Chicken", "Falafel", "Salmon"] },
        ],
      },
      {
        id: "hummus-platter",
        name: "Hummus & Pita Platter",
        desc: "Classic hummus with warm pita, serves 4",
        price: 8.95,
        category: "Sides",
        servingSize: 4,
        modifierGroups: [],
      },
      {
        id: "falafel-tray",
        name: "Falafel Tray",
        desc: "12 falafel with tahini, serves 6-8",
        price: 24.0,
        category: "Sides",
        servingSize: 8,
        modifierGroups: [],
      },
      {
        id: "baklava",
        name: "Baklava Platter",
        desc: "Layered phyllo with nuts and honey, 12 pieces",
        price: 24.0,
        category: "Desserts",
        servingSize: 12,
        modifierGroups: [],
        dietaryFlags: ["contains-nuts"],
      },
    ],
  },
  "barrio-queen": {
    restaurantId: "barrio-queen",
    items: [
      {
        id: "taco-bar",
        name: "Build-Your-Own Taco Bar",
        desc: "Includes tortillas, rice, beans, salsa bar",
        price: 14.95,
        category: "Mains",
        servingSize: 1,
        modifierGroups: [
          { id: "protein", name: "Protein", required: true, options: ["Carnitas", "Chicken tinga", "Carne asada", "Veggie", "Cochinita"] },
          { id: "tortilla", name: "Tortilla", required: true, options: ["Corn", "Flour", "Mixed"] },
        ],
      },
      {
        id: "enchilada-plate",
        name: "Enchiladas Plate",
        desc: "Three enchiladas with rice and beans",
        price: 13.95,
        category: "Mains",
        servingSize: 1,
        modifierGroups: [
          { id: "filling", name: "Filling", required: true, options: ["Chicken", "Cheese", "Veggie", "Beef"] },
          { id: "sauce", name: "Sauce", required: true, options: ["Red", "Verde", "Mole"] },
        ],
      },
      {
        id: "burrito-bowl",
        name: "Burrito Bowl",
        desc: "Rice, beans, protein, salsa, sour cream, cheese",
        price: 13.5,
        category: "Mains",
        servingSize: 1,
        modifierGroups: [
          { id: "protein", name: "Protein", required: true, options: ["Carnitas", "Chicken", "Carne asada", "Veggie"] },
          { id: "rice", name: "Rice", required: true, options: ["Cilantro lime", "Brown"] },
          { id: "beans", name: "Beans", required: true, options: ["Black", "Pinto", "None"] },
        ],
      },
      {
        id: "guacamole",
        name: "Guacamole & Chips",
        desc: "Fresh guacamole with tortilla chips, serves 6",
        price: 18.0,
        category: "Sides",
        servingSize: 6,
        modifierGroups: [],
      },
      {
        id: "churros",
        name: "Churros Platter",
        desc: "12 churros with cinnamon sugar, dulce de leche dip",
        price: 22.0,
        category: "Desserts",
        servingSize: 12,
        modifierGroups: [],
      },
    ],
  },
};

export function getMenu(restaurantId: string): Menu | undefined {
  return MENUS[restaurantId];
}
