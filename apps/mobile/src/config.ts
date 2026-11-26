/** Self-hosted endpoints only. Change LAN IPs for physical-device testing. */
export const CONFIG = {
  mapStyleURL: 'http://10.0.2.2:8080/styles/osm-bright/style.json',
  photonURL: 'http://10.0.2.2:2322',
  valhallaURL: 'http://10.0.2.2:8002',
  assistantURL: 'http://10.0.2.2:8081/v1/chat/completions',
  requestTimeoutMs: 12000,
};
