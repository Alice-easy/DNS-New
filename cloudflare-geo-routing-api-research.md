# Cloudflare 地理路由/智能 DNS 功能 API 调研报告

## 一、功能概述

### 1.1 支持的地理路由功能

Cloudflare 提供以下地理路由功能：

#### 1. **Geo Steering（地理路由）**
将流量定向到绑定特定国家、区域或数据中心的池。这对于希望访问者访问最近端点、提升页面加载性能非常有用。

**三种级别的地理路由：**

- **区域路由（Region Steering）**：基于 13 个全球地理区域
- **国家路由（Country Steering）**：基于 ISO-3166-1 alpha-2 国家代码
- **数据中心路由（PoP Steering）**：仅限企业客户，基于 Cloudflare PoP（Point of Presence）

#### 2. **Load Balancing（负载均衡）**
支持多种流量调度策略：
- `dynamic_latency`：动态延迟路由
- `geo`：地理路由
- `random`：随机路由
- `proximity`：邻近路由
- `least_outstanding_requests`：最少未完成请求（仅企业版）

#### 3. **Location Strategy（位置策略）**
支持 EDNS Client Subnet (ECS)，在灰云 DNS 解析期间提供更精细的位置控制。

---

## 二、支持的区域代码

### 2.1 全球 13 个负载均衡区域

| 代码 | 区域名称 |
|------|----------|
| EEU  | Eastern Europe（东欧） |
| ENAM | Eastern North America（北美东部） |
| ME   | Middle East（中东） |
| NAF  | Northern Africa（北非） |
| NEAS | Northeast Asia（东北亚） |
| NSAM | Northern South America（南美北部） |
| OC   | Oceania（大洋洲） |
| SAF  | Southern Africa（南非） |
| SAS  | Southern Asia（南亚） |
| SEAS | Southeast Asia（东南亚） |
| SSAM | Southern South America（南美南部） |
| WEU  | Western Europe（西欧） |
| WNAM | Western North America（北美西部） |

### 2.2 国家代码查询 API

**获取区域信息：**
```bash
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/regions
```

**按国家代码查询：**
```bash
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/regions?country_code=US
```

**按州/省份代码查询（仅美国和加拿大）：**
```bash
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/regions?subdivision_code=CA
```

---

## 三、API 端点和请求格式

### 3.1 创建 Pool（源服务器池）

**端点：**
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/pools
```

**认证：**
```bash
Authorization: Bearer YOUR_API_TOKEN
```

**权限要求：** Load Balancing: Monitors and Pools Write

**请求示例：**
```json
{
  "name": "primary-dc-1",
  "description": "Primary data center - Provider XYZ",
  "origins": [
    {
      "name": "app-server-1",
      "address": "192.168.1.10",
      "enabled": true,
      "port": 443,
      "weight": 0.8
    },
    {
      "name": "app-server-2",
      "address": "192.168.1.11",
      "enabled": true,
      "port": 443,
      "weight": 0.5
    }
  ],
  "latitude": 37.7749,
  "longitude": -122.4194,
  "check_regions": ["WEU", "ENAM"],
  "minimum_origins": 1,
  "notification_email": "admin@example.com",
  "origin_steering": {
    "policy": "random"
  }
}
```

**响应示例（200 OK）：**
```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "id": "17b5962d775c646f3f9725cbc7a53df4",
    "name": "primary-dc-1",
    "description": "Primary data center - Provider XYZ",
    "enabled": true,
    "origins": [
      {
        "name": "app-server-1",
        "address": "192.168.1.10",
        "enabled": true,
        "port": 443,
        "weight": 0.8
      }
    ],
    "latitude": 37.7749,
    "longitude": -122.4194,
    "minimum_origins": 1,
    "notification_email": "admin@example.com",
    "origin_steering": {
      "policy": "random"
    }
  }
}
```

---

### 3.2 创建 Load Balancer（负载均衡器）

**端点：**
```
POST https://api.cloudflare.com/client/v4/zones/{zone_id}/load_balancers
```

**认证：**
```bash
Authorization: Bearer YOUR_API_TOKEN
```

**权限要求：** Load Balancers Write

**请求示例（带地理路由）：**
```json
{
  "name": "www.example.com",
  "description": "Load Balancer for www.example.com",
  "enabled": true,
  "proxied": true,
  "ttl": 30,
  "steering_policy": "geo",
  "fallback_pool": "17b5962d775c646f3f9725cbc7a53df4",
  "default_pools": [
    "17b5962d775c646f3f9725cbc7a53df4",
    "9290f38c5d07c2e2f4df57b1f61d4196"
  ],
  "region_pools": {
    "WNAM": [
      "de90f38ced07c2e2f4df50b1f61d4194",
      "9290f38c5d07c2e2f4df57b1f61d4196"
    ],
    "ENAM": [
      "00920f38ce07c2e2f4df50b1f61d4194"
    ],
    "WEU": [
      "abd90f38ced07c2e2f4df50b1f61d4194"
    ]
  },
  "country_pools": {
    "US": [
      "de90f38ced07c2e2f4df50b1f61d4194",
      "00920f38ce07c2e2f4df50b1f61d4194"
    ],
    "GB": [
      "abd90f38ced07c2e2f4df50b1f61d4194"
    ],
    "CN": [
      "9290f38c5d07c2e2f4df57b1f61d4196"
    ]
  },
  "pop_pools": {
    "LAX": [
      "de90f38ced07c2e2f4df50b1f61d4194"
    ],
    "LHR": [
      "abd90f38ced07c2e2f4df50b1f61d4194"
    ],
    "SJC": [
      "00920f38ce07c2e2f4df50b1f61d4194"
    ]
  },
  "location_strategy": {
    "mode": "resolver_ip",
    "prefer_ecs": "always"
  },
  "session_affinity": "cookie",
  "session_affinity_ttl": 1800,
  "session_affinity_attributes": {
    "samesite": "Auto",
    "secure": "Auto",
    "drain_duration": 100
  }
}
```

**响应示例（200 OK）：**
```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "id": "699d98642c564d2e855e9661899b7252",
    "name": "www.example.com",
    "description": "Load Balancer for www.example.com",
    "enabled": true,
    "proxied": true,
    "ttl": 30,
    "steering_policy": "geo",
    "created_on": "2025-01-15T10:30:00.123456Z",
    "modified_on": "2025-01-15T10:30:00.123456Z",
    "fallback_pool": "17b5962d775c646f3f9725cbc7a53df4",
    "default_pools": [
      "17b5962d775c646f3f9725cbc7a53df4",
      "9290f38c5d07c2e2f4df57b1f61d4196"
    ],
    "region_pools": {
      "WNAM": ["de90f38ced07c2e2f4df50b1f61d4194"],
      "ENAM": ["00920f38ce07c2e2f4df50b1f61d4194"],
      "WEU": ["abd90f38ced07c2e2f4df50b1f61d4194"]
    },
    "country_pools": {
      "US": ["de90f38ced07c2e2f4df50b1f61d4194"],
      "GB": ["abd90f38ced07c2e2f4df50b1f61d4194"],
      "CN": ["9290f38c5d07c2e2f4df57b1f61d4196"]
    },
    "zone_name": "example.com"
  }
}
```

---

### 3.3 列出所有 Load Balancers

**端点：**
```
GET https://api.cloudflare.com/client/v4/zones/{zone_id}/load_balancers
```

**响应示例：**
```json
{
  "success": true,
  "result": [
    {
      "id": "699d98642c564d2e855e9661899b7252",
      "name": "www.example.com",
      "steering_policy": "geo",
      "enabled": true,
      "proxied": true
    }
  ],
  "result_info": {
    "page": 1,
    "per_page": 20,
    "count": 1,
    "total_count": 1,
    "total_pages": 1
  }
}
```

---

### 3.4 更新 Load Balancer

**端点：**
```
PATCH https://api.cloudflare.com/client/v4/zones/{zone_id}/load_balancers/{load_balancer_id}
```

**请求示例（更新国家池配置）：**
```json
{
  "country_pools": {
    "US": ["new_pool_id_1"],
    "JP": ["new_pool_id_2"],
    "DE": ["new_pool_id_3"]
  }
}
```

---

## 四、代码示例

### 4.1 Node.js 示例

```javascript
const CLOUDFLARE_API_TOKEN = 'YOUR_API_TOKEN';
const ACCOUNT_ID = 'your_account_id';
const ZONE_ID = 'your_zone_id';

async function createPool() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/load_balancers/pools`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'us-west-pool',
        origins: [
          {
            name: 'server-1',
            address: '192.168.1.10',
            enabled: true,
            weight: 1.0
          }
        ],
        description: 'US West Coast servers',
        latitude: 37.7749,
        longitude: -122.4194
      })
    }
  );

  const data = await response.json();
  console.log('Pool created:', data.result.id);
  return data.result.id;
}

async function createGeoLoadBalancer(poolIds) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/load_balancers`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'api.example.com',
        steering_policy: 'geo',
        enabled: true,
        proxied: true,
        ttl: 30,
        default_pools: poolIds,
        fallback_pool: poolIds[0],
        region_pools: {
          'WNAM': [poolIds[0]],
          'ENAM': [poolIds[1]],
          'WEU': [poolIds[2]]
        },
        country_pools: {
          'US': [poolIds[0]],
          'GB': [poolIds[2]],
          'CN': [poolIds[1]]
        }
      })
    }
  );

  const data = await response.json();
  console.log('Load Balancer created:', data.result);
  return data.result;
}

// 使用示例
(async () => {
  const poolId1 = await createPool();
  const poolId2 = await createPool();
  const poolId3 = await createPool();

  await createGeoLoadBalancer([poolId1, poolId2, poolId3]);
})();
```

---

### 4.2 Python 示例

```python
import requests
import json

CLOUDFLARE_API_TOKEN = 'YOUR_API_TOKEN'
ACCOUNT_ID = 'your_account_id'
ZONE_ID = 'your_zone_id'

BASE_URL = 'https://api.cloudflare.com/client/v4'

headers = {
    'Authorization': f'Bearer {CLOUDFLARE_API_TOKEN}',
    'Content-Type': 'application/json'
}

def create_pool(name, origins):
    """创建 Pool"""
    url = f'{BASE_URL}/accounts/{ACCOUNT_ID}/load_balancers/pools'

    payload = {
        'name': name,
        'origins': origins,
        'description': f'{name} pool',
        'enabled': True,
        'minimum_origins': 1
    }

    response = requests.post(url, headers=headers, json=payload)
    data = response.json()

    if data['success']:
        print(f'Pool created: {data["result"]["id"]}')
        return data['result']['id']
    else:
        print(f'Error: {data["errors"]}')
        return None

def create_geo_load_balancer(name, pool_config):
    """创建带地理路由的 Load Balancer"""
    url = f'{BASE_URL}/zones/{ZONE_ID}/load_balancers'

    payload = {
        'name': name,
        'steering_policy': 'geo',
        'enabled': True,
        'proxied': True,
        'ttl': 30,
        'default_pools': pool_config['default_pools'],
        'fallback_pool': pool_config['fallback_pool'],
        'region_pools': pool_config.get('region_pools', {}),
        'country_pools': pool_config.get('country_pools', {}),
        'location_strategy': {
            'mode': 'resolver_ip',
            'prefer_ecs': 'always'
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    data = response.json()

    if data['success']:
        print(f'Load Balancer created: {data["result"]["id"]}')
        return data['result']
    else:
        print(f'Error: {data["errors"]}')
        return None

def get_region_info(country_code=None):
    """获取区域信息"""
    url = f'{BASE_URL}/accounts/{ACCOUNT_ID}/load_balancers/regions'

    if country_code:
        url += f'?country_code={country_code}'

    response = requests.get(url, headers=headers)
    data = response.json()

    if data['success']:
        return data['result']
    else:
        print(f'Error: {data["errors"]}')
        return None

# 使用示例
if __name__ == '__main__':
    # 创建 3 个池
    pool_us = create_pool('us-west-pool', [
        {'name': 'us-server-1', 'address': '192.168.1.10', 'enabled': True}
    ])

    pool_eu = create_pool('eu-west-pool', [
        {'name': 'eu-server-1', 'address': '192.168.2.10', 'enabled': True}
    ])

    pool_asia = create_pool('asia-east-pool', [
        {'name': 'asia-server-1', 'address': '192.168.3.10', 'enabled': True}
    ])

    # 创建地理路由负载均衡器
    if pool_us and pool_eu and pool_asia:
        pool_config = {
            'default_pools': [pool_us, pool_eu, pool_asia],
            'fallback_pool': pool_us,
            'region_pools': {
                'WNAM': [pool_us],
                'ENAM': [pool_us],
                'WEU': [pool_eu],
                'NEAS': [pool_asia]
            },
            'country_pools': {
                'US': [pool_us],
                'GB': [pool_eu],
                'DE': [pool_eu],
                'CN': [pool_asia],
                'JP': [pool_asia]
            }
        }

        create_geo_load_balancer('api.example.com', pool_config)

    # 查询美国对应的区域
    us_regions = get_region_info('US')
    print(f'US regions: {json.dumps(us_regions, indent=2)}')
```

---

### 4.3 cURL 示例

**创建 Pool：**
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/pools" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "us-west-pool",
    "origins": [
      {
        "name": "server-1",
        "address": "192.168.1.10",
        "enabled": true,
        "weight": 1.0
      }
    ],
    "description": "US West Coast servers"
  }'
```

**创建 Load Balancer：**
```bash
curl -X POST \
  "https://api.cloudflare.com/client/v4/zones/{zone_id}/load_balancers" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api.example.com",
    "steering_policy": "geo",
    "enabled": true,
    "proxied": true,
    "ttl": 30,
    "default_pools": ["pool_id_1", "pool_id_2"],
    "fallback_pool": "pool_id_1",
    "region_pools": {
      "WNAM": ["pool_id_1"],
      "WEU": ["pool_id_2"]
    },
    "country_pools": {
      "US": ["pool_id_1"],
      "GB": ["pool_id_2"]
    }
  }'
```

**查询区域信息：**
```bash
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/regions?country_code=US" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

---

## 五、定价说明

### 5.1 基础定价

- **起步价格：** $5/月
  - 包含：2 个源服务器
  - 健康检查：每 60 秒一次
  - 检查区域：1 个区域
  - 流量调度：Random 或 Failover

- **地理路由示例：** $60/月
  - 6 个服务器
  - 健康检查：每 15 秒一次
  - 检查区域：2 个区域
  - 流量调度：Geo Steering

### 5.2 DNS 查询费用

- **免费额度：** 前 500,000 次 DNS 查询/月（账户所有 Load Balancers 共享）
- **超额费用：** $0.50 / 500,000 次查询（向上取整）

### 5.3 高级功能要求

| 功能 | 要求 |
|------|------|
| 区域路由（Region Steering） | 所有付费计划 |
| 国家路由（Country Steering） | 所有付费计划 |
| PoP 路由（Data Center Steering） | **仅限企业版** |
| Proximity Steering（邻近路由） | 需额外付费 |
| Least Outstanding Requests | **仅限企业版** |
| EDNS Client Subnet (ECS) | 所有付费计划 |

---

## 六、重要限制和注意事项

### 6.1 配置限制

1. **自定义规则不兼容：** Geo steering 不兼容自定义负载均衡规则
2. **删除限制：** 从 geo steering 配置中移除池后才能删除该池
3. **配置保留：** 切换到其他流量调度方式时，geo steering 配置不会自动删除

### 6.2 企业版专属功能

- PoP Steering（数据中心路由）
- Least Outstanding Requests steering
- Layer 7 proxied Load Balancers 的高级功能

### 6.3 故障转移行为

**回退顺序：**
1. 指定的数据中心池（PoP pools）
2. 指定的国家池（Country pools）
3. 指定的区域池（Region pools）
4. 默认池（Default pools）
5. 故障转移池（Fallback pool）

---

## 七、最佳实践

### 7.1 配置建议

1. **始终配置 fallback_pool：** 确保在所有地理池不可用时有备用选项
2. **合理设置权重：** 在 origins 中使用 weight 参数分配流量比例
3. **启用健康检查：** 配置 monitor 确保只将流量路由到健康的服务器
4. **使用会话保持：** 对于有状态应用，启用 session_affinity

### 7.2 性能优化

1. **减少 TTL：** 较低的 TTL（如 30 秒）可以更快响应故障转移
2. **多区域健康检查：** 配置多个 check_regions 提高监控准确性
3. **EDNS Client Subnet：** 启用 ECS 获得更精确的地理位置

### 7.3 安全建议

1. **使用 API Token：** 限制 Token 权限范围
2. **启用 Proxied 模式：** 隐藏源服务器 IP
3. **配置通知：** 设置 notification_email 及时获取健康状态变化

---

## 八、参考资源

### 官方文档

1. [Cloudflare Load Balancing 官方文档](https://developers.cloudflare.com/load-balancing/)
2. [Geo Steering 配置指南](https://developers.cloudflare.com/load-balancing/understand-basics/traffic-steering/steering-policies/geo-steering/)
3. [Load Balancers API 参考](https://developers.cloudflare.com/api/resources/load_balancers/)
4. [Region Mapping API](https://developers.cloudflare.com/load-balancing/reference/region-mapping-api/)
5. [Traffic Steering Policies](https://developers.cloudflare.com/load-balancing/understand-basics/traffic-steering/steering-policies/)

### 社区资源

- [Cloudflare Community Forums](https://community.cloudflare.com/)
- [Terraform Provider for Cloudflare](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)

---

## 附录：完整的 Terraform 示例

```hcl
# 配置 Cloudflare Provider
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# 创建 Pool - 美国西部
resource "cloudflare_load_balancer_pool" "us_west" {
  account_id = var.account_id
  name       = "us-west-pool"

  origins {
    name    = "us-west-1"
    address = "192.168.1.10"
    enabled = true
    weight  = 0.8
  }

  origins {
    name    = "us-west-2"
    address = "192.168.1.11"
    enabled = true
    weight  = 0.5
  }

  latitude    = 37.7749
  longitude   = -122.4194
  description = "US West Coast Pool"
  enabled     = true

  minimum_origins = 1

  notification_email = "admin@example.com"

  check_regions = ["WNAM", "ENAM"]
}

# 创建 Pool - 欧洲
resource "cloudflare_load_balancer_pool" "europe" {
  account_id = var.account_id
  name       = "europe-pool"

  origins {
    name    = "eu-west-1"
    address = "192.168.2.10"
    enabled = true
    weight  = 1.0
  }

  latitude    = 51.5074
  longitude   = -0.1278
  description = "Europe Pool"
  enabled     = true

  minimum_origins = 1
}

# 创建 Pool - 亚洲
resource "cloudflare_load_balancer_pool" "asia" {
  account_id = var.account_id
  name       = "asia-pool"

  origins {
    name    = "asia-east-1"
    address = "192.168.3.10"
    enabled = true
    weight  = 1.0
  }

  latitude    = 35.6762
  longitude   = 139.6503
  description = "Asia Pool"
  enabled     = true

  minimum_origins = 1
}

# 创建 Load Balancer with Geo Steering
resource "cloudflare_load_balancer" "api" {
  zone_id = var.zone_id
  name    = "api.example.com"

  default_pool_ids = [
    cloudflare_load_balancer_pool.us_west.id,
    cloudflare_load_balancer_pool.europe.id,
    cloudflare_load_balancer_pool.asia.id
  ]

  fallback_pool_id = cloudflare_load_balancer_pool.us_west.id

  description = "API Load Balancer with Geo Steering"

  enabled        = true
  proxied        = true
  ttl            = 30
  steering_policy = "geo"

  # 区域池配置
  region_pools {
    region   = "WNAM"
    pool_ids = [cloudflare_load_balancer_pool.us_west.id]
  }

  region_pools {
    region   = "ENAM"
    pool_ids = [cloudflare_load_balancer_pool.us_west.id]
  }

  region_pools {
    region   = "WEU"
    pool_ids = [cloudflare_load_balancer_pool.europe.id]
  }

  region_pools {
    region   = "NEAS"
    pool_ids = [cloudflare_load_balancer_pool.asia.id]
  }

  # 国家池配置
  country_pools {
    country  = "US"
    pool_ids = [cloudflare_load_balancer_pool.us_west.id]
  }

  country_pools {
    country  = "GB"
    pool_ids = [cloudflare_load_balancer_pool.europe.id]
  }

  country_pools {
    country  = "DE"
    pool_ids = [cloudflare_load_balancer_pool.europe.id]
  }

  country_pools {
    country  = "CN"
    pool_ids = [cloudflare_load_balancer_pool.asia.id]
  }

  country_pools {
    country  = "JP"
    pool_ids = [cloudflare_load_balancer_pool.asia.id]
  }

  # Location Strategy (EDNS)
  location_strategy {
    mode       = "resolver_ip"
    prefer_ecs = "always"
  }

  # Session Affinity
  session_affinity = "cookie"
  session_affinity_ttl = 1800

  session_affinity_attributes {
    samesite        = "Auto"
    secure          = "Auto"
    drain_duration  = 100
  }
}

# 输出
output "load_balancer_id" {
  value = cloudflare_load_balancer.api.id
}

output "load_balancer_name" {
  value = cloudflare_load_balancer.api.name
}
```

---

**文档生成时间：** 2025-12-20
**Cloudflare API 版本：** v4
**调研覆盖范围：** Load Balancing, Geo Steering, Region/Country/PoP Routing
