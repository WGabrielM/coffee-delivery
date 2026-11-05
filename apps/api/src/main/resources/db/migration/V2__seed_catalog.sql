-- Seed: 5 tags and 14 coffees, all at 990 cents (US$ 9.90). The copy is in .docs/BUSINESS.md.

INSERT INTO tags (slug, name, position) VALUES
  ('traditional', 'Traditional', 1),
  ('special',     'Special',     2),
  ('with-milk',   'With milk',   3),
  ('alcoholic',   'Alcoholic',   4),
  ('iced',        'Iced',        5);

INSERT INTO coffees (slug, name, description, price_in_cents, position) VALUES
  ('traditional-espresso', 'Traditional Espresso', 'The traditional coffee made with hot water and ground beans',                 990,  1),
  ('american-espresso',    'American Espresso',    'Diluted espresso, less intense than the traditional',                         990,  2),
  ('creamy-espresso',      'Creamy Espresso',      'Traditional espresso coffee with creamy foam',                                990,  3),
  ('iced-espresso',        'Iced Espresso',        'Drink prepared with espresso coffee and ice cubes',                           990,  4),
  ('coffee-with-milk',     'Coffee with Milk',     'Half and half of traditional espresso with steamed milk',                     990,  5),
  ('latte',                'Latte',                'A shot of espresso coffee with double the milk and creamy foam',              990,  6),
  ('cappuccino',           'Cappuccino',           'Cinnamon drink made of equal parts coffee, milk and foam',                    990,  7),
  ('macchiato',            'Macchiato',            'Espresso coffee mixed with a little hot milk and foam',                       990,  8),
  ('mochaccino',           'Mochaccino',           'Espresso coffee with chocolate syrup, a little milk and foam',                990,  9),
  ('hot-chocolate',        'Hot Chocolate',        'Drink made with chocolate dissolved in hot milk and coffee',                  990, 10),
  ('cuban',                'Cuban',                'Iced espresso drink with rum, cream and mint',                                990, 11),
  ('hawaiian',             'Hawaiian',             'Sweet drink prepared with coffee and coconut milk',                           990, 12),
  ('arabic',               'Arabic',               'Drink prepared with Arabian coffee beans and spices',                         990, 13),
  ('irish',                'Irish',                'Coffee-based drink with Irish whiskey, sugar and whipped cream',              990, 14);

-- The tags are matched by slug, so the seed does not depend on any generated id.
INSERT INTO coffee_tags (coffee_id, tag_id)
SELECT c.id, t.id
FROM (VALUES
  ('traditional-espresso', 'traditional'),
  ('american-espresso',    'traditional'),
  ('creamy-espresso',      'traditional'),
  ('iced-espresso',        'traditional'),
  ('iced-espresso',        'iced'),
  ('coffee-with-milk',     'traditional'),
  ('coffee-with-milk',     'with-milk'),
  ('latte',                'traditional'),
  ('latte',                'with-milk'),
  ('cappuccino',           'traditional'),
  ('cappuccino',           'with-milk'),
  ('macchiato',            'traditional'),
  ('macchiato',            'with-milk'),
  ('mochaccino',           'traditional'),
  ('mochaccino',           'with-milk'),
  ('hot-chocolate',        'special'),
  ('hot-chocolate',        'with-milk'),
  ('cuban',                'special'),
  ('cuban',                'alcoholic'),
  ('cuban',                'iced'),
  ('hawaiian',             'special'),
  ('arabic',               'special'),
  ('irish',                'special'),
  ('irish',                'alcoholic')
) AS assignment (coffee_slug, tag_slug)
JOIN coffees c ON c.slug = assignment.coffee_slug
JOIN tags t ON t.slug = assignment.tag_slug;
