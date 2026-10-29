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
    const hasRecords = await memberRepository.hasFinancialRecords(id);
    if (hasRecords) {
      throw new AppError(400, 'Cannot delete member with existing deposits or expenses. Deactivate instead.');
    }
    await memberRepository.delete(id);
  },
};
