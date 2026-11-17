import "server-only"
import { lookup } from "node:dns"
import { BlockList, isIP } from "node:net"
import { Agent } from "node:https"
import type { MediaStorageSettings } from "@/db/schema/cms-media-storage"

const blocked = new BlockList()
for (const [address, prefix] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]] as const) blocked.addSubnet(address, prefix)
const publicV6 = new BlockList()
publicV6.addSubnet("2000::", 3, "ipv6")
blocked.addSubnet("2001:db8::", 32, "ipv6")
blocked.addSubnet("2001::", 32, "ipv6")
blocked.addSubnet("2002::", 16, "ipv6")
export function isPublicStorageAddress(address: string) {
  const family = isIP(address)
  return family === 4 ? !blocked.check(address) : family === 6 && publicV6.check(address, "ipv6") && !blocked.check(address, "ipv6")
}
export type S3StorageConfig = MediaStorageSettings & { accessKeyId: string; secretAccessKey: string }

/** Pin each socket to a checked DNS answer, rather than checking before a second lookup. */
export async function createS3StorageClient(config: S3StorageConfig) {
  const { S3Client } = await import("@aws-sdk/client-s3")
  const agent = new Agent({ keepAlive: true, maxSockets: 4, lookup: (hostname, options, callback) => {
    lookup(hostname, { all: true }, (error, addresses) => {
      if (error) return callback(error, [])
      if (!addresses.length || addresses.some(answer => !isPublicStorageAddress(answer.address))) return callback(new Error("Storage host is not public"), [])
      if (options.all) callback(null, addresses)
      else callback(null, addresses[0].address, addresses[0].family)
    })
  } })
  const client = new S3Client({
    endpoint: config.endpoint, region: config.region, forcePathStyle: true, maxAttempts: 2,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    requestHandler: { httpsAgent: agent, connectionTimeout: 5000, requestTimeout: 20000 },
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
  })
  return { client, close: () => { client.destroy(); agent.destroy() } }
}
