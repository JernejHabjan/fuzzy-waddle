import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { type AuthUser } from "@supabase/supabase-js";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  const contextType = context.getType();
  if (contextType === "ws") {
    // for socket-io, extract user from first index
    return context.getArgByIndex(0).user as AuthUser;
  }
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.user as AuthUser;
});
