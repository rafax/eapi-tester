import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
  },
  vus: 10,
  duration: '5s',
}

const clientFactory = {
  "cg-triton" : () => new CodyGatewayClient("https://cody-gateway.sgdev.org/v1/embeddings", __ENV.CODY_GATEWAY_API_KEY, "sourcegraph/triton"),
  "cg-openai" : () => new CodyGatewayClient("https://cody-gateway.sgdev.org/v1/embeddings", __ENV.CODY_GATEWAY_API_KEY, "openai/text-embedding-ada-002"),
  "direct-cg-triton" : () => new CodyGatewayClient("https://cody-gateway-xrmga2bl6q-uc.a.run.app/v1/embeddings", __ENV.CODY_GATEWAY_API_KEY, "sourcegraph/triton"),
  "direct-dev-cg-triton-http" : () => new CodyGatewayClient("https://cody-gateway-2-xrmga2bl6q-uc.a.run.app/v1/embeddings", __ENV.CODY_GATEWAY_API_KEY, "sourcegraph/triton"),
}

export default async function () {
  const client =  clientFactory[__ENV.BACKEND]()
  let [httpStatus, data] = await client.embed("hello world");

  check(httpStatus, { "success http code": (r) => r === 200 });
  check(data, { "response is not empty": (r) => r.length > 0 });
  sleep(1);
}

interface EmbeddingsClient {
  embed(text: string): Promise<[number,number[]]>;
}

class CodyGatewayClient implements EmbeddingsClient {
  constructor(
    private readonly url: string,
    private readonly apiKey: string,
    private readonly model: string
  ) {
    this.apiKey = apiKey;
    this.url = url;
    this.model = model;
  }

  async embed(text: string): Promise<[number,number[]]> {
    const data = { input: [text], model: this.model };
    const res  = await http.asyncRequest("POST",
      this.url,
      JSON.stringify(data),  {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    )
    return [res.status, (res.json() as any)["embeddings"][0].data];
  }
}
