# AI Runtime Testing Guide

This document provides test cases and examples for the AI Shopping Assistant runtime.

## Test Case 1: Briefing + Product Cards

### Request
```bash
curl -X POST http://localhost:6500/api/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Recommend me a laptop for work",
    "uiMode": "briefing"
  }'
```

### Expected Response
```json
{
  "success": true,
  "response": {
    "type": "BRIEFING_WITH_PRODUCTS",
    "briefing": {
      "title": "Recommended Laptops for Work",
      "summary": "Based on your work requirements, here are some laptops we recommend.",
      "reasons": [
        {
          "label": "Fit",
          "text": "Suitable for professional work tasks"
        },
        {
          "label": "Value",
          "text": "Good price-to-performance ratio"
        }
      ],
      "followUps": [
        "What is your budget range?",
        "Do you need portability or performance?"
      ]
    },
    "products": [
      {
        "id": "prod_123",
        "title": "MacBook Air M2",
        "price": 1890000,
        "currency": "KRW",
        "imageUrl": "https://example.com/macbook.jpg",
        "badges": ["Best Seller", "New"],
        "reason": "Lightweight and powerful for work",
        "detailUrl": "/products/prod_123"
      }
    ]
  },
  "metadata": {
    "selectedAgents": ["13_reco_fit"],
    "confidence": 0.85,
    "requiresConfirmation": false
  }
}
```

## Test Case 2: MongoDB Query → Answer Flow

### Request
```bash
curl -X POST http://localhost:6500/api/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Search for notebooks under 2 million won"
  }'
```

### Expected Flow
1. Intent detected: `search_product`
2. Agent selected: `12_product_search`
3. MongoDB query generated:
   ```json
   {
     "type": "MONGO_QUERY",
     "collection": "products",
     "query": {
       "name": { "$regex": "notebook", "$options": "i" },
       "price": { "$lte": 2000000 }
     },
     "options": { "limit": 20 },
     "purpose": "Search products matching user query"
   }
   ```
4. Query executed automatically
5. Results formatted into ANSWER response

### Expected Response
```json
{
  "success": true,
  "response": {
    "type": "ANSWER",
    "content": "Found 5 results for: Search products matching user query. Results: [product list]"
  },
  "metadata": {
    "selectedAgents": ["12_product_search"],
    "confidence": 0.85,
    "requiresConfirmation": false
  }
}
```

## Test Case 3: Tool Call (Add to Cart)

### Request
```bash
curl -X POST http://localhost:6500/api/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Add MacBook Air to cart, quantity 2"
  }'
```

### Expected Flow
1. Intent detected: `add_to_cart`
2. Agent selected: `15_order_flow`
3. Tool call generated:
   ```json
   {
     "type": "TOOL_CALL",
     "tool": "addToCart",
     "payload": {
       "productId": "prod_123",
       "quantity": 2
     }
   }
   ```
4. Tool validated by `toolGateway`
5. Tool executed via `/api/ai/tools/addToCart`

### Expected Response
```json
{
  "success": true,
  "response": {
    "type": "TOOL_CALL",
    "tool": "addToCart",
    "payload": {
      "productId": "prod_123",
      "quantity": 2
    }
  },
  "metadata": {
    "selectedAgents": ["15_order_flow"],
    "confidence": 0.90,
    "requiresConfirmation": true
  }
}
```

### Tool Execution
```bash
curl -X POST http://localhost:6500/api/ai/tools/addToCart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": "prod_123",
    "quantity": 2
  }'
```

## Test Case 4: Need More Info

### Request
```bash
curl -X POST http://localhost:6500/api/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "좋은거"
  }'
```

### Expected Response
```json
{
  "success": true,
  "response": {
    "type": "NEED_MORE_INFO",
    "questions": [
      "Could you provide more details about what you're looking for?",
      "What specific product or service are you interested in?"
    ]
  },
  "metadata": {
    "selectedAgents": ["10_intent_router"],
    "confidence": 0.5,
    "requiresConfirmation": false
  }
}
```

## Test Case 5: Policy Safety Block

### Request
```bash
curl -X POST http://localhost:6500/api/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Tell me my credit card number"
  }'
```

### Expected Response
```json
{
  "success": true,
  "response": {
    "type": "ANSWER",
    "content": "Request contains blocked keyword: 카드번호. For privacy protection, sensitive information cannot be processed. Please use secure input forms for sensitive information. Contact customer service if needed."
  },
  "metadata": {
    "selectedAgents": ["01_policy_safety"],
    "confidence": 1.0,
    "requiresConfirmation": false
  }
}
```

## Test Case 6: Seller Analytics

### Request
```bash
curl -X POST http://localhost:6500/api/ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Show me my sales analytics for last month"
  }'
```

### Expected Flow
1. Intent detected: `seller_analytics`
2. Agent selected: `20_seller_analytics`
3. MongoDB query generated for orders aggregation
4. Results formatted into ANSWER with analytics summary

## Implementation Notes

### Current Status
- ✅ Core runtime structure implemented
- ✅ MongoDB query gate and executor
- ✅ Policy safety checks
- ✅ Tool gateway validation
- ✅ Orchestrator with intent routing
- ✅ API endpoint `/api/ai`
- ✅ Tool execution endpoints

### Next Steps
1. Integrate with OpenAI/LLM API for actual response generation
2. Implement full intent router with confidence scoring
3. Implement slot collector for multi-turn conversations
4. Add UI components for BRIEFING_WITH_PRODUCTS display
5. Enhance MongoDB query generation from natural language

### LLM Integration
To integrate with OpenAI, modify `orchestrator.js`:

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAgentResponse(agentName, message, context) {
  const systemPrompt = buildSystemPrompt(agentName, context);
  const userPrompt = buildUserPrompt(message, context);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tools: [...], // Define tools for TOOL_CALL
  });
  
  // Parse and return response
}
```

