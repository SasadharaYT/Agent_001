(() => {
  'use strict';

  const API_URL = 'http://127.0.0.1:5000/api/chat';

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

  // --------------------------------------------------
  // Composer state
  // --------------------------------------------------

  const syncComposer = () => {
    const hasMessage = Boolean(ui.input.value.trim());

    ui.send.disabled = !hasMessage || Boolean(activeRequest);

    ui.input.style.height = 'auto';
    ui.input.style.height =
      `${Math.min(ui.input.scrollHeight, 170)}px`;
  };

  const scrollToLatest = () => {
    ui.scroll.scrollTop = ui.scroll.scrollHeight;
  };

  // --------------------------------------------------
  // Add message to chat
  // --------------------------------------------------

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

    return {
      article,
      body
    };
  }

  // --------------------------------------------------
  // Request Gemini reply from Python backend
  // --------------------------------------------------

  async function requestReply(message, reply) {
    const controller = new AbortController();

    activeRequest = controller;

    reply.article.classList.remove('error');
    reply.article.classList.add('pending');

    reply.article.querySelector('.retry-button')?.remove();

    reply.body.textContent = 'Making space for a thought…';

    ui.status.textContent = 'Forma is thinking.';

    syncComposer();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 45000);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          message: message
        }),

        signal: controller.signal
      });

      // Try to read JSON response
      const data = await response.json();

      // Backend returned an error status
      if (!response.ok) {
        throw new Error(
          data.error || `Request failed with status ${response.status}`
        );
      }

      // Our backend returns:
      //
      // {
      //   "response": "Gemini response here"
      // }

      const answer = data.response;

      if (typeof answer !== 'string' || !answer.trim()) {
        throw new Error('The server returned an empty response.');
      }

      // Ignore old response if conversation changed
      if (activeRequest !== controller) {
        return;
      }

      reply.body.textContent = answer.trim();

      ui.status.textContent = 'Reply received.';

    } catch (error) {

      if (activeRequest !== controller) {
        return;
      }

      console.error('Chat request failed:', error);

      reply.article.classList.add('error');

      if (error.name === 'AbortError') {
        reply.body.textContent =
          'This is taking longer than expected. Please try again.';
      } else {
        reply.body.textContent =
          'I couldn’t reach the AI service. Your message is still here, so you can try again.';
      }

      // Retry button
      const retry = document.createElement('button');

      retry.type = 'button';
      retry.className = 'retry-button';
      retry.textContent = 'Try again';

      retry.addEventListener('click', () => {
        if (!activeRequest) {
          requestReply(message, reply);
        }
      });

      reply.article.append(retry);

      ui.status.textContent =
        'The reply could not be loaded. Try again is available.';

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

  // --------------------------------------------------
  // Submit message
  // --------------------------------------------------

  ui.form.addEventListener('submit', event => {
    event.preventDefault();

    const message = ui.input.value.trim();

    if (!message || activeRequest) {
      return;
    }

    // Hide welcome screen
    ui.welcome.hidden = true;

    // Show messages
    ui.messages.hidden = false;

    // Set conversation title
    if (ui.history.hidden) {
      ui.history.textContent = message;
      ui.history.title = message;
      ui.history.hidden = false;

      ui.empty.hidden = true;
    }

    // Display user message
    addMessage('user', message);

    // Clear input
    ui.input.value = '';

    syncComposer();

    // Temporary AI message
    const reply = addMessage(
      'agent',
      'Making space for a thought…'
    );

    // Send actual user message to backend
    requestReply(message, reply);

    ui.input.focus();
  });

  // --------------------------------------------------
  // Textarea resizing
  // --------------------------------------------------

  ui.input.addEventListener('input', syncComposer);

  // --------------------------------------------------
  // Enter to send
  // Shift + Enter = new line
  // --------------------------------------------------

  ui.input.addEventListener('keydown', event => {

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault();

      ui.form.requestSubmit();
    }
  });

  // --------------------------------------------------
  // Suggested prompt buttons
  // --------------------------------------------------

  document
    .querySelectorAll('[data-prompt]')
    .forEach(button => {

      button.addEventListener('click', () => {

        ui.input.value = button.dataset.prompt || '';

        syncComposer();

        ui.input.focus();
      });

    });

  // --------------------------------------------------
  // New conversation
  // --------------------------------------------------

  function newConversation() {

    const previousRequest = activeRequest;

    activeRequest = null;

    previousRequest?.abort();

    // Remove previous messages
    ui.messages.replaceChildren();

    ui.messages.hidden = true;

    ui.welcome.hidden = false;

    // Reset sidebar history
    ui.history.hidden = true;
    ui.history.textContent = '';

    ui.empty.hidden = false;

    // Reset input
    ui.input.value = '';

    ui.status.textContent = 'New conversation started.';

    syncComposer();

    ui.scroll.scrollTop = 0;

    ui.input.focus();
  }

  document
    .querySelectorAll('.new-chat, .mobile-new')
    .forEach(button => {

      button.addEventListener(
        'click',
        newConversation
      );

    });

  // --------------------------------------------------
  // Sidebar conversation click
  // --------------------------------------------------

  ui.history.addEventListener('click', () => {

    scrollToLatest();

    ui.input.focus();
  });

  // --------------------------------------------------
  // Initial setup
  // --------------------------------------------------

  syncComposer();

})();