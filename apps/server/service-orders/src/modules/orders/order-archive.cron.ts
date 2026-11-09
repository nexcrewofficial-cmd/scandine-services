import { OrderModel } from './order.model.js';
import { ArchivedOrderModel } from './order-archive.model.js';
import { OrderStatus } from '@scan-and-dine/shared-types';
import { logger } from '@scan-and-dine/logger';

export class OrderArchiveCron {
  /**
   * Archives orders older than retentionDays (default 60 days) to prevent primary database RAM bloat
   */
  static async runArchival(retentionDays = 60): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    logger.info({ cutoffDate: cutoffDate.toISOString() }, 'Starting daily order cold-storage archival process...');

    const oldOrders = await OrderModel.find({
      status: { $in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      createdAt: { $lt: cutoffDate },
    }).lean();

    if (oldOrders.length === 0) {
      logger.info('Order archival: No completed orders older than 60 days found.');
      return 0;
    }

    const archiveDocs = oldOrders.map((order) => ({
      ...order,
      archivedAt: new Date(),
    }));

    // 1. Insert into cold storage
    await ArchivedOrderModel.insertMany(archiveDocs);

    // 2. Remove from primary orders collection
    const orderIds = oldOrders.map((o) => o._id);
    await OrderModel.deleteMany({ _id: { $in: orderIds } });

    logger.info(
      { count: oldOrders.length },
      `Successfully moved ${oldOrders.length} old orders to cold storage (archived_orders)`
    );

    return oldOrders.length;
  }

  /**
   * Initializes the 24-hour interval background runner
   */
  static initScheduler(): void {
    // Run once on boot after 10 seconds, then every 24 hours
    setTimeout(() => {
      this.runArchival().catch((err) => {
        logger.error({ err }, 'Error running initial order archival');
      });
    }, 10000);

    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(() => {
      this.runArchival().catch((err) => {
        logger.error({ err }, 'Error during scheduled order archival cron');
      });
    }, TWENTY_FOUR_HOURS);

    logger.info('Order Cold-Storage Archival scheduler initialized (24h cycle)');
  }
}
