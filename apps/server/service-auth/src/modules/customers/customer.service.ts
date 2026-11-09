import { CustomerModel, ICustomerDocument } from './customer.model.js';
import { DeviceAuthDTO } from '@scan-and-dine/shared-types';

export class CustomerService {
  static async registerOrGetDevice(dto: DeviceAuthDTO): Promise<ICustomerDocument> {
    let customer = await CustomerModel.findOne({ deviceUUID: dto.deviceUUID });

    if (!customer) {
      customer = await CustomerModel.create({
        deviceUUID: dto.deviceUUID,
        phoneNumber: dto.phoneNumber,
      });
    } else if (dto.phoneNumber && !customer.phoneNumber) {
      // Identity linking: OTP phone number binding
      customer.phoneNumber = dto.phoneNumber;
      await customer.save();
    }

    return customer;
  }

  static async getFavorites(deviceUUID: string): Promise<string[]> {
    const customer = await CustomerModel.findOne({ deviceUUID });
    return customer?.favoriteItemIds || [];
  }
}
