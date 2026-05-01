# Custom Instructions - Mem0

**Source**: https://docs.mem0.ai/open-source/features/custom-fact-extraction-prompt

---

> ## Documentation Index
> 
> Fetch the complete documentation index at: https://docs.mem0.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Instructions

> Tailor fact extraction so Mem0 stores only the details you care about.

Custom instructions let you decide exactly which facts Mem0 records from a conversation. Define a focused prompt, give a few examples, and Mem0 will add only the memories that match your use case.

You'll use this when...

- A project needs domain-specific facts (order numbers, customer info) without storing casual chatter.
- You already have a clear schema for memories and want the LLM to follow it.
- You must prevent irrelevant details from entering long-term storage.

Prompts that are too broad cause unrelated facts to slip through. Keep instructions tight and test them with real transcripts.

The `custom_fact_extraction_prompt` parameter has been renamed to `custom_instructions`. If you are upgrading from an older version, update your configuration accordingly.

---

## Feature anatomy

- Prompt instructions: Describe which entities or phrases to keep. Specific guidance keeps the extractor focused.
- Few-shot examples: Show positive and negative cases so the model copies the right format.
- Structured output: Responses return JSON with a `facts` array that Mem0 converts into individual memories.
- LLM configuration: `custom_instructions` (Python) or `customInstructions` (TypeScript) lives alongside your model settings.

## Prompt blueprint

1. State the allowed fact types.
2. Include short examples that mirror production messages.
3. Show both empty (`[]`) and populated outputs.
4. Remind the model to return JSON with a `facts` key only.

---

## Configure it

### Write the custom prompt

```python
custom_instructions = """
Please only extract entities containing customer support information, order details, and user information.
Here are some few shot examples:

Input: Hi.
Output: {"facts" : []}

Input: The weather is nice today.
Output: {"facts" : []}

Input: My order #12345 hasn't arrived yet.
Output: {"facts" : ["Order #12345 not received"]}

Input: I'm John Doe, and I'd like to return the shoes I bought last week.
Output: {"facts" : ["Customer name: John Doe", "Wants to return shoes", "Purchase made last week"]}

Input: I ordered a red shirt, size medium, but received a blue one instead.
Output: {"facts" : ["Ordered red shirt, size medium", "Received blue shirt instead"]}

Return the facts and customer information in a json format as shown above.
"""

```

```ts
const customInstructions = `
Please only extract entities containing customer support information, order details, and user information.
Here are some few shot examples:

Input: Hi.
Output: {"facts" : []}

Input: The weather is nice today.
Output: {"facts" : []}

Input: My order #12345 hasn't arrived yet.
Output: {"facts" : ["Order #12345 not received"]}

Input: I am John Doe, and I would like to return the shoes I bought last week.
Output: {"facts" : ["Customer name: John Doe", "Wants to return shoes", "Purchase made last week"]}

Input: I ordered a red shirt, size medium, but received a blue one instead.
Output: {"facts" : ["Ordered red shirt, size medium", "Received blue shirt instead"]}

Return the facts and customer information in a json format as shown above.
`;

```

Keep example pairs short and mirror the capitalization, punctuation, and tone you see in real user messages.

### Load the prompt in configuration

```python
from mem0 import Memory

config = {
    "llm": {
        "provider": "openai",
        "config": {
            "model": "gpt-5-mini",
            "temperature": 0.2,
            "max_tokens": 2000,
        }
    },
    "custom_instructions": custom_instructions,
}

m = Memory.from_config(config)

```

```ts
import { Memory } from "mem0ai/oss";

const config = {
  llm: {
    provider: "openai",
    config: {
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: "gpt-4-turbo-preview",
      temperature: 0.2,
      maxTokens: 1500,
    },
  },
  customInstructions: customInstructions,
};

const memory = new Memory(config);

```

After initialization, run a quick `add` call with a known example and confirm the response splits into separate facts.

---

## See it in action

### Example: Order support memory

```python
m.add("Yesterday, I ordered a laptop, the order id is 12345", user_id="alice")

```

```ts
await memory.add("Yesterday, I ordered a laptop, the order id is 12345", { userId: "user123" });

```

```json
{
  "results": [
    {"memory": "Ordered a laptop", "event": "ADD"},
    {"memory": "Order ID: 12345", "event": "ADD"},
    {"memory": "Order placed yesterday", "event": "ADD"}
  ],
  "relations": []
}

```

The output contains only the facts described in your prompt, each stored as a separate memory entry.

### Example: Irrelevant message filtered out

```python
m.add("I like going to hikes", user_id="alice")

```

```ts
await memory.add("I like going to hikes", { userId: "user123" });

```

```json
{
  "results": [],
  "relations": []
}

```

Empty `results` show the prompt successfully ignored content outside your target domain.

---

## Verify the feature is working

- Log every call during rollout and confirm the `facts` array matches your schema.
- Check that unrelated messages return an empty `results` array.
- Run regression samples whenever you edit the prompt to ensure previously accepted facts still pass.

---

## Best practices

1. Be precise: Call out the exact categories or fields you want to capture.
2. Show negative cases: Include examples that should produce `[]` so the model learns to skip them.
3. Keep JSON strict: Avoid extra keys; only return `facts` to simplify downstream parsing.
4. Version prompts: Track prompt changes with a version number so you can roll back quickly.
5. Review outputs regularly: Spot-check stored memories to catch drift early.

---

## Review Add Operations

Refresh how Mem0 stores memories and how prompts influence fact creation.

## Automate Support Triage

Apply custom extraction to route customer requests in a full workflow.
