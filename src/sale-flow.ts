import type {DemoOrderType,DemoProduct} from './demo-data';

// Checkout options are based on the sold item's explicit catalog type, not a
// business-wide "restaurant" switch or a category label supplied by visitors.
const legacyFoodCategories=new Set(['coffee','tea & matcha','pastries','food','beverages','drinks']);
export function isFoodOrBeverage(item:Pick<DemoProduct,'kind'|'category'>):boolean {
 if(item.kind!==undefined) return item.kind==='food_beverage';
 return legacyFoodCategories.has((item.category||'').trim().toLowerCase());
}
export function usesFoodFulfillment(items:readonly Pick<DemoProduct,'kind'|'category'>[]):boolean {
 return items.some(isFoodOrBeverage);
}
export function saleOrderType(items:readonly Pick<DemoProduct,'kind'|'category'>[],selected:DemoOrderType):DemoOrderType {
 return usesFoodFulfillment(items)
   ? selected==='standard'?'takeout':selected
   : 'standard';
}
export function needsKitchenTicket(items:readonly Pick<DemoProduct,'kind'|'category'>[]):boolean {
 return usesFoodFulfillment(items);
}
