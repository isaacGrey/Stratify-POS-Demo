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

/**
 * A kitchen ticket is a *food production task*, not a generic sales record.
 * Never infer eligibility from the sale's previous dine-in/takeout designation:
 * old demo versions wrote those values even for services.
 */
export function kitchenLineItems<T extends {productId:string;name:string;qty:number}>(
 lines:readonly T[],
 products:readonly DemoProduct[]
):T[] {
 const byId=new Map(products.map(p=>[p.id,p]));
 return lines.filter(line=>{
   const item=byId.get(line.productId);
   // Fail closed: deleted/unrecognized products must not create kitchen work.
   return Boolean(item&&isFoodOrBeverage(item)&&line.qty>0);
 });
}
export type TicketLike={id:string;orderId:string};
export type SaleLike={id:string;lines:{productId:string;name:string;qty:number}[]};
export function kitchenTicketView<T extends TicketLike>(
 tickets:readonly T[],sales:readonly SaleLike[],products:readonly DemoProduct[]
):{ticket:T;lines:SaleLike['lines']}[]{
 const salesById=new Map(sales.map(s=>[s.id,s]));
 return tickets.flatMap(ticket=>{
   const order=salesById.get(ticket.orderId);
   if(!order)return [];
   const lines=kitchenLineItems(order.lines,products);
   return lines.length?[{ticket,lines}]:[];
 });
}
