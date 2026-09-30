(() => {
  'use strict';
  const ui = {
    form: document.querySelector('.chat-form'),
    input: document.querySelector('#message'),
    send: document.querySelector('.send-button'),
    welcome: document.querySelector('.welcome'),
    messages: document.querySelector('.chat-messages'),
    scroll: document.querySelector('.chat-scroll'),
    status: document.querySelector('#chat-status'),
    history: document.querySelector('.conversation-link'),
    empty: document.querySelector('.history-empty')
  };
  let activeRequest = null;
  const syncComposer = () => {
    ui.send.disabled = !ui.input.value.trim() || Boolean(activeRequest);
    ui.input.style.height = 'auto';
    ui.input.style.height = `${Math.min(ui.input.scrollHeight, 170)}px`;
  };
  const scrollToLatest = () => { ui.scroll.scrollTop = ui.scroll.scrollHeight; };
  function addMessage(role, text) {
    const article = document.createElement('article');
    article.className = `message message-${role}`;
    const label = document.createElement('strong');
    label.className = 'message-label';
    label.textContent = role === 'user' ? 'You' : 'Forma';
    const body = document.createElement('p');
    body.className = 'message-text';
    body.textContent = text;
    article.append(label, body);
    ui.messages.append(article);
    scrollToLatest();
    return { article, body };
  }
  async function requestReply(message, reply) {
    const controller = new AbortController();
    activeRequest = controller;
    reply.article.classList.remove('error');
    reply.article.classList.add('pending');
    reply.article.querySelector('.retry-button')?.remove();
    reply.body.textContent = 'Making space for a thought…';
    ui.status.textContent = 'Forma is thinking.';
    syncComposer();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      const answer = data.reply || data.message;
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Empty response');
      if (activeRequest !== controller) return;
      reply.body.textContent = answer;
      ui.status.textContent = 'Reply received.';
    } catch (error) {
      if (activeRequest !== controller) return;
      reply.article.classList.add('error');
      reply.body.textContent = error.name === 'AbortError'
        ? 'This is taking longer than expected. Please try again.'
        : 'I couldn’t reach the AI service. Your message is still here — you can try again when the connection is ready.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'retry-button';
      retry.textContent = 'Try again';
      retry.addEventListener('click', () => { if (!activeRequest) requestReply(message, reply); });
      reply.article.append(retry);
      ui.status.textContent = 'The reply could not be loaded. Try again is available.';
    } finally {
      clearTimeout(timeout);
      if (activeRequest === controller) {
        activeRequest = null;
        reply.article.classList.remove('pending');
        syncComposer();
        scrollToLatest();
      }
    }
  }
  ui.form.addEventListener('submit', event => {
    event.preventDefault();
    const message = ui.input.value.trim();
    if (!message || activeRequest) return;
    ui.welcome.hidden = true;
    ui.messages.hidden = false;
    if (ui.history.hidden) {
      ui.history.textContent = message;
      ui.history.title = message;
      ui.history.hidden = false;
      ui.empty.hidden = true;
    }
    addMessage('user', message);
    ui.input.value = '';
    const reply = addMessage('agent', 'Making space for a thought…');
    requestReply(message, reply);
    ui.input.focus();
  });
  ui.input.addEventListener('input', syncComposer);
  ui.input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      ui.form.requestSubmit();
    }
  });
  document.querySelectorAll('[data-prompt]').forEach(button => {
    button.addEventListener('click', () => {
      ui.input.value = button.dataset.prompt;
      syncComposer();
      ui.input.focus();
    });
  });
  function newConversation() {
    const previous = activeRequest;
    activeRequest = null;
    previous?.abort();
    ui.messages.replaceChildren();
    ui.messages.hidden = true;
    ui.welcome.hidden = false;
    ui.history.hidden = true;
    ui.history.textContent = '';
    ui.empty.hidden = false;
    ui.input.value = '';
    ui.status.textContent = 'New conversation started.';
    syncComposer();
    ui.scroll.scrollTop = 0;
    ui.input.focus();
  }
  document.querySelectorAll('.new-chat, .mobile-new').forEach(button => button.addEventListener('click', newConversation));
  ui.history.addEventListener('click', () => { scrollToLatest(); ui.input.focus(); });
  syncComposer();
})();
