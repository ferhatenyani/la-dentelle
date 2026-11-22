// Downloads a subset of the Material Symbols Outlined variable font (FILL 0..1)
// containing only the icons used by the app. Re-run after adding an icon:
//   node scripts/fetch-icons.mjs
import fs from "node:fs";

export const ICONS = `account_balance_wallet account_circle add add_shopping_cart alternate_email apartment arrow_back
arrow_back_ios_new arrow_drop_down arrow_forward arrow_forward_ios badge bakery_dining calendar_month call card_giftcard
chat chat_bubble check check_circle chevron_left chevron_right circle close concierge credit_card delete description dialpad
diamond dinner_dining done_all eco edit electric_moped emoji_food_beverage error expand_less expand_more favorite filter_list
headset_mic home home_pin hotel_class info inventory_2 key keyboard_arrow_down label local_cafe local_drink
local_fire_department local_shipping location_on lock login logout loyalty lunch_dining mail map mic moped my_location
navigation near_me no_meals notifications notifications_active package_2 payments person person_add phone phone_iphone pin_drop
receipt_long redeem refresh remove restart_alt restaurant restaurant_menu room_service schedule search search_off security send
set_meal settings shopping_bag skillet smart_toy sms soup_kitchen spa sports_motorsports star stars storefront support_agent sync
table_restaurant task_alt thermostat timer tune two_wheeler verified verified_user villa visibility visibility_off workspace_premium`
  .split(/\s+/).filter(Boolean);

const names = [...new Set(ICONS)].sort().join(",");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const cssUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..700,0..1,0&icon_names=${names}&display=block`;
const css = await (await fetch(cssUrl, { headers: { "User-Agent": UA } })).text();
const url = css.match(/url\((https:[^)]+)\)/)?.[1];
if (!url) throw new Error("Font URL not found:\n" + css);
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
fs.mkdirSync("app/fonts", { recursive: true });
fs.writeFileSync("app/fonts/material-symbols-outlined.woff2", buf);
console.log(`Saved ${ICONS.length} icons, ${(buf.length / 1024).toFixed(1)} KB`);
