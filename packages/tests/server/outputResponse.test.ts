import { routerToServerAndClientNew, waitError } from './___testHelpers';
import { TRPCClientError } from '@trpc/client';
import { initTRPC } from '@trpc/server';

test('happy path', async () => {
  const t = initTRPC.create({
    experimental: {
      outputResponse: true,
    },
  });
  const router = t.router({
    hello: t.procedure.query(() => {
      return new Response('hello', {
        headers: {
          'content-type': 'text/plain',
        },
      });
    }),
  });

  const ctx = routerToServerAndClientNew(router);
  const res = await ctx.client.hello.query(undefined, {
    context: {
      skipBatch: true,
    },
  });
  expectTypeOf(res).toEqualTypeOf<Response>();
  expect(res.ok).toBe(true);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('text/plain');
  expect(await res.text()).toBe('hello');

  await ctx.close();
});

test('does not work with subscriptions', async () => {
  const t = initTRPC.create({
    experimental: {
      outputResponse: true,
    },
  });

  // @ts-expect-error - this should not be allowed
  t.procedure.subscription(async () => {
    return new Response('hello', {
      headers: {
        'content-type': 'text/plain',
      },
    });
  });
});

test('experimental flag', async () => {
  const t = initTRPC.create({
    experimental: {
      outputResponse: false,
    },
  });

  const router = t.router({
    hello: t.procedure.query(() => {
      return new Response('hello', {
        headers: {
          'content-type': 'text/plain',
        },
      });
    }),
  });
  const ctx = routerToServerAndClientNew(router);
  const res = await waitError(
    ctx.client.hello.query(undefined, {
      context: {
        skipBatch: true,
      },
    }),
    TRPCClientError,
  );

  expect(res).toMatchInlineSnapshot(
    `[TRPCClientError: You need to activate outputResponse in the root config to use this feature - e.g. \`initTRPC.create({ experimental: { outputResponse: true } })\`]`,
  );

  await ctx.close();
});
