import React, { useState } from "react";

const scenarios = ["Expansion", "Cross-sell", "Upsell", "Price Increase", "Multi-year"];
const personas = ["Admin", "IT Manager", "IT Director", "CISO", "CIO", "CEO"];
const difficulties = ["Easy", "Medium", "Hard", "Extra Hard", "Nuclear"];

const defaultObjections = [
  "We’re not expanding. We don’t accept price increases. We want to stay annual.",
  "This is too expensive.",
  "We don’t have budget this year.",
  "We are consolidating tools.",
  "We don’t need more licenses.",
  "Adoption is too low to justify expansion.",
  "We don’t want a multi-year commitment.",
  "Security has not approved this.",
  "This is not a priority right now.",
  "Leadership will push back.",
  "The team is not using what we already bought.",
  "We are considering alternatives."
];

function analyseQuestion(question, persona, difficulty) {
  const q = question.toLowerCase();

  const asksUsage =
    q.includes("usage") ||
    q.includes("adoption") ||
    q.includes("underutilization") ||
    q.includes("using");

  const asksImpact =
    q.includes("impact") ||
    q.includes("cost") ||
    q.includes("risk") ||
    q.includes("revenue") ||
    q.includes("time");

  const asksSpecific =
    q.includes("which") ||
    q.includes("where") ||
    q.includes("how many") ||
    q.includes("how much") ||
    q.includes("what happens");

  const tooShort = question.trim().split(" ").length < 7;

  let score = 4;

  if (tooShort) score = 2;
  else if (asksUsage && asksImpact && asksSpecific) score = 9;
  else if ((asksUsage && asksImpact) || (asksSpecific && asksImpact)) score = 7;
  else if (asksUsage || asksImpact || asksSpecific) score = 6;

  if (difficulty === "Nuclear" && score < 8) score -= 1;
  if (score < 1) score = 1;

  let customer = "";

  if (score <= 3) {
    customer =
      "I don’t think that changes anything. We already said we are not expanding, we do not accept the increase, and we want to stay annual.";
  } else if (score <= 6) {
    customer =
      "There may be some usage issues, but that is exactly why I do not want to spend more right now.";
  } else {
    if (persona === "CISO") {
      customer =
        "There are some visibility gaps and unmanaged pockets of usage. That does create risk, but I need to understand whether expansion reduces that risk or just adds cost.";
    } else if (persona === "CIO") {
      customer =
        "Some teams are getting value, others are still using manual workarounds. The real question is whether standardising this would reduce cost and operational complexity.";
    } else if (persona === "CEO") {
      customer =
        "If this links to growth, margin, risk reduction, or speed, I will listen. But I need a business case, not a product conversation.";
    } else if (persona === "IT Director") {
      customer =
        "A few departments are underusing the platform. That creates duplicate tools, support tickets, and probably wasted budget.";
    } else {
      customer =
        "Some users are not adopting it properly, and that creates extra admin and support work.";
    }
  }

  let critique = "";
  let better = "";
  let guidance = "";
  let listenFor = "";
  let nextMove = "";

  if (score <= 3) {
    critique =
      "Your question is too broad or too weak. A resistant customer can easily reject it without revealing anything useful.";
    better =
      "Which teams are underusing the platform today, and what is that creating in extra cost, manual work, risk, or missed outcomes?";
    guidance =
      "Do not challenge the objection directly yet. First, diagnose what is behind it. You need to uncover the cost of staying the same.";
    listenFor =
      "Listen for vague words like adoption, budget, risk, leadership, tools, manual work, delays, or frustration.";
    nextMove =
      "Ask a specific pain discovery question about usage or business impact.";
  } else if (score <= 6) {
    critique =
      "You are moving in the right direction, but the question needs to be sharper. You touched the issue, but did not force a measurable answer.";
    better =
      "Where is adoption lowest today, and what does that mean in terms of wasted spend, support effort, risk, or delayed projects?";
    guidance =
      "You are close. Now make the customer quantify the problem. Without impact, they will keep saying no to expansion, price increase, or multi-year.";
    listenFor =
      "Listen for departments, user groups, workflows, duplicate tools, project delays, security gaps, or executive pressure.";
    nextMove =
      "Ask for a concrete example, then quantify the impact.";
  } else {
    critique =
      "Strong question. You asked in a way that could uncover real pain instead of debating the objection.";
    better =
      "What would happen over the next 6–12 months if those adoption gaps, duplicate tools, or risks stayed unresolved?";
    guidance =
      "Now go deeper. Do not pitch yet. Turn the pain into business impact before suggesting expansion or a commercial change.";
    listenFor =
      "Listen for measurable impact: cost, hours lost, risk exposure, delayed initiatives, missed productivity, or leadership pressure.";
    nextMove =
      "Ask a consequence question: what happens if nothing changes?";
  }

  return { score, customer, critique, better, guidance, listenFor, nextMove };
}

export default function App() {
  const [scenario, setScenario] = useState("Expansion");
  const [persona, setPersona] = useState("IT Director");
  const [difficulty, setDifficulty] = useState("Hard");
  const [objections, setObjections] = useState(defaultObjections);
  const [objection, setObjection] = useState(defaultObjections[0]);
  const [newObjection, setNewObjection] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const start = () => {
    setMessages([
      {
        role: "Customer",
        text: `Scenario: ${scenario}\nPersona: ${persona}\nDifficulty: ${difficulty}\n\n"${objection}"`
      },
      {
        role: "Coach",
        text:
          "Your goal: uncover underutilization, economic impact, risk, and missed opportunity.\n\nDo not pitch yet. Start with discovery."
      }
    ]);
  };

  const send = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    const updatedMessages = [
      ...messages,
      { role: "You", text: userMessage }
    ];

    setMessages(updatedMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scenario,
          persona,
          difficulty,
          objection,
          messages: updatedMessages,
          userMessage
        })
      });

      const text = await response.text();

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "The AI server did not return valid JSON. This usually means /api/chat is not working yet."
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "The AI request failed.");
      }

      setMessages([
        ...updatedMessages,
        {
          role: "AI Coach",
          text: data.reply || "No reply received from AI."
        }
      ]);
    } catch (error) {
      const fallback = analyseQuestion(userMessage, persona, difficulty);

      setMessages([
        ...updatedMessages,
        {
          role: "Customer",
          text: fallback.customer
        },
        {
          role: "Coach",
          text:
            `AI connection failed, so I used local coaching instead.\n\n` +
            `Error: ${error.message}\n\n` +
            `Score: ${fallback.score}/10\n\n` +
            `Critique:\n${fallback.critique}\n\n` +
            `Stronger version:\n${fallback.better}\n\n` +
            `Guidance:\n${fallback.guidance}\n\n` +
            `Listen for:\n${fallback.listenFor}\n\n` +
            `Best next move:\n${fallback.nextMove}`
        }
      ]);
    }
  };

  const addObjection = () => {
    if (!newObjection.trim()) return;
    setObjections([newObjection, ...objections]);
    setObjection(newObjection);
    setNewObjection("");
  };

  const buttonStyle = (active) => ({
    margin: "4px",
    padding: "10px 14px",
    borderRadius: "8px",
    border: active ? "2px solid black" : "1px solid #ccc",
    background: active ? "#111" : "white",
    color: active ? "white" : "black",
    cursor: "pointer"
  });

  return (
    <div style={{ padding: 24, fontFamily: "Arial", maxWidth: 1050, margin: "auto" }}>
      <h1>Objection Training App</h1>

      <div style={{ background: "#f3f3f3", padding: 16, borderRadius: 10, marginBottom: 20 }}>
        <strong>Current setup:</strong>
        <br />
        Scenario: <strong>{scenario}</strong> | Persona: <strong>{persona}</strong> | Difficulty:{" "}
        <strong>{difficulty}</strong>
      </div>

      <h2>1. Choose Scenario</h2>
      {scenarios.map((s) => (
        <button key={s} style={buttonStyle(scenario === s)} onClick={() => setScenario(s)}>
          {s}
        </button>
      ))}

      <h2>2. Choose Persona</h2>
      {personas.map((p) => (
        <button key={p} style={buttonStyle(persona === p)} onClick={() => setPersona(p)}>
          {p}
        </button>
      ))}

      <h2>3. Choose Difficulty</h2>
      {difficulties.map((d) => (
        <button key={d} style={buttonStyle(difficulty === d)} onClick={() => setDifficulty(d)}>
          {d}
        </button>
      ))}

      <h2>4. Choose or Add Objection</h2>
      {objections.map((o) => (
        <div key={o} style={{ marginBottom: 8 }}>
          <input type="radio" checked={objection === o} onChange={() => setObjection(o)} />
          <span style={{ marginLeft: 8 }}>{o}</span>
        </div>
      ))}

      <textarea
        value={newObjection}
        onChange={(e) => setNewObjection(e.target.value)}
        placeholder="Add your own objection here..."
        style={{ width: "100%", height: 70, marginTop: 10 }}
      />

      <br />

      <button onClick={addObjection} style={{ marginTop: 8 }}>
        Add Objection
      </button>

      <hr />

      <button onClick={start} style={{ padding: 14, fontSize: 16 }}>
        Start Training
      </button>

      <h2>Roleplay</h2>

      <div style={{ background: "#fafafa", padding: 16, borderRadius: 10, minHeight: 250 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <strong>{m.role}:</strong>
            <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
          </div>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask your discovery question..."
        style={{ width: "100%", height: 90, marginTop: 16 }}
      />

      <br />

      <button onClick={send} style={{ marginTop: 8, padding: 12 }}>
        Send Question
      </button>
    </div>
  );
}