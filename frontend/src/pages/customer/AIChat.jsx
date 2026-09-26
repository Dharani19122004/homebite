import { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Info,
  ShoppingBasket,
  CreditCard,
  Truck,
  ChefHat,
  LifeBuoy,
  Search,
  ArrowLeft,
  List,
  LayoutGrid,
  Trash2,
  X,
  SearchX,
} from "lucide-react";
import {
  BOT_NAME,
  EMPTY_STATE_TEXT,
  FAQ_CATEGORIES,
  FOLLOW_UP_PROMPT,
  INITIAL_SUGGESTION_IDS,
  NO_RESULTS_TEXT,
  SUPPORT_FAQ_ID,
  WELCOME_MESSAGE,
  getFaqById,
  getFaqsByCategory,
  getFaqsByIds,
  getFollowUps,
  searchFaqs,
} from "../../data/homebiteFaqs";
import "./AIChat.css";

// Icon names in the FAQ data file -> Lucide components.
const CATEGORY_ICONS = {
  Info,
  ShoppingBasket,
  CreditCard,
  Truck,
  ChefHat,
  LifeBuoy,
};

const createWelcome = () => [
  { id: "welcome", role: "bot", text: WELCOME_MESSAGE },
];

const initialTray = () => ({
  view: "suggested",
  prompt: null,
  faqs: getFaqsByIds(INITIAL_SUGGESTION_IDS),
});

// `tray` is the suggestion area under the latest message; its `view` is one of
// suggested | categories | category | all (search results override it).
function AIChat() {
  const [messages, setMessages] = useState(createWelcome);
  const [tray, setTray] = useState(initialTray);
  const [query, setQuery] = useState("");

  const nextId = useRef(1);
  const scrollRef = useRef(null);
  const trayRef = useRef(null);

  const isSearching = query.trim().length > 0;
  const searchResults = isSearching ? searchFaqs(query) : [];

  // New message: scroll the conversation to the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Browsing (categories / all questions / search): bring the list into view.
  useEffect(() => {
    const el = scrollRef.current;
    const trayEl = trayRef.current;

    if (!el || !trayEl || (tray.view === "suggested" && !isSearching)) return;

    el.scrollTo({ top: trayEl.offsetTop - 8, behavior: "smooth" });
  }, [tray.view, tray.categoryId, isSearching]);

  // The customer's pick becomes their message, then the fixed answer,
  // then that FAQ's related questions.
  const askFaq = (faq) => {
    const id = nextId.current;
    nextId.current += 2;

    setMessages((prev) => [
      ...prev,
      { id, role: "user", text: faq.question },
      { id: id + 1, role: "bot", text: faq.answer },
    ]);
    setTray({
      view: "suggested",
      prompt: FOLLOW_UP_PROMPT,
      faqs: getFollowUps(faq.id),
    });
    setQuery("");
  };

  const handleClear = () => {
    setMessages(createWelcome());
    setTray(initialTray());
    setQuery("");
  };

  const handleContactSupport = () => {
    const faq = getFaqById(SUPPORT_FAQ_ID);
    if (faq) askFaq(faq);
  };

  const showCategories = () => {
    setQuery("");
    setTray({ view: "categories" });
  };

  const showAll = () => {
    setQuery("");
    setTray({ view: "all" });
  };

  const renderChip = (faq) => (
    <button
      key={faq.id}
      type="button"
      className="chat-chip"
      onClick={() => askFaq(faq)}
    >
      {faq.question}
    </button>
  );

  const renderActions = () => (
    <div className="chat-actions">
      {tray.view !== "categories" && (
        <button type="button" className="chat-action" onClick={showCategories}>
          {tray.view === "category" || tray.view === "all" ? (
            <ArrowLeft size={14} />
          ) : (
            <LayoutGrid size={14} />
          )}
          {tray.view === "category" || tray.view === "all"
            ? "Back to Categories"
            : "Browse Categories"}
        </button>
      )}

      {tray.view !== "all" && (
        <button type="button" className="chat-action" onClick={showAll}>
          <List size={14} /> Show All Questions
        </button>
      )}
    </div>
  );

  const renderTray = () => {
    if (isSearching) {
      return (
        <>
          <p className="chat-tray-prompt">
            {searchResults.length > 0
              ? `${searchResults.length} matching question${searchResults.length > 1 ? "s" : ""}`
              : NO_RESULTS_TEXT}
          </p>

          {searchResults.length > 0 ? (
            <div className="chat-chips">{searchResults.map(renderChip)}</div>
          ) : (
            <div className="chat-noresults">
              <SearchX size={22} />
              <button
                type="button"
                className="chat-action"
                onClick={handleContactSupport}
              >
                <LifeBuoy size={14} /> How can I contact support?
              </button>
            </div>
          )}
        </>
      );
    }

    if (tray.view === "categories") {
      return (
        <>
          <p className="chat-tray-prompt">Choose a category</p>

          <div className="chat-chips">
            {FAQ_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.icon] || Info;

              return (
                <button
                  key={category.id}
                  type="button"
                  className="chat-chip chat-chip-category"
                  onClick={() =>
                    setTray({ view: "category", categoryId: category.id })
                  }
                >
                  <Icon size={15} /> {category.title}
                </button>
              );
            })}
          </div>

          {renderActions()}
        </>
      );
    }

    if (tray.view === "category") {
      const category = FAQ_CATEGORIES.find((c) => c.id === tray.categoryId);

      return (
        <>
          <p className="chat-tray-prompt">{category?.title}</p>
          <div className="chat-chips">
            {getFaqsByCategory(tray.categoryId).map(renderChip)}
          </div>
          {renderActions()}
        </>
      );
    }

    if (tray.view === "all") {
      return (
        <>
          {FAQ_CATEGORIES.map((category) => (
            <div key={category.id} className="chat-group">
              <p className="chat-tray-prompt">{category.title}</p>
              <div className="chat-chips">
                {getFaqsByCategory(category.id).map(renderChip)}
              </div>
            </div>
          ))}
          {renderActions()}
        </>
      );
    }

    return (
      <>
        {tray.prompt && <p className="chat-tray-prompt">{tray.prompt}</p>}
        <div className="chat-chips">{tray.faqs.map(renderChip)}</div>
        {renderActions()}
      </>
    );
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot">
        <div className="chatbot-header">
          <span className="chatbot-header-avatar">
            <Bot size={22} />
          </span>

          <div className="chatbot-header-text">
            <h1>{BOT_NAME}</h1>
            <span className="chatbot-status">
              <span className="chatbot-status-dot" /> Online
            </span>
          </div>

          <button type="button" className="chatbot-clear" onClick={handleClear}>
            <Trash2 size={15} /> Clear Chat
          </button>
        </div>

        <div className="chatbot-body" ref={scrollRef} aria-live="polite">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "chat-row chat-row-user"
                  : "chat-row"
              }
            >
              <span
                className={
                  m.role === "user"
                    ? "chat-avatar chat-avatar-user"
                    : "chat-avatar"
                }
              >
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </span>

              <div
                className={
                  m.role === "user"
                    ? "chat-bubble chat-bubble-user"
                    : "chat-bubble"
                }
              >
                {m.text}
              </div>
            </div>
          ))}

          <div className="chat-tray" ref={trayRef}>
            {renderTray()}
          </div>
        </div>

        <div className="chatbot-footer">
          <div className="chatbot-search">
            <Search size={16} />
            <input
              type="text"
              value={query}
              maxLength={80}
              placeholder="Search questions..."
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search predefined questions"
            />
            {query && (
              <button
                type="button"
                className="chatbot-search-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <p className="chatbot-hint">{EMPTY_STATE_TEXT}</p>
        </div>
      </div>
    </div>
  );
}

export default AIChat;
