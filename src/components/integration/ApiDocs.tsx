import { useState } from 'react';
import { FileText, Shield, Key, Code, Webhook, AlertTriangle, Copy, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

const sections = [
  {
    id: 'auth',
    title: 'Authentication',
    icon: Shield,
    content: `NiceC WMS API supports two authentication methods:

1. JWT Bearer Token (for interactive use)
   - Login via POST /api/auth/login
   - Use the returned token in the Authorization header

2. API Key (for programmatic access)
   - Create an API Key from the Integration Center
   - Pass it in the X-API-Key header

Header Examples:
  Authorization: Bearer <your-jwt-token>
  X-API-Key: nwc_<your-api-key>`,
  },
  {
    id: 'endpoints',
    title: 'Core Endpoints',
    icon: Code,
    content: `Base URL: /api

## Outbound Orders
GET    /api/outbound-orders          - List orders (with filters)
POST   /api/outbound-orders          - Create an order
GET    /api/outbound-orders/:id      - Get order details
PUT    /api/outbound-orders/:id      - Update order
DELETE /api/outbound-orders/:id      - Cancel order
POST   /api/outbound-orders/:id/cancel
POST   /api/outbound-orders/:id/ship
POST   /api/outbound-orders/import   - Bulk import

## Inventory
GET    /api/inventory                - List inventory
POST   /api/inventory/adjust         - Adjust stock
POST   /api/inventory/transfer       - Transfer between warehouses

## Inbound (ASN)
GET    /api/inbound-orders           - List ASNs
POST   /api/inbound-orders           - Create ASN
POST   /api/inbound-orders/:id/receive

## Returns
GET    /api/return-orders
POST   /api/return-orders
POST   /api/return-orders/:id/receive
POST   /api/return-orders/:id/inspect
POST   /api/return-orders/:id/restock

## Billing
GET    /api/billing-rules
GET    /api/billing-records
GET    /api/invoices

## Integration
GET    /api/api-keys
POST   /api/api-keys
GET    /api/webhooks
POST   /api/webhooks
GET    /api/store-connections`,
  },
  {
    id: 'curl',
    title: 'cURL Examples',
    icon: Key,
    content: `## Login
curl -X POST /api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"client@nicecwms.com","password":"client123456"}'

## List Outbound Orders
curl -H "Authorization: Bearer <token>" \\
  "/api/outbound-orders?status=PENDING&page=1&pageSize=10"

## Create Outbound Order
curl -X POST /api/outbound-orders \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "logisticsChannelId": "chan_usps_ground",
    "carrierId": "carr_usps",
    "recipient": "John Doe, 123 Main St, NY, USA",
    "items": [{"skuId": "sku_1", "qty": 1}]
  }'

## Check Inventory
curl -H "Authorization: Bearer <token>" /api/inventory

## Create ASN
curl -X POST /api/inbound-orders \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "warehouseId": "wh_1",
    "remark": "Test inbound",
    "items": [{"skuId": "sku_1", "skuCode": "TS-V-NA-4", "qtyExpected": 100}]
  }'

## Using API Key
curl -H "X-API-Key: nwc_your_api_key_here" \\
  "/api/outbound-orders?page=1"`,
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: Webhook,
    content: `## Webhook Events
NiceC WMS sends webhook notifications for these events:

| Event | Description |
|-------|-------------|
| order.created | A new outbound order is created |
| order.updated | An existing order is updated |
| order.shipped | An order is shipped/completed |
| inventory.updated | Inventory levels change |
| inbound.completed | An inbound ASN is completed |
| return.completed | A return order is completed |

## Webhook Payload
Each webhook POSTs a JSON payload to your registered URL:
{
  "event": "order.created",
  "timestamp": "2026-07-04T12:00:00Z",
  "data": { ... }
}

## Signature Verification
Webhook payloads are signed using HMAC-SHA256.
The signature is sent in the X-Webhook-Signature header.
Verify using your webhook secret:
  HMAC-SHA256(webhook_secret, request_body)

## Configuration
Configure webhooks in the Integration Center > Webhooks tab.
You can test webhooks with the "Test" button.`,
  },
  {
    id: 'errors',
    title: 'Error Codes',
    icon: AlertTriangle,
    content: `All API errors return a consistent format:

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [...]  // validation details (optional)
  }
}

## Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| VALIDATION_ERROR | 400 | Request body validation failed |
| NOT_FOUND | 404 | Requested resource not found |
| INSUFFICIENT_STOCK | 400 | Not enough available inventory |
| RATE_LIMITED | 429 | Too many requests (200/15min general, 20/15min for login) |
| INTERNAL_ERROR | 500 | Internal server error (no stack trace in production) |`,
  },
];

export default function ApiDocs() {
  const [expanded, setExpanded] = useState<string>('auth');
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            API Documentation
          </h2>
          <p className="text-sm text-gray-500">Version 1.0.0 | Base URL: /api</p>
        </div>
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded === section.id;
          return (
            <div key={section.id} className="bg-white border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? '' : section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
              >
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <Icon className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{section.title}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t">
                  <div className="mt-3 relative group">
                    <button
                      onClick={() => copyText(section.content, section.id)}
                      className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy section"
                    >
                      {copied === section.id ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">{section.content}</pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-medium text-blue-800 mb-1">Need help?</p>
        <p className="text-blue-600">Contact your WMS administrator or submit a feedback ticket for API support.</p>
      </div>
    </div>
  );
}
