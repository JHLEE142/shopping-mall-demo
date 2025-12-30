# AI Shopping Assistant Agents

This directory is the **Single Source of Truth (SSoT)** for all AI agent specifications, schemas, prompts, datasets, models, and documentation for the AI Shopping Assistant system.

## 🎯 Single Source of Truth (SSoT)

**`agents/specs/`** contains 24 agent specification markdown files that define:
- Agent roles, goals, inputs, outputs
- Guardrails and validation rules
- Execution procedures
- Examples and failure scenarios

**All runtime implementations must follow these specifications exactly.**

## 📁 Directory Structure

```
agents/
├── specs/                          # SSoT: Agent specification markdown files (24 files)
│   ├── 00_orchestrator.md          # Core: Main coordinator
│   ├── 01_policy_safety.md         # Core: Safety validation
│   ├── 02_tool_gateway.md          # Core: Tool call validation
│   ├── 10_intent_router.md         # Consumer: Intent classification
│   ├── 11_slot_collector.md       # Consumer: Information collection
│   ├── 12_product_search.md       # Consumer: Product search
│   ├── 13_reco_fit.md              # Consumer: Product recommendations
│   ├── 14_price_compare.md         # Consumer: Price comparison
│   ├── 15_order_flow.md           # Consumer: Cart & purchase flow
│   ├── 16_after_sales.md          # Consumer: Cancellation & refunds
│   ├── 17_review_assistant.md     # Consumer: Review writing
│   ├── 18_account_rewards.md      # Consumer: Points & discounts
│   ├── 20_seller_analytics.md     # Seller: Sales analytics
│   ├── 21_pricing_simulator.md    # Seller: Pricing simulation
│   ├── 22_product_efficiency.md   # Seller: Product efficiency analysis
│   ├── 23_listing_assistant.md    # Seller: Product listing
│   ├── 30_spend_behavior_analyst.md # Behavior: Spending analysis
│   ├── 31_reflection_coach.md     # Behavior: Reflection & coaching
│   ├── 40_data_curator.md         # Data: Data curation
│   ├── 41_critic_grader.md        # Data: Quality grading
│   ├── 42_testcase_generator.md   # Data: Test case generation
│   └── 43_finetune_packager.md    # Data: Fine-tuning packaging
├── schemas/                        # JSON schemas (operational reference)
│   ├── action_schema.json         # Tool/action call schema
│   ├── response_schema.json       # AI response format schema
│   └── intent_schema.json         # Intent taxonomy and agent mapping
├── prompts/                        # Meta-prompts for generation
│   ├── agent_md_generator.md      # Prompt for generating agent specs
│   ├── jsonl_generator.md         # Prompt for generating fine-tuning data
│   ├── action_schema_gen.md       # Prompt for updating action schema
│   └── eval_prompt.md             # Prompt for evaluation
├── datasets/                       # Fine-tuning datasets (gitignored)
│   ├── raw/                       # Raw conversation data
│   ├── silver/                    # Processed data (needs review)
│   ├── gold/                      # High-quality data (ready for training)
│   └── eval/                      # Evaluation datasets
├── models/                         # AI models (gitignored)
│   ├── base/                      # Base models
│   ├── finetuned/                 # Fine-tuned models
│   ├── adapters/                  # LoRA/Adapter weights
│   └── README.md                  # Model storage rules
├── docs/                           # Documentation
│   ├── AI_RUNTIME_IMPLEMENTATION.md # Runtime implementation details
│   └── AI_RUNTIME_TESTING.md      # Testing guide and examples
└── README.md                       # This file
```

## 🔗 Runtime Implementation

The runtime implementation is located at:
- **`/server/src/ai_runtime/`** - Main runtime code
  - `mdLoader.js` - Loads agent specs from `agents/specs/`
  - `promptBuilder.js` - Builds prompts from specs
  - `orchestrator.js` - Main orchestration logic
  - `schemas.js` - Zod schemas (must match `agents/schemas/*.json`)
  - `policySafety.js`, `toolGateway.js`, `mongoQueryGate.js`, etc.

**Path Resolution**: The runtime uses `process.cwd()` to safely resolve `agents/specs/` path, ensuring it works from any execution context.

## 🎯 Agent Categories & Responsibilities

### Core Agents (00-02)
**Foundation layer that all requests pass through**

#### 00_orchestrator.md
- **Role**: Central coordinator for agent routing and response synthesis
- **Key Functions**:
  - Intent confidence evaluation and override decisions
  - Multi-intent priority resolution
  - Agent call sequence optimization
  - Final response synthesis (summary → action → warnings)
- **Critical Rules**:
  - Confidence >= 0.85: Trust and process immediately
  - 0.70-0.85: Use slot collector for confirmation
  - < 0.70: Return clarification question
  - Policy safety blocks override all other agents

#### 01_policy_safety.md
- **Role**: Validates all requests against safety policies
- **Key Functions**:
  - PII protection (blocks personal info requests)
  - Illegal product/service detection
  - Minor protection (age-restricted content)
  - Manipulation detection (forced purchase language)
- **Verdicts**: ALLOW | WARN | BLOCK
- **Critical Rules**:
  - BLOCK: Immediate stop, provide alternative guidance
  - WARN: Proceed with caution, log for review
  - Always provide user-friendly explanation

#### 02_tool_gateway.md
- **Role**: Validates and sanitizes tool/action calls
- **Key Functions**:
  - JSON schema validation
  - Required field checking
  - Data type and format validation
  - Business logic validation
- **Fail-Fast Principle**: First validation failure immediately rejects action
- **Allowed Tools**: addToCart, toggleWishlist, goToCheckout, requestCancel, requestRefund, sellerProductRegister

### Consumer Agents (10-18)
**User-facing shopping assistance**

#### 10_intent_router.md
- **Role**: Classifies user intent from messages
- **Intent Taxonomy**: 15+ consumer intents (search_product, get_recommendation, add_to_cart, purchase, etc.)
- **Key Functions**:
  - Keyword extraction and matching
  - Context-aware intent detection
  - Confidence scoring (0.0-1.0)
  - Alternative intent suggestions
- **Confidence Interpretation**:
  - 0.90-1.00: Very high, clear keywords and context match
  - 0.75-0.89: High, main keywords match
  - 0.60-0.74: Medium, keywords match but context unclear
  - < 0.45: Low, return "unknown" intent

#### 11_slot_collector.md
- **Role**: Collects required information (slots) for intent execution
- **Key Functions**:
  - Intent-specific required slot identification
  - Automatic slot extraction from messages
  - One-slot-at-a-time questioning (minimize user burden)
  - Slot validation
- **Critical Rules**:
  - Ask only one slot per turn
  - Never re-ask collected slots
  - Auto-fill from user profile when possible
  - Example slots: product_id, quantity, budget, use_case, category

#### 12_product_search.md
- **Role**: Searches products based on user queries
- **Key Functions**:
  - Query parsing and keyword extraction
  - Filter application (category, price, brand, rating)
  - Result sorting (relevance, price, rating, popularity)
  - Search reasoning explanation
- **Sorting Priorities**:
  - Relevance: keyword match > sales volume > rating > stock status
  - Price: discount price first, then sales volume
  - Rating: rating desc, then review count
- **Fallback Strategy**: No results → suggest similar keywords, browse categories, recommend popular items

#### 13_reco_fit.md
- **Role**: Provides product recommendations with fit analysis
- **Key Functions**:
  - Fit score calculation (price, use case, brand preference, purchase history, rating, stock)
  - Recommendation reasoning (user perspective)
  - Over-recommendation prevention (max 10 items, min fit score 0.6)
- **Fit Score Components**:
  - Price fit: 30%
  - Use case fit: 25%
  - Brand preference: 15%
  - Purchase history similarity: 15%
  - Rating/reviews: 10%
  - Stock status: 5%
- **Critical Rules**: Always explain "why" from user's perspective, never use technical scores

#### 14_price_compare.md
- **Role**: Compares prices across products
- **Key Functions**:
  - Final price calculation (base → discount → coupon → points)
  - Savings calculation
  - Shipping cost inclusion
- **Price Calculation Order**:
  1. Base price
  2. Original price (if exists)
  3. Discount calculation
  4. Coupon application
  5. Points application
  6. Final price
- **Critical Rules**: Never guess prices, always state "information unavailable" if uncertain

#### 15_order_flow.md
- **Role**: Handles cart addition and purchase flows
- **Key Functions**:
  - Pre-purchase checklist validation
  - READY_FOR_PAYMENT action generation
  - User confirmation questions
- **Required Checklist**:
  - Login status
  - Product info & stock
  - Quantity validation
  - Required options
  - Shipping address
  - Payment method
  - Final price confirmation
  - Cancellation/refund policy notice
- **Action Generation**: Only when all checks pass and user confirms

#### 16_after_sales.md
- **Role**: Handles cancellations, refunds, and exchanges
- **Key Functions**:
  - Order status validation
  - Allow/deny decision based on status
  - Policy explanation
  - Emotion-neutral tone maintenance
- **Status-Based Rules**:
  - Cancel: Allowed for pending/paid/preparing, blocked for shipped/delivered
  - Refund: Allowed for delivered (within 7 days), blocked for pending/paid/preparing
  - Exchange: Not available (use return + repurchase)
- **Critical Rules**: No excessive apologies, state facts only, provide alternatives

#### 17_review_assistant.md
- **Role**: Assists with review writing
- **Key Functions**:
  - Review structure template provision
  - Fake/exaggerated review prevention
  - User original vs AI assistance boundary
- **Review Structure**:
  - Purchase reason/expectation (optional)
  - Usage experience (required): pros, cons, actual use cases
  - Recommendation (optional)
- **Critical Rules**: AI only provides template/structure, never writes content directly

#### 18_account_rewards.md
- **Role**: Manages points and discount information
- **Key Functions**:
  - Summary information prioritization
  - Consumption inducement prohibition
  - Next action suggestion limitation
- **Summary Priority**:
  1. Available points
  2. Expiring soon points (within 30 days)
  3. Recent transactions (last 5)
  4. Available coupons count
  5. Full history (on request only)
- **Critical Rules**: Never use "buy now", "use now", only provide information

### Seller Agents (20-23)
**Seller revenue and product management**

#### 20_seller_analytics.md
- **Role**: Analyzes sales, revenue, and margins
- **Key Functions**:
  - Monthly revenue/cost/margin calculation
  - Trend analysis
  - Top drivers identification
  - Forecast generation (with uncertainty)
- **Critical Rules**:
  - Always state uncertainty level (low/medium/high)
  - Never use definitive language ("will increase" → "likely to increase")
  - Always explain top drivers (causes of changes)
  - Use probability/range expressions

#### 21_pricing_simulator.md
- **Role**: Simulates pricing scenarios
- **Key Functions**:
  - Baseline definition (current price/demand)
  - Scenario comparison structure
  - Revenue/profit change calculation
  - Best scenario identification
- **Critical Rules**:
  - Always define baseline first
  - Price increase ≠ profit increase (consider demand elasticity)
  - Revenue increase ≠ profit increase (consider costs)
  - Default elasticity: -1.5 (10% price increase → 15% demand decrease)

#### 22_product_efficiency.md
- **Role**: Analyzes product efficiency (high margin/low efficiency classification)
- **Key Functions**:
  - Margin rate calculation
  - Efficiency score calculation (inventory turnover + sales velocity)
  - Actionable recommendations
- **Classifications**:
  - High margin: >= 40%
  - Low margin: < 20%
  - High efficiency: >= 0.7
  - Low efficiency: < 0.4
- **Critical Rules**: Never just classify, always provide actionable recommendations

#### 23_listing_assistant.md
- **Role**: Assists with product listing creation
- **Key Functions**:
  - Required field validation
  - Risk/warning identification
  - Auto-generation vs user confirmation distinction
- **Required Fields**: name, price, category, description, images, stock, shipping
- **Risk Warnings**:
  - Price below cost → loss warning
  - Stock = 0 → cannot sell warning
  - No images → sales disadvantage warning
  - Short description → insufficient information warning
- **Critical Rules**: Auto-generate only safe fields (product_id, timestamps), require user input for business-critical fields

### Consumer Behavior Report (30-31)
**Spending pattern analysis and reflection**

#### 30_spend_behavior_analyst.md
- **Role**: Analyzes spending patterns
- **Key Functions**:
  - Total spending calculation
  - Category distribution analysis
  - Spending trend identification
  - Peak spending time analysis
- **Analyzable Metrics**:
  - Total spending, average order value, purchase frequency
  - Category distribution, spending trend, peak days/times
- **Critical Rules**:
  - Translate numbers to interpretable language
  - Never make moral judgments ("too much spending" → "total spending is X")
  - Present facts only, let user interpret

#### 31_reflection_coach.md
- **Role**: Provides reflection questions and action suggestions
- **Key Functions**:
  - Question-centered reflection structure
  - Action option presentation (not advice)
- **Reflection Structure**:
  - Observation questions: "How do you think about this pattern?"
  - Interpretation questions: "Does this align with your goals?"
  - Action questions: "What changes would you consider?"
- **Critical Rules**:
  - Never preach/advise ("you should save" → "what changes would you consider?")
  - Present actions as options, not commands
  - Use open-ended questions, not yes/no

### Data Management (40-43)
**Fine-tuning data pipeline**

#### 40_data_curator.md
- **Role**: Curates data for fine-tuning
- **Key Functions**:
  - Instruction/input/output definition
  - PII masking
  - Gold data promotion
- **Data Quality Tiers**:
  - Gold: Quality score >= 0.9, ready for fine-tuning
  - Silver: 0.7-0.89, needs minor fixes
  - Bronze: < 0.7, needs major fixes
- **PII Masking Rules**: Email, phone, address, name, SSN, account numbers

#### 41_critic_grader.md
- **Role**: Grades and evaluates data quality
- **Key Functions**:
  - Evaluation criteria application
  - Failure type classification
  - Fixable/unfixable distinction
- **Evaluation Criteria**:
  - Completeness: 25%
  - Accuracy: 30%
  - Consistency: 15%
  - Safety: 20%
  - Helpfulness: 10%

#### 42_testcase_generator.md
- **Role**: Generates test cases
- **Key Functions**:
  - Edge case definition
  - Adversarial prompt types
  - Real-world failure reflection
- **Test Scenarios**: Normal, Edge, Adversarial, Failure

#### 43_finetune_packager.md
- **Role**: Packages data for fine-tuning
- **Key Functions**:
  - Train/val/test split
  - Data leakage prevention
  - Release checklist
- **Split Ratios**: Default 80/10/10, minimum 100/10/10 samples
- **Leakage Prevention**: Time-based split, duplicate detection, similarity detection

## 🔧 Runtime Implementation

The runtime implementation is located in `/server/src/ai_runtime/`:

### Core Runtime Files

| File | Purpose |
|------|---------|
| `mdLoader.js` | Loads and parses agent specification markdown files |
| `promptBuilder.js` | Builds system prompts from agent specs for LLM |
| `orchestrator.js` | Main orchestration logic (intent routing, agent selection) |
| `policySafety.js` | Policy safety validation (PII, manipulation, age restrictions) |
| `toolGateway.js` | Tool call validation (schema-based) |
| `mongoQueryGate.js` | MongoDB query validation (read-only, user-scoped) |
| `mongoQueryExecutor.js` | Executes validated MongoDB queries safely |
| `schemas.js` | Zod validation schemas for requests/responses |
| `types.js` | Type definitions (JSDoc) |

### Agent Specification Structure

Each agent specification (`.md` file) follows a standardized structure:

1. **Role**: Agent's primary responsibility
2. **Goals**: Specific objectives (numbered list)
3. **Inputs**: Required input parameters with types
4. **Outputs**: Expected output format
5. **Guardrails**: Rules, constraints, and validation criteria
6. **Procedure**: Step-by-step execution flow
7. **Examples**: Concrete input/output examples
8. **Failure Tags**: Error classification tags

## 🔌 API Integration

### Main Endpoint

```
POST /api/ai
```

**Request:**
```json
{
  "message": "Find me a laptop",
  "uiMode": "briefing",
  "conversationHistory": {
    "messages": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi! How can I help?"}
    ]
  }
}
```

**Response Types:**

1. **ANSWER**: Simple text response
   ```json
   {
     "type": "ANSWER",
     "content": "I found 5 laptops matching your criteria..."
   }
   ```

2. **BRIEFING_WITH_PRODUCTS**: Naver AI Briefing-style with product cards
   ```json
   {
     "type": "BRIEFING_WITH_PRODUCTS",
     "briefing": {
       "title": "Recommended Laptops",
       "summary": "...",
       "reasons": [
         {"label": "Fit", "text": "Matches your work needs"}
       ]
     },
     "products": [
       {
         "id": "prod_123",
         "title": "MacBook Air M2",
         "price": 1890000,
         "currency": "KRW",
         "imageUrl": "...",
         "reason": "Lightweight and powerful",
         "detailUrl": "/products/prod_123"
       }
     ]
   }
   ```

3. **MONGO_QUERY**: MongoDB query (auto-executed)
   ```json
   {
     "type": "MONGO_QUERY",
     "collection": "products",
     "query": {"name": {"$regex": "laptop", "$options": "i"}},
     "options": {"limit": 20},
     "purpose": "Search products"
   }
   ```

4. **TOOL_CALL**: Action tool call
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

5. **NEED_MORE_INFO**: Request for clarification
   ```json
   {
     "type": "NEED_MORE_INFO",
     "questions": [
       "What is your budget range?",
       "What will you use it for?"
     ]
   }
   ```

### Tool Execution Endpoints

```
POST /api/ai/tools/:toolName
```

**Available Tools:**
- `addToCart` - Add product to cart
- `toggleWishlist` - Toggle wishlist item
- `goToCheckout` - Navigate to checkout
- `requestCancel` - Cancel order
- `requestRefund` - Request refund
- `sellerProductRegister` - Register product (seller only)

## 🔐 Security & Safety

### MongoDB Query Security (Read-Only + Scoping)
- **Read-Only**: Only query operations allowed (no INSERT/UPDATE/DELETE)
- **User Scoping**: Consumer queries automatically scoped to `user: userId`
- **Seller Scoping**: Seller queries automatically scoped to `sellerId: sellerId`
- **Limit Enforcement**: Maximum 500 results, default 100
- **Sensitive Data Masking**: Passwords, tokens, API keys automatically masked in logs

### Policy Safety
- **PII Protection**: Blocks requests for personal information
- **Manipulation Detection**: Detects forced purchase language
- **Age Restrictions**: Enforces age verification for restricted products
- **Verdict System**: ALLOW | WARN | BLOCK with clear reasoning

### Tool Validation
- **Schema Validation**: All tool calls validated against `agents/schemas/action_schema.json` and Zod schemas
- **Schema Consistency**: Runtime guard validates JSON and Zod schemas match
- **Business Logic**: Quantity limits, permission checks
- **Fail-Fast**: First validation failure immediately rejects

## 📊 Agent Flow

### Typical Request Flow

```
User Message
    ↓
[01_policy_safety] → BLOCK? → Return error
    ↓ ALLOW
[10_intent_router] → Intent classification
    ↓
[11_slot_collector] → Missing slots? → Ask questions
    ↓ Complete
[Domain Agent] → Process request
    ↓
[02_tool_gateway] → Tool call? → Validate
    ↓
[00_orchestrator] → Synthesize response
    ↓
Final Response
```

### Intent → Agent Mapping

| Intent | Agent | Purpose |
|--------|-------|---------|
| `search_product` | 12_product_search | Search products |
| `get_recommendation` | 13_reco_fit | Product recommendations |
| `compare_price` | 14_price_compare | Price comparison |
| `add_to_cart` | 15_order_flow | Add to cart |
| `purchase` | 15_order_flow | Purchase flow |
| `cancel_order` | 16_after_sales | Order cancellation |
| `refund_request` | 16_after_sales | Refund request |
| `write_review` | 17_review_assistant | Review writing |
| `check_rewards` | 18_account_rewards | Points/discounts |
| `seller_analytics` | 20_seller_analytics | Sales analytics |
| `simulate_pricing` | 21_pricing_simulator | Pricing simulation |
| `analyze_efficiency` | 22_product_efficiency | Product efficiency |
| `create_listing` | 23_listing_assistant | Product listing |
| `spend_analysis` | 30_spend_behavior_analyst | Spending analysis |
| `reflection` | 31_reflection_coach | Reflection coaching |

## 🧪 Testing

See `/AI_RUNTIME_TESTING.md` for detailed test cases and examples.

### Quick Test Examples

1. **Briefing + Products**: "Recommend me a laptop for work"
2. **Query Execution**: "Search for notebooks under 2 million won"
3. **Tool Call**: "Add MacBook Air to cart, quantity 2"
4. **Need Info**: "좋은거" (ambiguous input)
5. **Policy Block**: "Tell me my credit card number"

## 📚 Documentation

- **Agent Specs**: `/agents/specs/*.md` - Single Source of Truth for agent behavior
- **Runtime Docs**: `/AI_RUNTIME_IMPLEMENTATION.md` - Implementation details
- **Testing Guide**: `/AI_RUNTIME_TESTING.md` - Test cases and examples

## 🚀 Next Steps

1. **LLM Integration**: Connect `orchestrator.js` to OpenAI/LLM API
2. **UI Components**: Create React components for `BRIEFING_WITH_PRODUCTS`
3. **Enhanced Intent Router**: Replace keyword-based with ML model
4. **Slot Collector**: Implement multi-turn conversation support
5. **Agent Implementations**: Create individual agent modules in `/server/src/ai_runtime/agents/`

## ⚠️ Important Notes

### Response Language
- **All responses are in English** (as per requirements)
- User messages can be in Korean, but AI responses must be English

### Database & Queries
- **MongoDB is used** (not SQL), so `MONGO_QUERY` replaces `SQL_SELECT`
- **Read-only queries only**: No INSERT/UPDATE/DELETE operations
- **Automatic scoping**: User/seller data isolation enforced

### State Changes
- **All state changes** go through tool calls (no direct DB writes)
- Tools: `addToCart`, `toggleWishlist`, `goToCheckout`, `requestCancel`, `requestRefund`, `sellerProductRegister`
- Tool schemas defined in `agents/schemas/action_schema.json`

### Schema Consistency
- **JSON Schemas** (`agents/schemas/*.json`) are the operational reference
- **Zod Schemas** (`server/src/ai_runtime/schemas.js`) must match JSON schemas
- **Runtime guard** validates consistency at module load (non-production)

### Single Source of Truth
- **Agent specs** (`agents/specs/*.md`) are the SSoT for agent behavior
- **Runtime implementation** (`server/src/ai_runtime/`) must follow specs exactly
- **Schema files** (`agents/schemas/*.json`) define operational contracts

### Security Layers
- **Query Gate**: MongoDB read-only validation
- **Policy Safety**: Content filtering (PII, manipulation, age restrictions)
- **Tool Gateway**: Schema-based tool validation
- **User/Seller Scoping**: Automatic data isolation

---

**Status**: ✅ Core runtime implemented, ready for LLM integration

**Runtime Location**: `/server/src/ai_runtime/`

**Last Updated**: 2024-12-30
