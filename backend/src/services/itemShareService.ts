import { AppError } from '../errors/AppError.js';
import { itemShareRepository } from '../repositories/itemShareRepository.js';

export const itemShareService = {
  async updateShare(id: string, amountCents: number) {
    const share = await itemShareRepository.findById(id);
    if (!share) {
      throw new AppError(404, 'Item share not found');
    }
    if (share.item.expense.voided) {
      throw new AppError(400, 'Cannot edit shares on a voided expense');
    }
    return itemShareRepository.update(id, amountCents);
  },

  async deleteShare(id: string) {
    const share = await itemShareRepository.findById(id);
    if (!share) {
      throw new AppError(404, 'Item share not found');
    }
    if (share.item.expense.voided) {
      throw new AppError(400, 'Cannot remove shares from a voided expense');
    }
    await itemShareRepository.delete(id);
  },
};
