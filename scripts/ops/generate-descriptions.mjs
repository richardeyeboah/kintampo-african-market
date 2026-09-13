/**
 * LEGACY — prefer scripts/rewrite-descriptions.mjs (unique per-SKU utility copy).
 * This older generator produced shared template blurbs and caused duplicate SEO copy.
 *
 * Generates SEO-friendly product descriptions for all products missing one.
 * Uses built-in knowledge of African & Caribbean grocery products.
 * Run: node --env-file=.env.local scripts/generate-descriptions.mjs
 * Add --apply to save to Supabase (default is dry-run preview).
 */

import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const ONLY_MISSING = !process.argv.includes('--all')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// ---------------------------------------------------------------------------
// Description generator — uses product name + category to write smart copy
// ---------------------------------------------------------------------------

function extractWeight(name) {
  const m = name.match(/(\d+\.?\d*)\s*(kg|g|lb|lbs|oz|ml|l|litre|liter|cl|gallon)/i)
  if (m) return `${m[1]}${m[2].toLowerCase()}`
  return null
}

function extractCount(name) {
  const m = name.match(/(\d+)\s*(pack|pcs|pieces|count|ct|x\s*\d+)/i)
  if (m) return `${m[1]}-pack`
  return null
}

const CATEGORY_INTROS = {
  'Flours & Rice': 'A pantry staple',
  'Fresh Produce': 'Fresh and naturally grown',
  'Beverages': 'A popular drink',
  'Meat and Seafood': 'Quality',
  'Spices': 'An essential spice',
  'Dairy And Tea': 'A classic favourite',
  'Bread': 'Freshly baked',
  'Snack': 'A tasty snack',
  'Canned': 'A convenient pantry staple',
  'Cosmetics': 'A trusted beauty product',
  'Frozen': 'Frozen for freshness',
  'Condiments': 'A flavourful condiment',
  'Oils': 'A quality cooking oil',
  'Grains & Cereals': 'A wholesome grain',
  'Dry Goods': 'A kitchen essential',
}

const CATEGORY_USES = {
  'Flours & Rice': 'Perfect for fufu, swallow, rice dishes, and African stews.',
  'Fresh Produce': 'Great for soups, stews, and traditional African and Caribbean cooking.',
  'Beverages': 'Best served chilled. Enjoy on its own or with meals.',
  'Meat and Seafood': 'Ideal for soups, stews, grills, and traditional West African dishes.',
  'Spices': 'Adds authentic flavour to soups, stews, rice, and grilled meats.',
  'Dairy And Tea': 'Perfect with breakfast, desserts, or as a refreshing hot drink.',
  'Bread': 'Great as a snack, with spreads, or alongside soups and stews.',
  'Snack': 'Great on the go or as a treat any time of day.',
  'Canned': 'Ready to use — ideal for quick meals, soups, and stews.',
  'Cosmetics': 'Suitable for all skin types. A staple in African beauty routines.',
  'Frozen': 'Convenient and ready to cook — great for busy weeknights.',
  'Condiments': 'Enhances the flavour of any meal. A kitchen must-have.',
  'Oils': 'Versatile for frying, sautéing, and seasoning traditional dishes.',
  'Grains & Cereals': 'Nutritious and filling. A staple of the African and Caribbean diet.',
  'Dry Goods': 'A versatile ingredient used across many African and Caribbean recipes.',
}

// Per-keyword overrides for common products
const KEYWORD_DESCRIPTIONS = {
  'palm oil': 'Cold-pressed red palm oil, rich in vitamin A and E. An essential ingredient in West African cooking — used in soups, stews, jollof rice, and egusi.',
  'palm kernel oil': 'Unrefined palm kernel oil with a light, nutty flavour. Widely used in West African soups and traditional recipes.',
  'groundnut oil': 'Pure groundnut (peanut) oil with a light flavour and high smoke point. Ideal for frying, sautéing, and everyday cooking.',
  'coconut oil': 'Cold-pressed coconut oil with a natural tropical aroma. Great for cooking, baking, and hair and skin care.',
  'olive oil': 'Extra virgin olive oil, perfect for cooking, salads, and dipping. A versatile kitchen staple.',
  'fufu': 'Ready-to-cook fufu flour for smooth, stretchy fufu. A beloved West African swallow — serve hot alongside soups and stews.',
  'garri': 'Fine-grain garri made from cassava. Ready to soak or toast. A staple food across West Africa, eaten with soup or soaked in cold water.',
  'eba': 'Fine cassava flour for making eba, a smooth West African swallow. Quick to prepare and best served with egusi, ogbono, or vegetable soup.',
  'semovita': 'Semolina-based swallow flour for a smooth, stretchy eba-style meal. A lighter alternative to cassava swallow, ideal with any Nigerian soup.',
  'amala': 'Yam flour for making amala, a traditional Yoruba swallow. Smooth, stretchy, and earthy — best served with ewedu, gbegiri, or stew.',
  'egusi': 'Ground or whole egusi (melon seeds), the key ingredient in rich West African egusi soup. Packed with protein and flavour.',
  'ogbono': 'Dried ogbono (wild mango) seeds, perfect for drawing soups. An authentic ingredient in Nigerian and Central African cooking.',
  'banga': 'Palm fruit concentrate or extract for banga soup — a rich, aromatic Delta Nigerian delicacy. Ready to use.',
  'plantain': 'Ripe or unripe plantain, a Caribbean and West African staple. Delicious fried, boiled, grilled, or used in pottage.',
  'yam': 'Fresh or dried yam, a beloved West African root vegetable. Boil, fry, or pound into pounded yam for a satisfying meal.',
  'cassava': 'Fresh cassava root, a versatile West African and Caribbean staple. Used for fufu, garri, tapioca, and a wide range of dishes.',
  'stockfish': 'Dried stockfish (Norwegian cod), a rich umami ingredient in West African soups. Adds depth to egusi, ogbono, pepper, and vegetable soups.',
  'dried fish': 'Dried and smoked fish, a key flavouring ingredient in West African soups and stews. Adds a rich, savoury depth to any dish.',
  'crayfish': 'Ground dried crayfish — a signature seasoning in West African cooking. Adds bold umami flavour to soups, stews, and rice dishes.',
  'locust bean': 'Fermented locust beans (dawadawa/iru), a powerful flavour enhancer in West African cooking. Essential in efo riro, egusi soup, and many more.',
  'jollof rice': 'Premium long-grain rice, ideal for making the perfect jollof rice. Works beautifully in fried rice, coconut rice, and Nigerian party rice.',
  'long grain rice': 'Premium long-grain rice, ideal for jollof, fried rice, and everyday cooking. Light, fluffy, and consistent in texture.',
  'basmati': 'Aged basmati rice with a delicate fragrance and long, slender grains. Perfect for biryani, fried rice, or alongside any stew.',
  'malt': 'Classic malt drink — a sweet, non-alcoholic barley beverage. Enjoy chilled as a refreshing pick-me-up any time of day.',
  'malta': 'Classic malt drink — a sweet, non-alcoholic barley beverage. Enjoy chilled as a refreshing pick-me-up any time of day.',
  'guinness': 'Rich, full-bodied stout with a distinctive roasted barley flavour. Best enjoyed cold.',
  'star lager': 'Crisp Nigerian lager with a refreshing, light taste. A popular choice across West Africa.',
  'supermalt': 'Premium non-alcoholic malt drink, naturally rich in B vitamins. A favourite energy-boosting drink from the Caribbean and West Africa.',
  'pounded yam': 'Pounded yam flour for a smooth, traditional Nigerian swallow. Quick to prepare — just add hot water and stir. Serve with any Nigerian soup.',
  'ogi': 'Traditional fermented cornmeal (ogi/akamu) for a smooth, warming porridge. A classic West African breakfast and baby food.',
  'akamu': 'Traditional fermented cornmeal for a smooth, warming porridge. A classic West African breakfast staple.',
  'titus': 'Atlantic mackerel (titus fish) — a popular choice in Nigerian pepper soup, grilled fish dishes, and stews. Rich in omega-3 fatty acids.',
  'mackerel': 'Atlantic mackerel — a popular fish in Nigerian cooking. Rich in omega-3, great for pepper soup, grilling, or tomato stew.',
  'croaker': 'Fresh Atlantic croaker fish, ideal for Nigerian pepper soup, tomato stew, or grilling. A firm, flavourful white fish.',
  'tilapia': 'Fresh tilapia, a versatile and mild white fish. Perfect for Nigerian soups, grills, and pepper soup.',
  'oxtail': 'Tender oxtail cuts, perfect for slow-cooked Nigerian stew, pepper soup, or Caribbean oxtail stew. Rich and gelatinous when slow-cooked.',
  'goat meat': 'Fresh goat meat cuts — lean, flavourful, and ideal for Nigerian pepper soup, stews, asun, and suya.',
  'turkey': 'Premium turkey cuts — a favourite for Nigerian parties. Ideal for peppered turkey, stews, and special occasions.',
  'chicken': 'Fresh chicken pieces — a versatile protein for grilling, frying, stewing, and jollof rice.',
  'suya': 'Suya spice blend — the authentic seasoning for Nigerian suya. Rub on beef, chicken, or goat for that smoky, spiced street-food flavour.',
  'pepper soup': 'Aromatic pepper soup spice mix for an authentic Nigerian pepper soup. Works with goat meat, catfish, oxtail, or chicken.',
  'uziza': 'Dried uziza leaves, a peppery herb used in Nigerian soups like ofe onugbu and ofe akwu. Adds a bold, spicy depth.',
  'utazi': 'Dried utazi leaves with a distinctive bitter flavour. Used in pepper soup, abacha, and nkwobi to balance richness.',
  'ugu': 'Dried fluted pumpkin leaves (ugu), a nutritious vegetable used in egusi soup, edikaikong, and many Nigerian dishes.',
  'bitter leaf': 'Dried bitter leaf (onugbu), washed and ready to use. Essential in ofe onugbu (bitter leaf soup) and a range of Nigerian soups.',
  'waterleaf': 'Dried waterleaf, a popular vegetable in Nigerian edikaikong and other soups. Tender and naturally flavourful.',
  'scent leaf': 'Dried scent leaf (nchuanwu/efirin), a fragrant herb used in Nigerian pepper soup, jollof rice, and tomato stew.',
  'tomato paste': 'Rich, concentrated tomato paste for stews, soups, and jollof rice. A kitchen essential for Nigerian and Caribbean cooking.',
  'scotch bonnet': 'Fiery scotch bonnet peppers — the iconic heat behind Nigerian and Caribbean cooking. Use in stews, soups, and marinades.',
  'habanero': 'Spicy habanero peppers with fruity heat. Perfect for Nigerian pepper soup base, stews, and Caribbean jerk marinades.',
  'seasoning cube': 'All-purpose seasoning cubes for bold, savoury flavour in any dish. A staple in West African and Caribbean kitchens.',
  'maggi': 'Maggi seasoning cubes — the classic flavour enhancer used across West Africa. Adds a rich, savoury depth to soups, stews, and rice.',
  'knorr': 'Knorr seasoning cubes for rich, balanced flavour. A popular choice in West African and Caribbean cooking.',
  'indomie': 'Indomie instant noodles — West Africa\'s favourite quick meal. Ready in minutes with a bold, satisfying flavour.',
  'chin chin': 'Crunchy, deep-fried chin chin snack — a beloved West African treat. Lightly sweetened and perfectly crispy.',
  'puff puff': 'Puff puff mix for making soft, pillowy West African doughnuts. Quick and easy — just add water, fry, and enjoy.',
  'bofrot': 'Bofrot (Ghana doughnut) mix for fluffy, golden Ghanaian doughnuts. A popular street food across West Africa.',
  'shea butter': 'Pure, unrefined shea butter — a deeply moisturising natural butter. Ideal for skin, hair, and body care.',
  'black soap': 'Authentic African black soap made from plantain ash and shea butter. Cleanses, brightens, and soothes skin naturally.',
  'dudu osun': 'Dudu Osun African black soap — a natural formula for cleansing and brightening skin. Suitable for all skin types.',
  'ogiri': 'Fermented oil seeds (ogiri), a bold flavour enhancer in West African cooking. Adds a deep, earthy umami to soups.',
  'dawadawa': 'Fermented locust beans (dawadawa), a pungent flavour enhancer used in Ghanaian and Nigerian cooking.',
  'kontomire': 'Dried cocoyam leaves (kontomire) used in Ghanaian palava sauce and kontomire stew. A nutritious, earthy green.',
  'kelewele': 'Spiced plantain mix for making kelewele — Ghana\'s popular spiced fried plantain street food.',
  'koko': 'Millet-based porridge mix (koko) for a warm, nutritious West African breakfast drink.',
  'agege bread': 'Soft, slightly sweet Nigerian-style bread. Perfect for breakfast with egg stew, sardines, or as a snack.',
  'coconut': 'Fresh coconut — versatile for cooking, baking, and drinks. Used in coconut rice, Caribbean desserts, and natural skin care.',
  'bitters': 'A traditional West African herbal bitters drink. Known for its bold, herbal flavour and believed to have digestive and tonic properties. Best served chilled.',
  'adonko': 'Adonko bitters — a popular Ghanaian herbal spirit with a bold, complex flavour. Traditionally consumed as a digestive tonic. Best served chilled or on the rocks.',
  'alomo': 'Alomo bitters — Ghana\'s iconic herbal spirit with a strong, woody flavour. Traditionally used as an energy tonic and enjoyed at celebrations. Serve chilled.',
  'orijin': 'Orijin bitters — a uniquely Nigerian herbal spirit made with African herbs and spices. Bold, complex, and refreshing when served over ice.',
  'palm drink': 'Refreshing palm wine (palm drink) — a traditional West African fermented beverage made from palm tree sap. Lightly sweet and naturally effervescent.',
  'nkulenu': 'Nkulenu palm drink — a popular Ghanaian non-alcoholic palm wine alternative. Naturally sweet and refreshing, served chilled.',
  'agua de coco': 'Natural coconut water — refreshing, hydrating, and naturally sweet. Packed with electrolytes. Great on its own or as a mixer.',
  'coconut water': 'Natural coconut water — refreshing, hydrating, and naturally sweet. Packed with electrolytes. Great on its own or as a mixer.',
  'cerelac': 'Nestlé Cerelac baby cereal — a smooth, nutritious porridge for infants and toddlers. Enriched with vitamins and minerals for healthy development.',
  'kpoo keke': 'Kpoo Keke — a popular Nigerian herbal drink traditionally consumed as an energy and wellness tonic. Bold flavour with herbal notes.',
  'living bitters': 'Living Bitters tonic — a traditional West African herbal supplement drink. Believed to support digestive health and general wellness.',
  'joy dadi': 'Joy Dadi bitters — a West African herbal spirit known for its bold herbal flavour and traditional use as an energy tonic.',
  'baileys': 'Baileys Irish Cream — a rich, velvety liqueur blending Irish whiskey with cream. Perfect over ice, in coffee, or in desserts.',
  'cocktail': 'A refreshing fruit cocktail drink — a blend of tropical fruits for a sweet, vibrant taste. Enjoy chilled on its own or as a mixer.',
  'honey': 'Pure natural honey — great as a sweetener, spread, or remedy. Sourced for rich flavour and quality.',
  'ginger': 'Dried ground ginger with a warm, spicy flavour. An essential spice in African soups, teas, drinks, and marinades.',
  'turmeric': 'Bright yellow turmeric powder — earthy, slightly bitter, and packed with antioxidants. Used in rice, stews, and spice blends.',
  'curry': 'Fragrant curry powder blend — a key spice in Nigerian stews, fried rice, and Caribbean curries.',
  'thyme': 'Dried thyme — a versatile herb that adds a warm, earthy flavour to stews, soups, grilled meats, and rice.',
  'bay leaf': 'Dried bay leaves — add a subtle depth of flavour to soups, stews, and rice. Remove before serving.',
  'cinnamon': 'Ground cinnamon — warm, sweet, and aromatic. Used in drinks, baked goods, and spiced African desserts.',
  'cloves': 'Whole or ground cloves with an intensely warm, spicy-sweet flavour. Used in pepper soup spice, mulled drinks, and marinades.',
  'gari': 'Fine-grain gari made from cassava. Ready to soak or toast. A staple food across West Africa.',
  'nido': 'Nestlé Nido full-cream milk powder — rich and creamy. Great for tea, coffee, porridge, and baking.',
  'peak milk': 'Peak evaporated or powdered milk — a classic West African dairy staple. Rich in calcium and great for tea, coffee, and cooking.',
  'carnation': 'Carnation evaporated milk — smooth and creamy. Perfect for tea, coffee, baking, and desserts.',
  'lipton': 'Lipton black tea bags — a classic refreshing tea. Enjoy hot or iced, with or without milk.',
  'bournvita': 'Bournvita cocoa-malt drink mix — a rich, chocolatey beverage popular across West Africa. Great with hot milk.',
  'milo': 'Milo chocolate malt drink — a nutritious, energising beverage loved across Africa. Mix with hot or cold milk.',
  'ovaltine': 'Ovaltine malt drink — a nourishing cocoa-malt beverage. Great hot or cold for a comforting, energy-boosting drink.',
  'horlicks': 'Horlicks malted milk drink — a warm, comforting bedtime drink. Nutritious and naturally sweet.',
  'ribena': 'Ribena blackcurrant drink — a vitamin C-rich fruit drink. Enjoy diluted with water or straight from the bottle.',
  'lucozade': 'Lucozade energy drink — a glucose-rich beverage for a quick energy boost. Popular across West Africa and the UK.',
  'fanta': 'Fanta orange carbonated soft drink — sweet, fizzy, and refreshing. A favourite across West Africa.',
  'coca cola': 'Classic Coca-Cola — the iconic refreshing cola drink. Best served ice cold.',
  'sprite': 'Sprite lemon-lime carbonated drink — crisp, clean, and refreshing. A popular choice across West Africa.',
  'juice': 'Refreshing fruit juice — a natural, vitamin-rich drink. Great on its own or mixed with other beverages.',
  'tom tom': 'Tom Tom candy — the classic black mint sweet from West Africa. A refreshing pick-me-up with a bold menthol flavour.',
  'cabin biscuit': 'Cabin crackers — a crispy, lightly salted biscuit. Great on its own, with cheese, or alongside a bowl of soup.',
  'digestive': 'Digestive biscuits — a wholesome, semi-sweet snack. Great with tea or as a light treat.',
  'wafer': 'Light, crispy wafer biscuits in assorted flavours. A popular snack for all ages.',
  'sardine': 'Canned sardines in tomato sauce or oil — a quick, protein-rich meal. Great on bread or mixed with yam and eggs.',
  'corned beef': 'Canned corned beef — a convenient, protein-packed ingredient. Popular in Nigerian corned beef stew, rice, and sandwiches.',
  'baked beans': 'Canned baked beans in tomato sauce — a quick, filling side dish or topping. Great on toast or with fried yam.',
  'mixed vegetables': 'Canned mixed vegetables — a convenient blend of carrots, peas, and sweetcorn. Ready to use in fried rice and stews.',
  'tomatoes': 'Canned whole or chopped tomatoes — the base of Nigerian stew, jollof rice, and countless soups.',
}

function generateDescription(name, category) {
  const nameLower = name.toLowerCase()

  // Check keyword matches (longest match wins)
  const matches = Object.entries(KEYWORD_DESCRIPTIONS)
    .filter(([kw]) => nameLower.includes(kw))
    .sort((a, b) => b[0].length - a[0].length)

  if (matches.length > 0) {
    return matches[0][1]
  }

  // Category-based fallback
  const intro = CATEGORY_INTROS[category] ?? 'A quality product'
  const use = CATEGORY_USES[category] ?? 'A great addition to your kitchen.'
  const weight = extractWeight(name)
  const count = extractCount(name)
  const extra = weight ? ` Available in ${weight}.` : count ? ` Comes in a ${count}.` : ''

  return `${intro} — ${name}.${extra} ${use}`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching products from Supabase…')

  const query = supabase
    .from('products')
    .select('id, name, category, description')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const { data: products, error } = await query

  if (error) {
    console.error('Error fetching products:', error.message)
    process.exit(1)
  }

  const targets = ONLY_MISSING
    ? products.filter((p) => !p.description?.trim())
    : products

  console.log(`\nTotal products: ${products.length}`)
  console.log(`Products to describe: ${targets.length}`)
  if (ONLY_MISSING) console.log(`Already have descriptions: ${products.length - targets.length}`)
  console.log(`Mode: ${APPLY ? 'APPLY (writing to Supabase)' : 'DRY RUN (preview only)'}`)
  console.log('─'.repeat(60))

  let updated = 0
  let skipped = 0

  for (const product of targets) {
    const description = generateDescription(product.name, product.category)

    console.log(`\n[${product.category ?? 'uncategorized'}] ${product.name}`)
    console.log(`  → ${description}`)

    if (APPLY) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ description })
        .eq('id', product.id)

      if (updateError) {
        console.error(`  ✗ Failed: ${updateError.message}`)
        skipped++
      } else {
        console.log(`  ✓ Saved`)
        updated++
      }
    } else {
      updated++
    }
  }

  console.log('\n' + '─'.repeat(60))
  if (APPLY) {
    console.log(`✓ Updated ${updated} products in Supabase.`)
    if (skipped > 0) console.log(`✗ Failed: ${skipped}`)
  } else {
    console.log(`Preview complete — ${updated} descriptions generated.`)
    console.log(`Run with --apply to save to Supabase:`)
    console.log(`  node --env-file=.env.local scripts/generate-descriptions.mjs --apply`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
