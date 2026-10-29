import { prisma } from '../app.js';
import { AppError } from '../errors/AppError.js';
import { depositRepository, DepositFilters } from '../repositories/depositRepository.js';
import { CreateDepositInput } from '../validation/deposit.js';

export const depositService = {
  async getAllDeposits(filters: DepositFilters = {}) {
    return depositRepository.findAll(filters);
  },

  async createDeposit(payload: CreateDepositInput) {
    const member = await prisma.member.findUnique({ where: { id: payload.memberId } });
    if (!member) {
      throw new AppError(400, `Member "${payload.memberId}" does not exist`);
    }
    return depositRepository.create({
      memberId: payload.memberId,
      amountCents: payload.amountCents,
      date: payload.date,
      note: payload.note,
    });
  },

  async updateDeposit(id: string, data: { amountCents?: number; date?: string; note?: string }) {
    const deposit = await depositRepository.findById(id);
    if (!deposit) {
      throw new AppError(404, 'Deposit not found');
    }
    return depositRepository.update(id, data);
  },

  async deleteDeposit(id: string) {
    const deposit = await depositRepository.findById(id);
    if (!deposit) {
      throw new AppError(404, 'Deposit not found');
    }
    await depositRepository.delete(id);
  },
};
