import redis from "../lib/redis";

async function main() {
  await redis.set("foo", "bar");
  const val = await redis.get("foo");
  console.log("GET foo ->", val);

  const count1 = await redis.incr("counter");
  const count2 = await redis.incr("counter");
  console.log("Counter is ->", count1, count2);

  const ttl = await redis.ttl("counter");
  console.log("TTL counter no expiry set ->", ttl);

  await redis.expire("counter", 30);
  const ttlAfter = await redis.ttl("counter");
  console.log("TTL couner after expiry ->", ttlAfter);

  await redis.del("foo", "counter");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
