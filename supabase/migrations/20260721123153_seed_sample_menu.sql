-- Demo data only — replace/remove via the admin dashboard once real menu
-- content is entered (Phase 5).
insert into public.categories (name_en, name_ar, sort_order) values
  ('Starters', 'مقبلات', 1),
  ('Mains', 'أطباق رئيسية', 2),
  ('Drinks', 'مشروبات', 3);

insert into public.menu_items (category_id, name_en, name_ar, description_en, description_ar, price, allergens, is_available)
select id, 'Hummus', 'حمص', 'Creamy chickpea dip with olive oil and paprika', 'حمص كريمي بزيت الزيتون والبابريكا', 3.50, array['sesame'], true
from public.categories where name_en = 'Starters'
union all
select id, 'Fattoush', 'فتوش', 'Mixed greens, toasted bread, sumac dressing', 'خضار مشكلة، خبز محمص، تتبيلة السماق', 4.00, array[]::text[], true
from public.categories where name_en = 'Starters'
union all
select id, 'Grilled Chicken', 'دجاج مشوي', 'Half chicken, garlic sauce, fries', 'نصف دجاجة، ثومية، بطاطا مقلية', 8.50, array[]::text[], true
from public.categories where name_en = 'Mains'
union all
select id, 'Beef Kebab', 'كباب لحم', 'Grilled beef skewers with rice', 'أسياخ لحم مشوية مع أرز', 9.50, array[]::text[], false
from public.categories where name_en = 'Mains'
union all
select id, 'Fresh Lemonade', 'ليموناضة طازجة', 'With mint', 'مع نعناع', 2.50, array[]::text[], true
from public.categories where name_en = 'Drinks'
union all
select id, 'Ayran', 'عيران', 'Chilled yogurt drink', 'مشروب لبن بارد', 2.00, array['dairy'], true
from public.categories where name_en = 'Drinks';
