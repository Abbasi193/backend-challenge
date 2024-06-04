import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      id: request.user._id,
      email: request.user.email,
      name: request.user.name,
    };
  },
);
