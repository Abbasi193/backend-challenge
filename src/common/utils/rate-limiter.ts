import Bottleneck from 'bottleneck';

export async function runWithBottleneck(
  callback: (x: number) => Promise<number>,
): Promise<number> {
  const Rate_Per_Minute = 1000;
  const Max_Request = 10000;

  const limiter = new Bottleneck({
    minTime: 1000 / (Rate_Per_Minute / 60),
    maxConcurrent: 4,
  });

  let requestCount = 0;
  let itemCount = 0;
  let hasMoreItems = true;

  while (hasMoreItems && requestCount < Max_Request) {
    await limiter.schedule(async () => {
      const count = await callback(itemCount);
      itemCount += count;
      requestCount++;
      hasMoreItems = count > 0;
    });
  }

  return itemCount;
}

export async function run(callback: (x: number) => Promise<number>) {
  const MAX_REQUESTS = 1000;

  let requestCount = 0;
  let itemCount = 0;
  let hasMoreItems = true;

  while (hasMoreItems && requestCount < MAX_REQUESTS) {
    const count = await callback(itemCount);
    itemCount += count;
    requestCount++;
    hasMoreItems = count > 0;
  }
  return itemCount;
}
