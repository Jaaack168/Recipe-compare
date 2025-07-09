import React from 'react';
// Sample recipe data for different categories
export const recipeData = {
  // Original suggested recipes
  suggested: [{
    id: 1,
    title: '10-min Veggie Pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '10 min',
    price: '£3.20'
  }, {
    id: 2,
    title: 'Avocado Toast',
    image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '5 min',
    price: '£2.50'
  }, {
    id: 3,
    title: 'Chicken Stir Fry',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '15 min',
    price: '£4.75'
  }, {
    id: 4,
    title: 'Greek Salad',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '8 min',
    price: '£3.80'
  }, {
    id: 5,
    title: 'Berry Smoothie Bowl',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '7 min',
    price: '£3.50'
  }],
  // Trending recipes
  trending: [{
    id: 101,
    title: 'Garlic Butter Shrimp Pasta',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '18 min',
    price: '£5.40'
  }, {
    id: 102,
    title: 'Korean Bibimbap Bowl',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '22 min',
    price: '£4.90'
  }, {
    id: 103,
    title: 'Pesto Chicken Panini',
    image: 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '12 min',
    price: '£3.95'
  }, {
    id: 104,
    title: 'Beef Burrito Bowl',
    image: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '15 min',
    price: '£6.20',
    available: false
  }, {
    id: 105,
    title: 'Butternut Squash Risotto',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '28 min',
    price: '£4.50'
  }],
  // Quick & Easy
  quickEasy: [{
    id: 201,
    title: '5-min Egg Sandwich',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '5 min',
    price: '£2.20'
  }, {
    id: 202,
    title: 'Speedy Tuna Wrap',
    image: 'https://images.unsplash.com/photo-1628191010210-a59de33e5941?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '8 min',
    price: '£3.10'
  }, {
    id: 203,
    title: 'Microwave Mug Omelette',
    image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '3 min',
    price: '£1.90'
  }, {
    id: 204,
    title: 'Instant Noodle Upgrade',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '10 min',
    price: '£2.50'
  }, {
    id: 205,
    title: 'Quick Bean Quesadilla',
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '12 min',
    price: '£2.80'
  }],
  // High Protein
  highProtein: [{
    id: 301,
    title: 'Grilled Chicken & Quinoa',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '25 min',
    price: '£4.90'
  }, {
    id: 302,
    title: 'Salmon & Lentil Bowl',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '20 min',
    price: '£6.30'
  }, {
    id: 303,
    title: 'Greek Yogurt Protein Bowl',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '5 min',
    price: '£3.20'
  }, {
    id: 304,
    title: 'Turkey Meatballs & Veg',
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '22 min',
    price: '£4.50'
  }, {
    id: 305,
    title: 'Tofu Scramble Breakfast',
    image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '12 min',
    price: '£3.10',
    available: false
  }],
  // Vegan & Vegetarian
  veganVegetarian: [{
    id: 401,
    title: 'Chickpea Buddha Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '15 min',
    price: '£3.80'
  }, {
    id: 402,
    title: 'Mushroom Risotto',
    image: 'https://images.unsplash.com/photo-1673421009662-b8b31f0f9c1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '25 min',
    price: '£4.20'
  }, {
    id: 403,
    title: 'Lentil & Sweet Potato Curry',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '30 min',
    price: '£3.50'
  }, {
    id: 404,
    title: 'Cauliflower Buffalo Bites',
    image: 'https://images.unsplash.com/photo-1598449426314-8b02525e8733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '20 min',
    price: '£3.90'
  }, {
    id: 405,
    title: 'Quinoa Stuffed Peppers',
    image: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '35 min',
    price: '£4.10'
  }],
  // Budget Friendly
  budgetFriendly: [{
    id: 501,
    title: 'Bean & Rice Burrito',
    image: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '15 min',
    price: '£1.80'
  }, {
    id: 502,
    title: 'Pasta with Tomato Sauce',
    image: 'https://images.unsplash.com/photo-1627042633145-b780d842ba0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '12 min',
    price: '£1.50'
  }, {
    id: 503,
    title: 'Potato & Egg Hash',
    image: 'https://images.unsplash.com/photo-1594834749740-74b3f6764be4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '18 min',
    price: '£1.90'
  }, {
    id: 504,
    title: 'Lentil Soup',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '25 min',
    price: '£2.10'
  }, {
    id: 505,
    title: 'Tuna & Sweetcorn Jacket Potato',
    image: 'https://images.unsplash.com/photo-1606851091851-e8c8c0fca5ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '8 min',
    price: '£2.30'
  }],
  // Healthy Picks
  healthyPicks: [{
    id: 601,
    title: 'Mediterranean Salad Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '10 min',
    price: '£4.10'
  }, {
    id: 602,
    title: 'Baked Salmon & Asparagus',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '20 min',
    price: '£6.50'
  }, {
    id: 603,
    title: 'Zucchini Noodles with Pesto',
    image: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '15 min',
    price: '£3.80'
  }, {
    id: 604,
    title: 'Spinach & Berry Smoothie Bowl',
    image: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '5 min',
    price: '£3.20'
  }, {
    id: 605,
    title: 'Turkey & Avocado Lettuce Wraps',
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '12 min',
    price: '£4.30',
    available: false
  }],
  // Comfort Classics
  comfortClassics: [{
    id: 701,
    title: 'Mac & Cheese',
    image: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '25 min',
    price: '£3.90'
  }, {
    id: 702,
    title: 'Classic Beef Burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '20 min',
    price: '£4.80'
  }, {
    id: 703,
    title: 'Chicken Tikka Masala',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '30 min',
    price: '£5.20'
  }, {
    id: 704,
    title: 'Spaghetti Bolognese',
    image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '25 min',
    price: '£4.10'
  }, {
    id: 705,
    title: 'Beef Stew with Dumplings',
    image: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '45 min',
    price: '£5.50'
  }],
  // Meal Prep Favourites
  mealPrep: [{
    id: 801,
    title: 'Chicken & Rice Meal Prep',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '35 min',
    price: '£3.20'
  }, {
    id: 802,
    title: 'Vegetable Lasagna',
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '50 min',
    price: '£3.80'
  }, {
    id: 803,
    title: 'Turkey Chili',
    image: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '40 min',
    price: '£3.50'
  }, {
    id: 804,
    title: 'Quinoa & Roasted Veg Boxes',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '30 min',
    price: '£3.40'
  }, {
    id: 805,
    title: 'Breakfast Oatmeal Cups',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
    time: '25 min',
    price: '£2.10'
  }]
};