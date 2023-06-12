import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const Requestor = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = {
      id: Number(request.user.id),
      nickname: request.user.nickname,
    };
    return user;
  },
);
