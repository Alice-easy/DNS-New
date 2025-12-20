# 阿里云 DNS（Alidns）智能解析/地理路由功能 API 调研报告

## 一、智能解析概述

### 1.1 基本概念

智能DNS解析通过识别访问者来源，为不同用户返回不同IP地址。与传统DNS随机返回相比，智能解析能够减少解析时延，并提升网站访问速度。

### 1.2 实现原理

系统通过识别LocalDNS出口IP来判断访问者来源，支持三种场景：

1. **支持EDNS的LocalDNS**：优先使用edns-client-subnet扩展中的IP
2. **不支持EDNS的LocalDNS**：根据LocalDNS出口IP判断地理位置
3. **变相支持EDNS**：通过二级节点地理位置返回解析结果

### 1.3 解析线路优先级规则

**不同线路大类解析生效优先级：**
```
自定义线路 > 搜索引擎线路 > 云厂商线路 > 运营商线路 > 地域线路 > 默认线路
```

**相同线路分类下解析生效优先级：**
细分线路优先级高于宽泛线路（例如：省级线路 > 区域线路 > 全国线路）

---

## 二、支持的智能解析线路

### 2.1 默认线路

| 线路代码 | 线路名称 |
|---------|---------|
| default | 默认 |

**说明：** 默认线路是必须配置的兜底解析线路。

### 2.2 运营商线路

#### 2.2.1 一级运营商线路

| 线路代码 | 线路名称 |
|---------|---------|
| telecom | 中国电信 |
| unicom | 中国联通 |
| mobile | 中国移动 |
| edu | 中国教育网 |
| drpeng | 中国鹏博士 |
| btvn | 中国广电网 |
| cstnet | 科技网 |
| wexchange | 驰联网络 |
| founder | 方正宽带 |
| topway_video | 天威视讯 |
| wasu | 华数宽带 |
| ocn | 东方有线 |
| cnix | 皓宽网络 |
| bgctv | 歌华有线 |

#### 2.2.2 运营商细分线路结构

三大运营商（电信、联通、移动）均支持按地区细分：

**二级线路示例（中国电信）：**
- cn_telecom_dongbei（东北）
- cn_telecom_huabei（华北）
- cn_telecom_huadong（华东）
- cn_telecom_huanan（华南）
- cn_telecom_huazhong（华中）
- cn_telecom_xibei（西北）
- cn_telecom_xinan（西南）

**三级线路示例（省级）：**
- cn_telecom_beijing（北京）
- cn_telecom_shanghai（上海）
- cn_telecom_guangdong（广东）
- cn_telecom_sichuan（四川）
- ... （覆盖全国31个省级行政区）

**说明：** 联通和移动的线路结构与电信一致，将前缀改为 `cn_unicom_` 或 `cn_mobile_` 即可。

### 2.3 地域线路（中国内地）

#### 2.3.1 一级线路

| 线路代码 | 线路名称 |
|---------|---------|
| internal | 中国地区 |

#### 2.3.2 二级线路（大区）

| 线路代码 | 线路名称 |
|---------|---------|
| cn_region_dongbei | 东北地区 |
| cn_region_huabei | 华北地区 |
| cn_region_huadong | 华东地区 |
| cn_region_huanan | 华南地区 |
| cn_region_huazhong | 华中地区 |
| cn_region_xibei | 西北地区 |
| cn_region_xinan | 西南地区 |

#### 2.3.3 三级线路（省级）

**华东地区：**
- cn_region_shandong（山东）
- cn_region_shanghai（上海）
- cn_region_anhui（安徽）
- cn_region_jiangxi（江西）
- cn_region_zhejiang（浙江）
- cn_region_jiangsu（江苏）
- cn_region_fujian（福建）

**华北地区：**
- cn_region_beijing（北京）
- cn_region_hebei（河北）
- cn_region_tianjin（天津）
- cn_region_shanxi（山西）
- cn_region_neimenggu（内蒙古）

**华南地区：**
- cn_region_guangdong（广东）
- cn_region_guangxi（广西）
- cn_region_hainan（海南）

**华中地区：**
- cn_region_henan（河南）
- cn_region_hubei（湖北）
- cn_region_hunan（湖南）

**东北地区：**
- cn_region_heilongjiang（黑龙江）
- cn_region_jilin（吉林）
- cn_region_liaoning（辽宁）

**西北地区：**
- cn_region_gansu（甘肃）
- cn_region_qinghai（青海）
- cn_region_ningxia（宁夏）
- cn_region_xinjiang（新疆）
- cn_region_shannxi（陕西）

**西南地区：**
- cn_region_chongqing（重庆）
- cn_region_guizhou（贵州）
- cn_region_sichuan（四川）
- cn_region_xizang（西藏）
- cn_region_yunnan（云南）

### 2.4 地域线路（境外）

#### 2.4.1 一级线路

| 线路代码 | 线路名称 |
|---------|---------|
| oversea | 境外 |

#### 2.4.2 二级线路（大洲）

| 线路代码 | 线路名称 |
|---------|---------|
| os_africa | 非洲 |
| os_asia | 亚洲 |
| os_euro | 欧洲 |
| os_namerica | 北美洲 |
| os_samerica | 南美洲 |
| os_oceanica | 大洋洲 |

#### 2.4.3 三级线路示例

**亚洲：**
- os_asia_sg（新加坡）
- os_asia_jp（日本）
- os_asia_kr（韩国）
- os_asia_hk（香港）
- os_asia_in（印度，细分至州级）

**欧洲：**
- os_euro_gb（英国）
- os_euro_de（德国）
- os_euro_fr（法国）

**北美洲：**
- os_namerica_us（美国，细分至州级）
- os_namerica_ca（加拿大，细分至省级）

**说明：** 境外线路共包含6大洲、23个亚区和数百个国家/地区。

### 2.5 云厂商线路

#### 2.5.1 阿里云线路

**一级线路：**
- aliyun（阿里云）

**二级线路：**
- aliyun_internal（中国内地）
- aliyun_oversea（境外）

**三级线路示例（中国内地）：**
- aliyun_cn_beijing（北京）
- aliyun_cn_shanghai（上海）
- aliyun_cn_shenzhen（深圳）
- aliyun_cn_hangzhou（杭州）
- aliyun_cn_qingdao（青岛）
- ... （共13个区域）

**三级线路示例（境外）：**
- aliyun_ap_singapore（新加坡）
- aliyun_us_west_1（美国硅谷）
- aliyun_eu_central_1（德国法兰克福）
- ... （共10个区域）

**说明：** 阿里云线路用于将来自阿里云ECS、容器等实例的查询请求解析到就近Region内的服务IP上。

### 2.6 搜索引擎线路

支持的搜索引擎及线路代码：

| 搜索引擎 | 中国内地线路代码 | 境外线路代码 |
|---------|--------------|------------|
| 谷歌（Google） | cn_search_google | os_search_google |
| 百度（Baidu） | cn_search_baidu | os_search_baidu |
| 必应（Bing） | cn_search_biying | os_search_biying |
| 搜狗（Sogou） | cn_search_sougou | os_search_sougou |
| 奇虎（360） | cn_search_qihu | os_search_qihu |
| 有道（Youdao） | cn_search_youdao | os_search_youdao |
| 雅虎（Yahoo） | cn_search_yahoo | os_search_yahoo |

**说明：** 搜索引擎线路可以将搜索引擎爬虫的DNS请求指向专门的服务器地址，优化爬虫流量管理和SEO效果。

### 2.7 自定义线路

用户可以通过API创建自定义线路，按需配置IP范围。自定义线路拥有最高的解析优先级。

---

## 三、核心API接口

### 3.1 AddDomainRecord - 添加解析记录

#### 3.1.1 API端点

```
POST https://alidns.aliyuncs.com/
```

#### 3.1.2 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Action | string | 是 | API名称，固定值：AddDomainRecord |
| DomainName | string | 是 | 域名名称 |
| RR | string | 是 | 主机记录（@表示主域名，*表示泛解析） |
| Type | string | 是 | 解析记录类型（A、AAAA、CNAME、MX、TXT等） |
| Value | string | 是 | 记录值（如IP地址） |
| Line | string | 否 | **解析线路，默认为default**（详见第二章线路列表） |
| TTL | integer | 否 | 解析生效时间，默认600秒，最小1秒 |
| Priority | integer | 否 | MX记录优先级[1-50]（MX记录必填） |
| Lang | string | 否 | 语言类型（zh/en），默认zh |

#### 3.1.3 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| RequestId | string | 请求ID |
| RecordId | string | 解析记录的ID |

#### 3.1.4 响应示例

```json
{
  "RequestId": "536E9CAD-DB30-4647-AC87-AA5CC38C5382",
  "RecordId": "99123456789"
}
```

### 3.2 UpdateDomainRecord - 修改解析记录

#### 3.2.1 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Action | string | 是 | API名称，固定值：UpdateDomainRecord |
| RecordId | string | 是 | 解析记录的ID |
| RR | string | 是 | 主机记录 |
| Type | string | 是 | 解析记录类型 |
| Value | string | 是 | 记录值 |
| Line | string | 否 | **解析线路，默认为default** |
| TTL | integer | 否 | 解析生效时间，默认600秒 |
| Priority | integer | 否 | MX记录优先级[1-50] |
| Lang | string | 否 | 语言类型（zh/en），默认zh |

#### 3.2.2 响应示例

```json
{
  "RequestId": "536E9CAD-DB30-4647-AC87-AA5CC38C5382",
  "RecordId": "99123456789"
}
```

### 3.3 DescribeDomainRecords - 查询解析记录列表

#### 3.3.1 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Action | string | 是 | API名称，固定值：DescribeDomainRecords |
| DomainName | string | 是 | 域名名称 |
| RRKeyWord | string | 否 | 主机记录的关键字，用于模糊搜索 |
| TypeKeyWord | string | 否 | 解析类型的关键字 |
| ValueKeyWord | string | 否 | 记录值的关键字 |
| Line | string | 否 | 解析线路 |
| PageNumber | integer | 否 | 当前页数，默认1 |
| PageSize | integer | 否 | 分页查询时设置的每页行数，默认20 |

#### 3.3.2 响应示例

```json
{
  "RequestId": "536E9CAD-DB30-4647-AC87-AA5CC38C5382",
  "TotalCount": 2,
  "PageNumber": 1,
  "PageSize": 20,
  "DomainRecords": {
    "Record": [
      {
        "DomainName": "example.com",
        "RecordId": "99123456789",
        "RR": "www",
        "Type": "A",
        "Value": "192.168.1.1",
        "Line": "default",
        "TTL": 600,
        "Priority": 0,
        "Status": "ENABLE",
        "Locked": false
      }
    ]
  }
}
```

### 3.4 DescribeSubDomainRecords - 查询子域名解析记录

#### 3.4.1 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Action | string | 是 | API名称，固定值：DescribeSubDomainRecords |
| SubDomain | string | 是 | 子域名（如：www.example.com） |
| Type | string | 否 | 解析记录类型 |
| Line | string | 否 | 解析线路 |
| PageNumber | integer | 否 | 当前页数，默认1 |
| PageSize | integer | 否 | 分页大小，默认20 |

### 3.5 AddCustomLine - 添加自定义线路

#### 3.5.1 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Action | string | 是 | API名称，固定值：AddCustomLine |
| DomainName | string | 是 | 域名名称 |
| LineName | string | 是 | 自定义线路名称 |
| IpSegments | string | 是 | IP段列表，多个用逗号分隔 |
| Lang | string | 否 | 语言类型 |

---

## 四、代码示例

### 4.1 Python SDK 示例

#### 4.1.1 安装依赖

```bash
pip install aliyun-python-sdk-core
pip install aliyun-python-sdk-alidns
```

#### 4.1.2 初始化客户端

```python
from aliyunsdkcore.client import AcsClient

# 创建客户端
client = AcsClient('<accessKeyId>', '<accessSecret>', 'cn-hangzhou')
```

#### 4.1.3 添加解析记录（指定解析线路）

```python
from aliyunsdkalidns.request.v20150109 import AddDomainRecordRequest
import json

def add_record_with_line(client, domain, rr, record_type, value, line='default', ttl=600):
    """
    添加DNS解析记录并指定解析线路

    参数：
        client: AcsClient实例
        domain: 域名（如：example.com）
        rr: 主机记录（如：www，@表示主域名）
        record_type: 记录类型（如：A、CNAME）
        value: 记录值（如：IP地址）
        line: 解析线路代码（如：default、telecom、cn_region_beijing等）
        ttl: 生存时间，默认600秒
    """
    request = AddDomainRecordRequest()
    request.set_accept_format('json')
    request.set_DomainName(domain)
    request.set_RR(rr)
    request.set_Type(record_type)
    request.set_Value(value)
    request.set_Line(line)  # 设置解析线路
    request.set_TTL(ttl)

    try:
        response = client.do_action_with_exception(request)
        result = json.loads(str(response, encoding='utf-8'))
        print(f"记录添加成功，RecordId: {result['RecordId']}")
        return result
    except Exception as e:
        print(f"添加记录失败: {e}")
        return None

# 使用示例
if __name__ == '__main__':
    # 创建客户端
    client = AcsClient('<accessKeyId>', '<accessSecret>', 'cn-hangzhou')

    # 添加默认线路解析
    add_record_with_line(client, 'example.com', 'www', 'A', '1.1.1.1', 'default')

    # 添加电信线路解析
    add_record_with_line(client, 'example.com', 'www', 'A', '2.2.2.2', 'telecom')

    # 添加北京地区解析
    add_record_with_line(client, 'example.com', 'www', 'A', '3.3.3.3', 'cn_region_beijing')

    # 添加境外解析
    add_record_with_line(client, 'example.com', 'www', 'A', '4.4.4.4', 'oversea')

    # 添加搜索引擎解析
    add_record_with_line(client, 'example.com', 'www', 'A', '5.5.5.5', 'cn_search_google')
```

#### 4.1.4 查询子域名解析记录

```python
from aliyunsdkalidns.request.v20150109 import DescribeSubDomainRecordsRequest

def query_subdomain(client, subdomain, record_type=None):
    """
    查询子域名的解析记录

    参数：
        client: AcsClient实例
        subdomain: 子域名（如：www.example.com）
        record_type: 记录类型（可选）
    """
    request = DescribeSubDomainRecordsRequest()
    request.set_accept_format('json')
    request.set_SubDomain(subdomain)
    if record_type:
        request.set_Type(record_type)

    try:
        response = client.do_action_with_exception(request)
        result = json.loads(str(response, encoding='utf-8'))
        return result
    except Exception as e:
        print(f"查询失败: {e}")
        return None

# 使用示例
result = query_subdomain(client, 'www.example.com', 'A')
if result:
    for record in result.get('DomainRecords', {}).get('Record', []):
        print(f"RecordId: {record['RecordId']}, Line: {record['Line']}, Value: {record['Value']}")
```

#### 4.1.5 更新解析记录

```python
from aliyunsdkalidns.request.v20150109 import UpdateDomainRecordRequest

def update_record(client, record_id, rr, record_type, value, line='default', ttl=600):
    """
    更新DNS解析记录

    参数：
        client: AcsClient实例
        record_id: 记录ID
        rr: 主机记录
        record_type: 记录类型
        value: 记录值
        line: 解析线路代码
        ttl: 生存时间
    """
    request = UpdateDomainRecordRequest()
    request.set_accept_format('json')
    request.set_RecordId(record_id)
    request.set_RR(rr)
    request.set_Type(record_type)
    request.set_Value(value)
    request.set_Line(line)  # 设置解析线路
    request.set_TTL(ttl)

    try:
        response = client.do_action_with_exception(request)
        result = json.loads(str(response, encoding='utf-8'))
        print(f"记录更新成功，RecordId: {result['RecordId']}")
        return result
    except Exception as e:
        print(f"更新记录失败: {e}")
        return None
```

#### 4.1.6 完整的DDNS示例（支持多线路）

```python
import urllib.request
from aliyunsdkcore.client import AcsClient
from aliyunsdkalidns.request.v20150109 import (
    DescribeSubDomainRecordsRequest,
    AddDomainRecordRequest,
    UpdateDomainRecordRequest
)
import json

def get_public_ip():
    """获取当前公网IP"""
    with urllib.request.urlopen('http://www.3322.org/dyndns/getip') as response:
        ip = str(response.read(), encoding='utf-8').replace("\n", "")
    return ip

def ddns_update_with_line(access_key, access_secret, domain, rr, line='default'):
    """
    动态DNS更新（支持指定线路）

    参数：
        access_key: 阿里云AccessKey ID
        access_secret: 阿里云AccessKey Secret
        domain: 域名（如：example.com）
        rr: 主机记录（如：www）
        line: 解析线路代码
    """
    # 初始化客户端
    client = AcsClient(access_key, access_secret, 'cn-hangzhou')

    # 获取当前公网IP
    current_ip = get_public_ip()
    print(f"当前公网IP: {current_ip}")

    # 查询现有记录
    subdomain = f"{rr}.{domain}" if rr != '@' else domain
    request = DescribeSubDomainRecordsRequest()
    request.set_accept_format('json')
    request.set_SubDomain(subdomain)
    request.set_Type('A')

    try:
        response = client.do_action_with_exception(request)
        result = json.loads(str(response, encoding='utf-8'))
        records = result.get('DomainRecords', {}).get('Record', [])

        # 查找指定线路的记录
        target_record = None
        for record in records:
            if record['Line'] == line:
                target_record = record
                break

        if target_record:
            # 如果记录存在且IP不同，则更新
            if target_record['Value'] != current_ip:
                update_request = UpdateDomainRecordRequest()
                update_request.set_accept_format('json')
                update_request.set_RecordId(target_record['RecordId'])
                update_request.set_RR(rr)
                update_request.set_Type('A')
                update_request.set_Value(current_ip)
                update_request.set_Line(line)
                update_request.set_TTL(600)

                update_response = client.do_action_with_exception(update_request)
                print(f"记录更新成功 (线路: {line})")
            else:
                print(f"IP未变化，无需更新 (线路: {line})")
        else:
            # 记录不存在，添加新记录
            add_request = AddDomainRecordRequest()
            add_request.set_accept_format('json')
            add_request.set_DomainName(domain)
            add_request.set_RR(rr)
            add_request.set_Type('A')
            add_request.set_Value(current_ip)
            add_request.set_Line(line)
            add_request.set_TTL(600)

            add_response = client.do_action_with_exception(add_request)
            print(f"记录添加成功 (线路: {line})")

    except Exception as e:
        print(f"操作失败: {e}")

# 使用示例：为不同线路设置不同的IP
if __name__ == '__main__':
    ACCESS_KEY = '<your-access-key>'
    ACCESS_SECRET = '<your-access-secret>'
    DOMAIN = 'example.com'
    RR = 'www'

    # 更新默认线路
    ddns_update_with_line(ACCESS_KEY, ACCESS_SECRET, DOMAIN, RR, 'default')

    # 更新电信线路
    ddns_update_with_line(ACCESS_KEY, ACCESS_SECRET, DOMAIN, RR, 'telecom')

    # 更新联通线路
    ddns_update_with_line(ACCESS_KEY, ACCESS_SECRET, DOMAIN, RR, 'unicom')
```

### 4.2 Java SDK 示例

#### 4.2.1 添加Maven依赖

```xml
<dependencies>
    <dependency>
        <groupId>com.aliyun</groupId>
        <artifactId>aliyun-java-sdk-core</artifactId>
        <version>4.6.3</version>
    </dependency>
    <dependency>
        <groupId>com.aliyun</groupId>
        <artifactId>aliyun-java-sdk-alidns</artifactId>
        <version>3.0.0</version>
    </dependency>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10.1</version>
    </dependency>
</dependencies>
```

#### 4.2.2 添加解析记录（指定解析线路）

```java
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.exceptions.ServerException;
import com.aliyuncs.profile.DefaultProfile;
import com.aliyuncs.alidns.model.v20150109.*;
import com.google.gson.Gson;

public class AliDnsExample {

    /**
     * 添加DNS解析记录并指定解析线路
     */
    public static void addDomainRecordWithLine(String accessKeyId, String accessSecret,
                                               String domain, String rr, String type,
                                               String value, String line) {
        // 初始化客户端
        DefaultProfile profile = DefaultProfile.getProfile("cn-hangzhou", accessKeyId, accessSecret);
        IAcsClient client = new DefaultAcsClient(profile);

        // 创建请求
        AddDomainRecordRequest request = new AddDomainRecordRequest();
        request.setDomainName(domain);
        request.setRR(rr);
        request.setType(type);
        request.setValue(value);
        request.setLine(line);  // 设置解析线路
        request.setTTL(600L);

        try {
            AddDomainRecordResponse response = client.getAcsResponse(request);
            System.out.println("记录添加成功");
            System.out.println("RecordId: " + response.getRecordId());
            System.out.println("RequestId: " + response.getRequestId());
        } catch (ServerException e) {
            e.printStackTrace();
        } catch (ClientException e) {
            System.out.println("错误码: " + e.getErrCode());
            System.out.println("错误信息: " + e.getErrMsg());
            System.out.println("请求ID: " + e.getRequestId());
        }
    }

    /**
     * 查询解析记录
     */
    public static void describeDomainRecords(String accessKeyId, String accessSecret,
                                            String domain) {
        DefaultProfile profile = DefaultProfile.getProfile("cn-hangzhou", accessKeyId, accessSecret);
        IAcsClient client = new DefaultAcsClient(profile);

        DescribeDomainRecordsRequest request = new DescribeDomainRecordsRequest();
        request.setDomainName(domain);

        try {
            DescribeDomainRecordsResponse response = client.getAcsResponse(request);
            System.out.println("总记录数: " + response.getTotalCount());

            for (DescribeDomainRecordsResponse.Record record : response.getDomainRecords()) {
                System.out.println("RecordId: " + record.getRecordId());
                System.out.println("RR: " + record.getRR());
                System.out.println("Type: " + record.getType());
                System.out.println("Value: " + record.getValue());
                System.out.println("Line: " + record.getLine());
                System.out.println("TTL: " + record.getTTL());
                System.out.println("---");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 更新解析记录
     */
    public static void updateDomainRecord(String accessKeyId, String accessSecret,
                                         String recordId, String rr, String type,
                                         String value, String line) {
        DefaultProfile profile = DefaultProfile.getProfile("cn-hangzhou", accessKeyId, accessSecret);
        IAcsClient client = new DefaultAcsClient(profile);

        UpdateDomainRecordRequest request = new UpdateDomainRecordRequest();
        request.setRecordId(recordId);
        request.setRR(rr);
        request.setType(type);
        request.setValue(value);
        request.setLine(line);  // 设置解析线路
        request.setTTL(600L);

        try {
            UpdateDomainRecordResponse response = client.getAcsResponse(request);
            System.out.println("记录更新成功");
            System.out.println("RecordId: " + response.getRecordId());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        String accessKeyId = "<your-access-key-id>";
        String accessSecret = "<your-access-secret>";
        String domain = "example.com";

        // 添加默认线路解析
        addDomainRecordWithLine(accessKeyId, accessSecret, domain, "www", "A", "1.1.1.1", "default");

        // 添加电信线路解析
        addDomainRecordWithLine(accessKeyId, accessSecret, domain, "www", "A", "2.2.2.2", "telecom");

        // 添加联通线路解析
        addDomainRecordWithLine(accessKeyId, accessSecret, domain, "www", "A", "3.3.3.3", "unicom");

        // 添加移动线路解析
        addDomainRecordWithLine(accessKeyId, accessSecret, domain, "www", "A", "4.4.4.4", "mobile");

        // 添加北京地区解析
        addDomainRecordWithLine(accessKeyId, accessSecret, domain, "www", "A", "5.5.5.5", "cn_region_beijing");

        // 添加境外解析
        addDomainRecordWithLine(accessKeyId, accessSecret, domain, "www", "A", "6.6.6.6", "oversea");

        // 查询所有解析记录
        describeDomainRecords(accessKeyId, accessSecret, domain);
    }
}
```

#### 4.2.3 完整的服务类示例

```java
import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.profile.DefaultProfile;
import com.aliyuncs.alidns.model.v20150109.*;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import java.util.List;

@Service
public class AliDnsService {

    private IAcsClient client;
    private final String accessKeyId = "<your-access-key-id>";
    private final String accessSecret = "<your-access-secret>";

    @PostConstruct
    public void init() {
        DefaultProfile profile = DefaultProfile.getProfile("cn-hangzhou", accessKeyId, accessSecret);
        this.client = new DefaultAcsClient(profile);
    }

    /**
     * 添加智能解析记录
     *
     * @param domain 域名
     * @param rr 主机记录
     * @param type 记录类型
     * @param value 记录值
     * @param line 解析线路（default, telecom, unicom, mobile等）
     * @return 记录ID
     */
    public String addSmartDnsRecord(String domain, String rr, String type,
                                   String value, String line) {
        AddDomainRecordRequest request = new AddDomainRecordRequest();
        request.setDomainName(domain);
        request.setRR(rr);
        request.setType(type);
        request.setValue(value);
        request.setLine(line);
        request.setTTL(600L);

        try {
            AddDomainRecordResponse response = client.getAcsResponse(request);
            return response.getRecordId();
        } catch (Exception e) {
            throw new RuntimeException("添加DNS记录失败: " + e.getMessage(), e);
        }
    }

    /**
     * 批量添加多线路解析
     *
     * @param domain 域名
     * @param rr 主机记录
     * @param lineValueMap 线路-IP映射（例如：{"default": "1.1.1.1", "telecom": "2.2.2.2"}）
     */
    public void addMultiLineRecords(String domain, String rr,
                                   java.util.Map<String, String> lineValueMap) {
        for (java.util.Map.Entry<String, String> entry : lineValueMap.entrySet()) {
            String line = entry.getKey();
            String value = entry.getValue();
            String recordId = addSmartDnsRecord(domain, rr, "A", value, line);
            System.out.println("线路 " + line + " 记录添加成功，RecordId: " + recordId);
        }
    }

    /**
     * 获取域名的所有解析记录
     */
    public List<DescribeDomainRecordsResponse.Record> getDomainRecords(String domain) {
        DescribeDomainRecordsRequest request = new DescribeDomainRecordsRequest();
        request.setDomainName(domain);

        try {
            DescribeDomainRecordsResponse response = client.getAcsResponse(request);
            return response.getDomainRecords();
        } catch (Exception e) {
            throw new RuntimeException("查询DNS记录失败: " + e.getMessage(), e);
        }
    }
}
```

### 4.3 使用阿里云CLI

#### 4.3.1 安装CLI

```bash
# Linux/Mac
curl -L https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz | tar -xz
sudo mv aliyun /usr/local/bin/

# Windows
# 下载 https://aliyuncli.alicdn.com/aliyun-cli-windows-latest-amd64.zip
# 解压后添加到PATH环境变量
```

#### 4.3.2 配置凭证

```bash
aliyun configure
# 按提示输入 Access Key ID 和 Access Key Secret
```

#### 4.3.3 添加解析记录（指定线路）

```bash
# 添加默认线路
aliyun alidns AddDomainRecord \
  --DomainName example.com \
  --RR www \
  --Type A \
  --Value 1.1.1.1 \
  --Line default \
  --TTL 600

# 添加电信线路
aliyun alidns AddDomainRecord \
  --DomainName example.com \
  --RR www \
  --Type A \
  --Value 2.2.2.2 \
  --Line telecom \
  --TTL 600

# 添加北京地区线路
aliyun alidns AddDomainRecord \
  --DomainName example.com \
  --RR www \
  --Type A \
  --Value 3.3.3.3 \
  --Line cn_region_beijing \
  --TTL 600
```

#### 4.3.4 查询解析记录

```bash
# 查询所有记录
aliyun alidns DescribeDomainRecords \
  --DomainName example.com

# 查询特定线路的记录
aliyun alidns DescribeDomainRecords \
  --DomainName example.com \
  --Line telecom
```

#### 4.3.5 更新解析记录

```bash
aliyun alidns UpdateDomainRecord \
  --RecordId 123456789 \
  --RR www \
  --Type A \
  --Value 4.4.4.4 \
  --Line mobile \
  --TTL 600
```

---

## 五、典型应用场景

### 5.1 多运营商智能调度

**场景：** 网站部署在不同运营商的机房，希望用户访问时自动解析到同运营商的服务器。

**实现方案：**
```python
# 为不同运营商配置不同的服务器IP
add_record_with_line(client, 'example.com', 'www', 'A', '电信机房IP', 'telecom')
add_record_with_line(client, 'example.com', 'www', 'A', '联通机房IP', 'unicom')
add_record_with_line(client, 'example.com', 'www', 'A', '移动机房IP', 'mobile')
add_record_with_line(client, 'example.com', 'www', 'A', '默认机房IP', 'default')
```

### 5.2 地域就近访问

**场景：** 在全国多个地区部署服务器，希望用户访问就近的服务器。

**实现方案：**
```python
# 华北用户访问北京机房
add_record_with_line(client, 'example.com', 'api', 'A', '北京服务器IP', 'cn_region_huabei')

# 华东用户访问上海机房
add_record_with_line(client, 'example.com', 'api', 'A', '上海服务器IP', 'cn_region_huadong')

# 华南用户访问深圳机房
add_record_with_line(client, 'example.com', 'api', 'A', '深圳服务器IP', 'cn_region_huanan')

# 其他地区访问默认机房
add_record_with_line(client, 'example.com', 'api', 'A', '默认服务器IP', 'default')
```

### 5.3 国内外分离

**场景：** 国内用户访问国内服务器，国外用户访问海外服务器。

**实现方案：**
```python
# 国内用户
add_record_with_line(client, 'example.com', 'www', 'A', '国内服务器IP', 'internal')

# 国外用户
add_record_with_line(client, 'example.com', 'www', 'A', '海外服务器IP', 'oversea')

# 默认
add_record_with_line(client, 'example.com', 'www', 'A', '默认服务器IP', 'default')
```

### 5.4 搜索引擎优化

**场景：** 为搜索引擎爬虫配置专门的服务器，避免影响正常用户访问。

**实现方案：**
```python
# 百度爬虫访问专用服务器
add_record_with_line(client, 'example.com', 'www', 'A', 'SEO服务器IP', 'cn_search_baidu')

# 谷歌爬虫访问专用服务器
add_record_with_line(client, 'example.com', 'www', 'A', 'SEO服务器IP', 'cn_search_google')

# 普通用户访问正常服务器
add_record_with_line(client, 'example.com', 'www', 'A', '正常服务器IP', 'default')
```

### 5.5 云资源就近访问

**场景：** 阿里云ECS实例访问就近的云服务。

**实现方案：**
```python
# 北京区域的ECS访问北京的服务
add_record_with_line(client, 'api.example.com', 'internal', 'A', '北京内网IP', 'aliyun_cn_beijing')

# 上海区域的ECS访问上海的服务
add_record_with_line(client, 'api.example.com', 'internal', 'A', '上海内网IP', 'aliyun_cn_shanghai')

# 其他云厂商或公网访问
add_record_with_line(client, 'api.example.com', 'internal', 'A', '公网IP', 'default')
```

---

## 六、最佳实践

### 6.1 必须配置默认线路

无论配置多少条智能解析线路，都必须配置一条默认线路（Line=default）作为兜底解析。当访问者来源无法匹配任何智能线路时，将返回默认线路的解析结果。

### 6.2 线路规划建议

1. **从粗到细**：先配置大区线路（如华北、华东），再根据需要配置省级线路
2. **运营商优先**：如果主要优化网络速度，优先配置运营商线路（电信、联通、移动）
3. **必要时使用自定义线路**：对于特殊需求（如特定IP段），使用自定义线路

### 6.3 TTL值设置

- **生产环境**：建议设置600秒（10分钟）或更高，减轻DNS服务器压力
- **测试阶段**：可以设置60秒，便于快速验证修改效果
- **动态DNS**：建议设置300-600秒，平衡更新速度和查询压力

### 6.4 记录管理

使用RecordId管理记录，避免重复添加：
1. 添加记录前，先使用DescribeSubDomainRecords查询是否已存在
2. 如果存在，使用UpdateDomainRecord更新
3. 如果不存在，使用AddDomainRecord添加

### 6.5 异常处理

```python
try:
    response = client.do_action_with_exception(request)
except Exception as e:
    if 'DomainRecordDuplicate' in str(e):
        print("记录已存在，请使用更新接口")
    elif 'InvalidAccessKeyId' in str(e):
        print("AccessKey无效")
    elif 'IncorrectDomainUser' in str(e):
        print("域名不属于当前账户")
    else:
        print(f"其他错误: {e}")
```

### 6.6 权限控制

使用RAM子账户时，需授予以下权限：
```json
{
  "Version": "1",
  "Statement": [
    {
      "Action": [
        "alidns:AddDomainRecord",
        "alidns:UpdateDomainRecord",
        "alidns:DescribeDomainRecords",
        "alidns:DescribeSubDomainRecords"
      ],
      "Resource": "*",
      "Effect": "Allow"
    }
  ]
}
```

---

## 七、常见错误码

| 错误码 | 说明 | 解决方法 |
|--------|------|---------|
| InvalidAccessKeyId.NotFound | AccessKey不存在 | 检查AccessKey ID是否正确 |
| SignatureDoesNotMatch | 签名不匹配 | 检查AccessKey Secret是否正确 |
| DomainRecordDuplicate | 记录重复 | 使用UpdateDomainRecord更新记录 |
| IncorrectDomainUser | 域名不属于当前账户 | 检查域名归属 |
| InvalidDomainName.NoExist | 域名不存在 | 先将域名添加到云解析DNS |
| InvalidLine | 无效的解析线路 | 检查Line参数是否正确 |
| InvalidRR | 无效的主机记录 | 检查RR参数格式 |
| InvalidType | 无效的记录类型 | 检查Type参数（A、AAAA、CNAME等） |
| Throttling.User | 请求频率超限 | 降低API调用频率 |

---

## 八、参考资料

1. **官方API文档**
   - API概览：https://help.aliyun.com/zh/dns/api-reference-1-1/
   - AddDomainRecord：https://help.aliyun.com/zh/dns/api-alidns-2015-01-09-adddomainrecord
   - UpdateDomainRecord：https://help.aliyun.com/zh/dns/api-alidns-2015-01-09-updatedomainrecord

2. **智能解析文档**
   - 智能解析说明：https://help.aliyun.com/zh/dns/pubz-intelligent-analysis
   - 解析线路枚举：https://help.aliyun.com/zh/dns/pubz-resolve-line-enumeration/

3. **SDK文档**
   - Python SDK：https://pypi.org/project/aliyun-python-sdk-alidns/
   - Java SDK：https://github.com/aliyun/aliyun-openapi-java-sdk

4. **OpenAPI Explorer**
   - 在线调试：https://next.api.alibabacloud.com/product/Alidns

---

## 九、总结

阿里云DNS的智能解析功能提供了丰富的线路选择：

1. **线路类型**：支持默认、运营商、地域（国内/国外）、云厂商、搜索引擎、自定义等6大类线路
2. **细分粒度**：最细可以精确到省级、运营商省级、阿里云具体区域
3. **API简单**：通过Line参数即可指定解析线路，易于集成
4. **SDK丰富**：提供Python、Java等多种语言SDK，支持快速开发
5. **优先级明确**：自定义 > 搜索引擎 > 云厂商 > 运营商 > 地域 > 默认

通过智能解析，可以实现：
- 多运营商就近访问
- 多地域负载均衡
- 国内外分离
- 搜索引擎优化
- 云资源内网互访

建议在使用时：
- 必须配置默认线路作为兜底
- 合理规划线路层级
- 设置适当的TTL值
- 做好异常处理和权限控制
