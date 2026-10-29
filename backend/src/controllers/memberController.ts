import { Request, Response, NextFunction } from 'express';
import { memberService } from '../services/memberService.js';
import { createMemberSchema, updateMemberSchema } from '../validation/member.js';
import { AppError } from '../errors/AppError.js';

function serializeMember(member: Record<string, unknown>) {
  return {
    ...member,
    balanceCents:
      typeof member.balanceCents === 'bigint'
        ? Number(member.balanceCents)
        : member.balanceCents,
  };
}

export const memberController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const members = await memberService.getAllMembers();
      res.json(members.map((m) => serializeMember(m as unknown as Record<string, unknown>)));
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const member = await memberService.getMember(id);
      res.json(member);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: { message: string }) => e.message).join(', ');
        throw new AppError(400, message);
      }
      const member = await memberService.createMember(parsed.data.name);
      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await memberService.deleteMember(id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const parsed = updateMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((e: { message: string }) => e.message).join(', ');
        throw new AppError(400, message);
      }
      const member = await memberService.updateMember(id, parsed.data);
      res.json(member);
    } catch (err) {
      next(err);
    }
  },
};
