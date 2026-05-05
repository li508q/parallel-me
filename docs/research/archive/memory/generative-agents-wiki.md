# Generative Agents [AI Agent Knowledge Base]

**Source**: https://agentwiki.org/generative_agents

---

====== Generative Agents ======

Generative Agents are computational software agents introduced by Park et al. (Stanford, 2023) that simulate believable human behavior by extending large language models with a three-tier cognitive architecture: a memory stream for recording experiences, a reflection mechanism for synthesizing higher-level insights, and a planning system for goal-directed behavior. The landmark paper demonstrated 25 agents living in a simulated town called Smallville, producing emergent social behaviors without explicit scripting.(([[https://arxiv.org/abs/2304.03442|Park et al. "Generative Agents: Interactive Simulacra of Human Behavior" (arXiv:2304.03442]]))(([[https://hai.stanford.edu/news/computational-agents-exhibit-believable-humanlike-behavior|Stanford HAI Coverage]]))(([[https://dl.acm.org/doi/10.1145/3586183.3606763|UIST 2023 Proceedings]]))

graph TD
A[Observation] --> B[Memory Stream]
B --> C[Retrieval]
C --> D{Scoring}
D --> D1[Recency]
D --> D2[Importance]
D --> D3[Relevance]
D1 & D2 & D3 --> E[Reflection]
E --> F[Planning]
F --> G[Action]
G --> A

===== Smallville Sandbox =====

Smallville is an interactive sandbox environment inspired by //The Sims//, featuring:

- 25 unique agents, each with a one-paragraph human-authored identity (background, personality, goals)
- A hierarchical spatial structure: houses, a cafe, stores, a park, organized as a location tree
- Object interactions: agents use tables, bookshelves, stoves, beds according to context
- Natural language communication between agents who encounter each other
- User intervention: researchers can inject events by assuming a [[persona_verification|persona]] and talking to agents

The simulation runs continuously, with agents making autonomous decisions about where to go, who to talk to, and what to do, driven entirely by their memory, reflections, and plans.

===== Three-Tier Architecture =====

The cognitive architecture comprises three interconnected components operating in a continuous loop:

=== Memory Stream ===

A chronological record of all observations, everything the agent perceives, says, hears, or does, stored as natural language entries with timestamps. Each entry captures a single atomic event:

- //"Klaus Mueller is reading a research paper on gentrification at the library" (Feb 13, 10:15am)//
- //"Maria Lopez said: 'Are you coming to the Valentine's Day party?'" (Feb 12, 3:30pm)//

=== Reflection ===

Periodically (triggered when accumulated importance scores exceed a threshold), the agent synthesizes memories into higher-level abstract insights:

- //"I am passionate about urban studies and gentrification research"//
- //"Maria seems to be organizing a Valentine's Day party and is excited about it"//

Reflections are themselves stored back in the memory stream, enabling recursive abstraction, reflections on reflections.

=== Planning ===

Generates behavior in a hierarchical decomposition:

- Daily plan: High-level agenda created each morning from reflections and goals
- Hourly blocks: Decomposed into specific activities with time estimates
- Moment-to-moment actions: Fine-grained behaviors responding to immediate context

Re-planning triggers when new observations create opportunities or conflicts (e.g., encountering a friend, discovering a relevant event).

===== Memory Retrieval =====

When an agent needs to act, it retrieves relevant memories using a weighted scoring function combining three factors:

$$
\text{score}(m) = \alpha \cdot \text{recency}(m) + \beta \cdot \text{importance}(m) + \[[gamma|gamma]] \cdot \text{relevance}(m, q)
$$

where:

- Recency, Exponential decay based on time since the memory was last accessed: $\text{recency}(m) = e^{-\lambda \cdot \Delta t}$
- Importance, An integer score (1-10) assigned by the LLM when the memory is created, reflecting inherent significance (e.g., a breakup scores higher than eating breakfast)
- Relevance, Cosine similarity between the memory embedding and the current query/context

Top-$k$ scored memories are retrieved and included in the LLM prompt for action generation.

`
import numpy as np
from dataclasses import dataclass
from typing import List

@dataclass
class Memory:
description: str
timestamp: float
importance: int # 1-10, LLM-assigned
embedding: np.ndarray # Semantic embedding vector
last_accessed: float = 0.0

class GenerativeAgent:
def init(self, name, identity, llm, embedding_model):
self.name = name
self.identity = identity
self.llm = llm
self.embed = embedding_model
self.memory_stream: List[Memory] = []
self.plan: List[str] = []
self.importance_sum = 0.0
self.reflection_threshold = 150

```
def observe(self, observation, current_time):
    # Add a new observation to the memory stream
    importance = self._score_importance(observation)
    memory = Memory(
        description=observation,
        timestamp=current_time,
        importance=importance,
        embedding=self.embed(observation),
        last_accessed=current_time
    )
    self.memory_stream.append(memory)
    self.importance_sum += importance

    if self.importance_sum >= self.reflection_threshold:
        self._reflect(current_time)
        self.importance_sum = 0

def retrieve(self, query, current_time, k=10):
    # Retrieve top-k relevant memories using tripartite scoring
    scores = []
    query_emb = self.embed(query)
    for mem in self.memory_stream:
        recency = np.exp(-0.995 * (current_time - mem.last_accessed))
        relevance = np.dot(mem.embedding, query_emb)
        score = recency + mem.importance / 10.0 + relevance
        scores.append
    scores.sort(key=lambda x: -x[0])
    top_memories = [m for _, m in scores[:k]]
    for m in top_memories:
        m.last_accessed = current_time
    return top_memories

def act(self, context, current_time):
    # Decide what to do based on retrieved memories and plan
    memories = self.retrieve(context, current_time)
    mem_text = "\n".join(m.description for m in memories)
    prompt = (
        f"Name: {self.name}\nIdentity: {self.identity}\n"
        f"Current plan: {self.plan}\n"
        f"Relevant memories:\n{mem_text}\n"
        f"Current context: {context}\n"
        f"What does {self.name} do next?"
    )
    return self.llm.generate(prompt)

def _reflect(self, current_time):
    # Synthesize recent memories into higher-level insights
    recent = self.memory_stream[-100:]
    mem_text = "\n".join(m.description for m in recent)
    prompt = (
        f"Given these recent observations:\n{mem_text}\n"
        f"What 3 high-level insights can you infer?"
    )
    insights = self.llm.generate(prompt)
    for insight in insights.split("\n"):
        if insight.strip():
            self.observe(f"[Reflection] {insight.strip()}", current_time)

def _score_importance(self, observation):
    prompt = (
        f"Rate the importance of this event (1-10):\n"
        f"{observation}\nScore:"
    )
    return int(self.llm.generate(prompt).strip())

```

`

===== Emergent Social Behaviors =====

Over two simulated days with minimal human intervention, the 25 agents produced remarkable emergent phenomena:

- Information diffusion, One agent (Isabella) decided to host a Valentine's Day party. Over two days, word spread organically through conversations as agents told others about it
- Relationship formation, Agents developed new acquaintances and romantic interests based on repeated interactions and shared interests
- Spontaneous coordination, Multiple agents independently arrived at the party at the correct time and location without centralized scheduling
- Social planning, Agents formed groups, made dates, and coordinated logistics through natural conversation

None of these behaviors were scripted, they emerged purely from the interaction of individual agent architectures with each other and the environment.

===== Evaluation =====

The evaluation combined technical ablations with human assessments:

- Component ablations: Removing reflection reduced insightfulness; disabling planning caused aimlessness; limiting memory retrieval led to repetitive behavior
- Believability interviews: Agents answered questions like "What are you doing tomorrow?" and emergency scenarios like "Your breakfast is burning!", crowdworkers rated agent responses as more believable than humans role-playing the same characters
- End-to-end simulation: 25 agents interacting freely over two simulated days, judged holistically for coherent social behavior

===== See Also =====

- [[rise_potential_llm_agents_survey|The Rise and Potential of Large Language Model Based Agents: A Survey]]
- [[cognitive_architectures_language_agents|Cognitive Architectures for Language Agents (CoALA)]]
- [[ai_agents|AI Agents]]
- [[agent_memory_architecture|Agent Memory Architecture]]
- [[fireact_agent_finetuning|FireAct: Toward Language Agent Fine-tuning]]

===== References =====
