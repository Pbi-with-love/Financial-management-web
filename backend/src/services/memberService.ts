import { memberRepository } from '../repositories/memberRepository.js';
import { AppError } from '../errors/AppError.js';

export const memberService = {
  async getAllMembers() {
    return memberRepository.findAllWithBalances();
  },

  async getMember(id: string) {
    const member = await memberRepository.findByIdWithDetails(id);
    if (!member) {
      throw new AppError(404, 'Member not found');
    }
    return member;
  },

  async createMember(name: string) {
    return memberRepository.create({ name });
  },

  async updateMember(id: string, data: { name?: string; active?: boolean }) {
    const member = await memberRepository.findById(id);
    if (!member) {
      throw new AppError(404, 'Member not found');
    }
    return memberRepository.update(id, data);
  },

  async deleteMember(id: string) {
    const member = await memberRepository.findById(id);
    if (!member) {
      throw new AppError(404, 'Member not found');
    }
    const hasShares = await memberRepository.hasItemShares(id);
    if (hasShares) {
      throw new AppError(400, 'Cannot delete member with existing item shares. Remove their shares first.');
    }
    // Delete any deposits by this member first (cascade)
    const { prisma } = await import('../app.js');
    await prisma.deposit.deleteMany({ where: { memberId: id } });
    await memberRepository.delete(id);
  },
};
