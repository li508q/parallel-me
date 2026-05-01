# MemGPT: LLMs as Operating Systems

**Source**: https://www.emergentmind.com/articles/2310.08560

---

MemGPT: LLMs as Operating Systems

0 }" @focus="focused = true" @click="focused = true; clicked = true; handleQueryChange()" @click.away="clicked = false" @keydown="focused = true" @keydown.escape="setQuery(''); focused = false; clicked = false" @input.debounce.100ms="handleQueryChange();" @input="if ($event.target.value === '') { setQuery('') }" @keyup="if ($event.target.value === '') { setQuery('') }" @keydown.enter.prevent="if (!$event.shiftKey) { $refs.search_form.submit() } else { handleShiftEnter($event) }" maxlength="2000">2310.08560

 

0">Papers

 

0">Topics

 

0">Authors

 

0">

Recent

View all

Search

2000 character limit reached

 

 

 

 

 

# MemGPT: Towards LLMs as Operating Systems

Published 12 Oct 2023 in cs.AI | (2310.08560v2)

Abstract: LLMs have revolutionized AI, but are constrained by limited context windows, hindering their utility in tasks like extended conversations and document analysis. To enable using context beyond limited context windows, we propose virtual context management, a technique drawing inspiration from hierarchical memory systems in traditional operating systems that provide the appearance of large memory resources through data movement between fast and slow memory. Using this technique, we introduce MemGPT (Memory-GPT), a system that intelligently manages different memory tiers in order to effectively provide extended context within the LLM's limited context window, and utilizes interrupts to manage control flow between itself and the user. We evaluate our OS-inspired design in two domains where the limited context windows of modern LLMs severely handicaps their performance: document analysis, where MemGPT is able to analyze large documents that far exceed the underlying LLM's context window, and multi-session chat, where MemGPT can create conversational agents that remember, reflect, and evolve dynamically through long-term interactions with their users. We release MemGPT code and data for our experiments at https://memgpt.ai.

 

 Abstract PDF Upgrade to Chat

Citations (83) 

View on Semantic Scholar

 

 

 

 

 

### Summary

- The paper introduces virtual context management for LLMs, enhancing long interactions by extending the fixed context window.
- It applies operating system memory strategies to dynamically manage main and external contexts in document analysis and extended dialogues.
- The approach improves consistency and performance by prioritizing relevant data, mimicking efficient memory allocation in traditional OSs.

### Understanding Memory-GPT

The emergence of LLMs has marked a significant shift in the AI landscape. These models have been particularly instrumental in advancing natural language processing capabilities. However, one notable limitation of current LLMs is their fixed-length context windows, which restrict their ability to process long sequences of text or maintain a continuous thread in conversations. Addressing this limitation, a technique known as virtual context management has been proposed.

### Virtual Context Management in LLMs

Virtual context management draws inspiration from hierarchical memory systems used in traditional operating systems. These systems effectively manage fast and slow memory tiers, allowing for a smooth computing experience despite the finite capacity of faster memories like RAM. A system called MemGPT applies this concept to LLMs, providing a way for them to handle extended contexts by intelligently managing different memory tiers. This technique offers promising improvements to LLMs, particularly in areas such as document analysis and multi-session chat—domains where LLMs have traditionally struggled due to limited context windows.

### MemGPT: Expanding LLM Horizons

MemGPT operates by utilizing a hierarchy of memory allocations, similar to memory management in operating systems. The system consists of both a main context, akin to RAM, and an external context, which could be likened to hard disk storage. The main context is the fixed window available to the LLM processor, whereas external context contains out-of-window information. Clever function calls within MemGPT allow the LLM to manage and navigate its own memory, bringing relevant data into the main context as needed and pushing less relevant data to external storage.

One key advantage MemGPT brings to the table is the ability to maintain coherence and context over long interactions, as in extended conversations, without losing track of earlier portions that have rotated out of the immediate context window. Another is its capacity to analyze large documents by only bringing relevant sections into context, mimicking the ability of an operating system to manage a program's use of memory without overwhelming the processor.

### Evolving LLMs with OS-Inspired Techniques

The significance of such a system cannot be overstated for tasks that demand an attention to extensive details. Document analysis, for instance, often involves referring to vast amounts of text, and conversational agents must recall details from earlier in the conversation to maintain coherence and user engagement. In both scenarios, existing LLM approaches were significantly hampered by finite context.

MemGPT's virtual context management, with its design rooted in operating system principles, offers a compelling advancement for LLMs. It not only grants them the semblance of a longer memory but also enables efficient utilization of that extended memory during tasks—allowing them to perform better on consistency and engagement metrics in dialogues and more adeptly handle the complexities of large documents. The innovative approach of MemGPT reaffirms that incorporating time-tested computing principles into modern AI systems can lead to substantial enhancements in their functionality.

Markdown Report Issue

 

 

 

 

 

### Paper to Video (Beta)

No one has generated a video about this paper yet.

Sign Up to Generate All Videos Subscribe on YouTube

 

 

 

 

 

### Whiteboard

No one has generated a whiteboard explanation for this paper yet.

Sign Up to Generate

 

 

 

 

 

### Paper Prompts

Sign up for free to create and run prompts on this paper using GPT-5.

#### Top Community Prompts

Explain it Like I'm 14 

off on

Knowledge Gaps 

off on

Practical Applications 

off on

Glossary 

off on

Conceptual Simplification 

off on

Sign Up to Activate View All Prompts

 

 

 

 

 

### Open Problems

We haven't generated a list of open problems mentioned in this paper yet.

Generate Now

 

 

 

 

 

### Continue Learning

1. How does MemGPT's virtual context management compare to alternative approaches like retrieval-augmented generation for managing long contexts in LLMs?
2. What are the potential limitations or risks associated with allowing an LLM to autonomously manage its own memory hierarchy?
3. In what ways can MemGPT's approach be generalized to modalities beyond text, such as image or multimodal processing?
4. How does the performance overhead of MemGPT's memory management affect real-world deployment efficiency and latency?
5. Find recent papers about virtual context management in large language models.

 

 

 

 

 

### Related Papers

1. LLM as OS, Agents as Apps: Envisioning AIOS, Agents and the AIOS-Agent Ecosystem(2023)
2. A Human-Inspired Reading Agent with Gist Memory of Very Long Contexts(2024)
3. AI-native Memory: A Pathway from LLMs Towards AGI(2024)
4. MemLong: Memory-Augmented Retrieval for Long Text Modeling(2024)
5. The Compressor-Retriever Architecture for Language Model OS(2024)
6. Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory(2025)
7. Memory OS of AI Agent(2025)
8. MemOS: A Memory OS for AI System(2025)
9. MemTool: Optimizing Short-Term Memory Management for Dynamic Tool Calling in LLM Agent Multi-Turn Conversations(2025)
10. The Pensieve Paradigm: Stateful Language Models Mastering Their Own Context(2026)

 

 

 

 

 

### Authors (7)

1. Charles Packer
2. Sarah Wooders
3. Kevin Lin
4. Vivian Fang
5. Shishir G. Patil
6. Ion Stoica
7. Joseph E. Gonzalez

 

 

 

 

 

### Collections

Sign up for free to add this paper to one or more collections.

Sign Up

 

 

 

 

 

 

### Tweets

Sign up for free to view the 36 tweets with 59 likes about this paper.

Sign Up for Free

 

 

 

 

 

 

### YouTube

2">

Show All Videos 

 

 

 

 

 

 

Stay informed about trending AI papers:


