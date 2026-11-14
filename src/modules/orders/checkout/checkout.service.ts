import { OrderModel } from "../orders/order.model.js";
import { CartModel } from "../cart/cart.model.js";
import { OrderUtils } from "../orders/order.utils.js";
import { stripe } from "../../../config/stripe.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { OrderStatus, PaymentStatus, PaymentMethod, OrderType } from "@scan-and-dine/shared-types";
import { publishEvent, EventChannels } from "@scan-and-dine/event-bus";

export class CheckoutService {
  // Initiates Stripe Payment Intent (Decoupled from MongoDB lock)
  static async initiateStripeCheckout(
    venueId: string,
    customerUUID: string,
    tableNumber?: string,
    idempotencyKey?: string
  ) {
    const cart = await CartModel.findOne({ venueId, customerUUID });
    if (!cart || cart.items.length === 0) {
      throw AppError.badRequest(errorMessage.cartEmpty);
    }

    const financials = OrderUtils.calculateFinancials(cart.items, 5, cart.discountAmount || 0);
    const amountInCents = Math.round(financials.grandTotal * 100);

    // Create Stripe PaymentIntent with Idempotency Key
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          venueId,
          customerUUID,
          tableNumber: tableNumber || "",
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    // Create Draft Order
    const orderNumber = OrderUtils.generateOrderNumber();
    const order = await OrderModel.create({
      venueId,
      customerUUID,
      tableNumber,
      orderType: tableNumber ? OrderType.DINE_IN : OrderType.TAKEAWAY,
      items: cart.items,
      financials,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.ONLINE,
      stripePaymentIntentId: paymentIntent.id,
      stripeIdempotencyKey: idempotencyKey,
      orderNumber,
      status: OrderStatus.PENDING_PAYMENT,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      orderNumber: order.orderNumber,
      grandTotal: financials.grandTotal,
    };
  }

  // Cash / Pay Later at Counter (Cafe Mode)
  static async checkoutWithCash(
    venueId: string,
    customerUUID: string,
    tableNumber: string
  ) {
    const cart = await CartModel.findOne({ venueId, customerUUID });
    if (!cart || cart.items.length === 0) {
      throw AppError.badRequest(errorMessage.cartEmpty);
    }

    const financials = OrderUtils.calculateFinancials(cart.items, 5, cart.discountAmount || 0);
    const orderNumber = OrderUtils.generateOrderNumber();

    const order = await OrderModel.create({
      venueId,
      customerUUID,
      tableNumber,
      orderType: OrderType.DINE_IN,
      items: cart.items,
      financials,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.CASH,
      orderNumber,
      status: OrderStatus.SENT_TO_KITCHEN,
    });

    // Clear cart after checkout
    await CartModel.deleteOne({ venueId, customerUUID });

    // Broadcast to KDS and Waiter apps via Redis bus
    await publishEvent(EventChannels.ORDER_CREATED, {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status,
    });

    return order;
  }
}
