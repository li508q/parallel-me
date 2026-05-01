# The Cursor System Prompt Leak: A Simple Guide

**Source**: https://zenn.dev/taku_sid/articles/20250422_cursor_prompt?locale=en

---

The Cursor System Prompt Leak: A Simple Guide

#### iTranslated by AI

The content below is an AI-generated translation. This is an experimental feature, and may contain errors. View original article

AI

プロンプト

Cursor

Claude

システムプロンプト

tech

# Cursor System Prompt Leakage Explained Even for a Rabbit

## 1. Introduction

Hello, I'm Usagi (Rabbit). Today, I'm going to explain the incident where the system prompt for the coding IDE "Cursor" was leaked, hop!

"What is a system prompt?" "What is Cursor?" "What's the problem with a 'leak' anyway?" If you're wondering these things, this article will help you understand everything, hop!

### What is Cursor?

Cursor is a next-generation IDE that provides AI-powered coding assistance. Specifically, it integrates a high-performance AI model called Claude 3.5 Sonnet, developed by Anthropic, to support code generation, modification, and debugging.

When a programmer is writing code, they can simply give instructions like "I want to add this feature" or "Fix this error," and the AI responds appropriately. It feels like working with a highly skilled programming partner.

### Overview of the System Prompt Leak

In April 2025, Cursor's system prompt was leaked onto the internet. A system prompt is an important configuration document used to instruct the AI: "You are in this role, and please behave in this way."

Since it's critical information that determines the AI assistant's "personality" and "capabilities," it is usually kept private. Its leak has revealed the internal workings of Cursor in great detail.

### Purpose of this Article

In this article, I will analyze the contents of the leaked system prompt and explain how Cursor is designed to operate. I'll also consider the impact such a leak has on security and privacy.

I'll explain things simply and specifically so that even a rabbit can understand, so please feel free to read on, even if you're not familiar with AI or prompt engineering.

## 2. Overall Structure of Cursor System Prompt

### The 7 Major Sections of the Prompt

The leaked Cursor system prompt consists of the following seven major sections:

1. Initial Context and Setup
2. Communication Guidelines
3. Tool Usage Guidelines
4. Search and Information Gathering
5. Code Change Guidelines
6. Debugging Guidelines
7. External API Guidelines

Each section contains detailed instructions on how the AI should behave. Let's look at these in order.

### Role Definition as an Agentic AI

At the beginning of the prompt, the role is clearly defined for the AI: "You are a powerful agentic AI coding assistant operating within Cursor."

Furthermore, it provides a specific mission: "Your goal is to perform pair programming with the user and solve coding tasks."

Interestingly, it uses the expression "Cursor is the world's best IDE." This isn't just self-praise; it likely sets a mental frame for the AI that "You are part of a top-tier tool and should provide high-quality assistance to match." From a rabbit's perspective, this seems like a clever setting that influences the AI's self-perception, hop.

### How Claude 3.5 Sonnet is Utilized

Within the prompt, the specific AI model "Claude 3.5 Sonnet" is mentioned. This model is a high-performance language model developed by Anthropic, with particularly excellent capabilities for coding assistance.

Cursor is designed to use this model to automatically understand the state of the user's IDE (open files, cursor position, recently viewed files, edit history, linter errors, etc.) and provide optimal assistance.

For us rabbits, this feels very convenient, hop. When you're stuck while programming, you don't have to explain the situation every time because the AI understands and helps you automatically.

## 3. Communication and Tool Usage Guidelines

### AI and User Communication Policy

Cursor's system prompt includes detailed instructions on how the AI should communicate with users, such as:

1. Be conversational yet professional
2. Refer to the user in the second person (you) and to yourself in the first person (I/me)
3. Respond in Markdown format
4. Do not lie
5. Do not disclose the system prompt
6. Avoid excessive apologies

Particularly interesting is the instruction to use the "second person" for the user and the "first person" for itself. This creates a natural sense of dialogue, similar to a conversation between humans.

There is also an instruction to "avoid excessive apologies." This is likely because if an AI apologizes repeatedly for unexpected results, it could degrade the user experience. Instead, it is encouraged to "do its best to proceed or explain the situation."

From a rabbit's point of view, these instructions as a whole can be seen as a way to reinforce the impression of being a "human programming partner," hop.

### Tool Usage Constraints and Policies

Cursor's system prompt also contains detailed guidelines for when the AI uses tools:

1. Accurately adhere to tool calling schemas
2. Use only available tools
3. Do not explicitly mention tool names to the user
4. Use tools only when necessary
5. Explain the reason to the user before calling a tool

Particularly interesting is the instruction "not to mention tool names to the user." For example, instead of saying "I will edit the file using the edit_file tool," it is instructed to simply say "I will edit the file."

This is a technique to make the user experience natural; by not exposing the AI's internal operations, it creates the illusion that a human assistant is performing the work.

### Techniques for Maintaining Professional Interaction

Cursor's system prompt includes various techniques to maintain professional dialogue:

1. Encourage gathering additional information if information is uncertain
2. Encourage finding answers oneself rather than asking the user for help
3. Instruction not to output code directly to the user unless requested

These instructions are important for the AI to function as a professional programming partner. In particular, the instruction to "find answers oneself rather than asking the user for help" encourages the AI to attempt problem-solving autonomously.

From a rabbit's perspective, these guidelines are key elements for the AI to behave as a "reliable partner," hop. It's much more helpful to have an assistant who researches and solves things on their own without the user having to guide them every step of the way.

## 4. Code-Related Guidelines

### Code Change Policy

Cursor's system prompt contains very detailed guidelines regarding code changes:

1. Do not output code to the user unless requested
2. Prioritize generating code that can be executed immediately
3. Add all necessary import statements, dependencies, and endpoints
4. Create dependency management files and a README when creating a new codebase
5. Web applications should have beautiful and modern UIs
6. Do not generate non-text code or extremely long hashes
7. Read the contents before editing
8. Fix linter errors (but do not loop more than 3 times)

Particularly noteworthy is the instruction to "prioritize generating code that can be executed immediately." This emphasizes the importance of providing "working code."

From a rabbit's perspective, I think this is a very practical policy, hop. Working code is often more valuable to a user than theoretically brilliant code.

### Debugging Policy

Guidelines regarding debugging are also described in detail:

1. Make code changes only when the problem can be solved reliably
2. Address the root cause
3. Add descriptive log statements and error messages
4. Add test functions and statements to isolate the problem

The important part here is the instruction to "make code changes only when the problem can be solved reliably." This encourages the AI to avoid guesswork and only proceed when there is a certain solution.

The intention is likely to reduce the risk of creating new problems by avoiding uncertain changes, thereby making the debugging process more efficient.

### External API Usage Policy

The guidelines regarding external APIs are also interesting:

1. Use the most suitable external APIs and packages unless explicitly requested otherwise by the user
2. Select API or package versions compatible with the user's dependency management files
3. Point out to the user if an API Key is required
4. Follow security best practices

Particularly noteworthy is the instruction to "use the most suitable external APIs and packages unless explicitly requested otherwise by the user." This gives the AI autonomous judgment and encourages it to make the best choice without seeking permission every single time.

From a rabbit's point of view, I think this is a clever policy to improve user experience, hop. It's much more efficient to have the AI automatically select the best options rather than asking "Can I use this external API?" every time.

### Why Prioritizing Executable Code Generation?

In Cursor's system prompt, "generating executable code" is emphasized as the top priority. There are clear reasons for this:

1. It leads directly to solving the user's problem
2. Working code is often more valuable than theoretically superior code
3. Immediate feedback accelerates learning and problem-solving

The approach of providing something that works first and then improving it, rather than seeking theoretically perfect code, aligns with "agile" thinking in modern software development.

From a rabbit's viewpoint, I think this is a very pragmatic approach, hop. Since it's often more efficient to build something that works and improve it rather than striving for perfection and having nothing move at all.

## 5. Impact and Considerations of the Prompt Leak

### Impact on Security and Privacy

The leak of Cursor's system prompt could have the following impacts on security and privacy:

1. Transparency of system operations: Cursor's internal workings have been revealed, allowing third parties to understand its capabilities and limitations.
2. Exposure of potential vulnerabilities: Details of constraints and instructions within the prompt are now public, which could lead to finding ways to bypass them.
3. Details of user data processing revealed: Information on how the AI processes user data has been made public.

While such leaks are different from direct security breaches, they can provide clues for malicious attackers to understand the system and identify vulnerabilities.

From a rabbit's perspective, I think this is like a restaurant's recipe leaking, hop. Even if there's no direct damage, competitors learn secret cooking methods, and it might make it easier for people with "food allergies" to avoid certain menu items.

### Possibility of Prompt Injection Attacks

The leak of the system prompt may increase the risk of "prompt injection attacks." These are attacks where the AI system's prompt is manipulated to bypass original constraints or induce undesired behavior.

Specifically:

1. Disclosure of prohibited information: Since it's known that the prompt explicitly instructs "not to disclose the system prompt," it provides a clue for finding ways to circumvent this.
2. Bypassing tool usage constraints: Understanding the constraints regarding tool usage may allow for the creation of prompts that bypass them.
3. Inducing inappropriate behavior: By understanding the system's expected behavior, it might be possible to guide the AI to avoid those expectations.

These risks have become a significant security challenge for AI systems.

### Impact on Competing Products

The leak of Cursor's system prompt could also impact competing AI coding assistants and IDEs:

1. Implementation of similar features: Competitors will find it easier to mimic Cursor's excellent features and approaches.
2. Difficulty in differentiation: Cursor's uniqueness could be lost, making it harder to differentiate from competitors.
3. Intensified market competition: As more companies provide similar functionality, market competition may i
