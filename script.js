    const cases = [];
    let currentTab = 'auto';

    // Initialize UI components
    document.addEventListener('DOMContentLoaded', function() {
      // Tab switching
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
          this.classList.add('active');
          document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
          currentTab = this.dataset.tab;
        });
      });
      
      // Advanced options toggle
      document.getElementById('enableAdvanced').addEventListener('change', function() {
        document.getElementById('advancedOptions').style.display = this.checked ? 'block' : 'none';
      });
      
      // Update stats when inputs change
      document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', updateStats);
      });
      
      // Initial render
      renderCasesList();
      updateStats();
    });

    function addCase() {
      const caseText = document.getElementById('caseInput').value.trim();
      const responseText = document.getElementById('responseInput').value.trim();
      const commandType = document.getElementById('commandType').value;
      
      if (!caseText || !responseText) {
        showError('Please enter both command and response');
        return;
      }
      
      if (cases.some(c => c.case === caseText)) {
        showError('This command already exists');
        return;
      }
      
      cases.push({
        type: 'auto',
        case: caseText,
        response: responseText,
        commandType: commandType
      });
      
      showSuccess('Command added successfully');
      renderCasesList();
      renderCode();
      document.getElementById('caseInput').value = '';
      document.getElementById('responseInput').value = '';
    }

    function addManualCase() {
      const manualCode = document.getElementById('manualCode').value.trim();
      
      if (!manualCode.includes('case')) {
        showError('Manual code must contain a case statement');
        return;
      }
      
      // Validate bot variable name
      const botVar = document.getElementById('botVar').value.trim() || 'bot';
      const regex = new RegExp(`(\\W|^)${botVar}\\.`, 'g');
      if (!regex.test(manualCode)) {
        showError(`Make sure to use '${botVar}.methodName()' for bot actions`);
        return;
      }
      
      cases.push({
        type: 'manual',
        code: manualCode
      });
      
      showSuccess('Custom command added successfully');
      renderCasesList();
      renderCode();
      document.getElementById('manualCode').value = '';
    }

    function renderCasesList() {
      const container = document.getElementById('casesList');
      container.innerHTML = '';
      
      if (cases.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b;">No commands added yet</p>';
        return;
      }
      
      cases.forEach((item, index) => {
        const caseEl = document.createElement('div');
        caseEl.className = 'case-item';
        
        if (item.type === 'auto') {
          caseEl.innerHTML = `
            <div>
              <strong>${item.case}</strong> → 
              <span style="color: #64748b;">${item.response.substring(0, 30)}${item.response.length > 30 ? '...' : ''}</span>
            </div>
            <button class="danger" onclick="removeCase(${index})"><i class="fas fa-trash"></i></button>
          `;
        } else {
          caseEl.innerHTML = `
            <div>
              <strong>Custom Code</strong> → 
              <span style="color: #64748b; font-family: monospace;">${item.code.substring(0, 30)}${item.code.length > 30 ? '...' : ''}</span>
            </div>
            <button class="danger" onclick="removeCase(${index})"><i class="fas fa-trash"></i></button>
          `;
        }
        
        container.appendChild(caseEl);
      });
    }

    function removeCase(index) {
      cases.splice(index, 1);
      renderCasesList();
      renderCode();
      showSuccess('Command removed');
    }

    function renderCode() {
      const token = document.getElementById('botToken').value.trim() || 'YOUR_TELEGRAM_BOT_TOKEN';
      const owner = document.getElementById('ownerName').value.trim() || 'Owner';
      const ownerId = document.getElementById('ownerId').value.trim() || '123456789';
      const botVar = document.getElementById('botVar').value.trim() || 'bot';
      const botName = document.getElementById('botName').value.trim() || 'MyBot';
      const botUsername = document.getElementById('botUsername').value.trim() || '@MyBot';
      const welcomeMessage = document.getElementById('welcomeMessage').value.trim() || 'Welcome to the bot!';
      const errorMessage = document.getElementById('errorMessage').value.trim() || 'Command not recognized';
      
      let code = `// IceBot Generated Script
// Bot Name: ${botName} (${botUsername})
// Owner: ${owner} (ID: ${ownerId})
// Generated at: ${new Date().toLocaleString()}

const TelegramBot = require('node-telegram-bot-api');
const token = '${token}';
const ${botVar} = new TelegramBot(token, { polling: true });

// Configuration
const ownerName = "${owner}";
const ownerId = ${ownerId};
const botName = "${botName}";

// Log when bot is ready
${botVar}.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

${botVar}.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;

  // Log incoming messages
  console.log(\`[\${new Date().toLocaleString()}] Message from \${msg.from.first_name} (\${userId}): \${text}\`);

  switch (text) {\n`;

      cases.forEach(item => {
        if (item.type === 'auto') {
          if (item.commandType === 'text') {
            code += `    case '${item.case}':
      ${botVar}.sendMessage(chatId, \`${item.response.replace(/`/g, '\\`')}\`);
      break;\n\n`;
          } else if (item.commandType === 'photo') {
            code += `    case '${item.case}':
      ${botVar}.sendPhoto(chatId, '${item.response}');
      break;\n\n`;
          } else if (item.commandType === 'document') {
            code += `    case '${item.case}':
      ${botVar}.sendDocument(chatId, '${item.response}');
      break;\n\n`;
          } else if (item.commandType === 'sticker') {
            code += `    case '${item.case}':
      ${botVar}.sendSticker(chatId, '${item.response}');
      break;\n\n`;
          }
        } else {
          code += `    ${item.code}\n\n`;
        }
      });

      code += `    default:
      ${botVar}.sendMessage(chatId, "${errorMessage}");
      break;
  }
});

// Welcome message for /start
${botVar}.onText(/\\/start/, (msg) => {
  const chatId = msg.chat.id;
  ${botVar}.sendMessage(chatId, \`${welcomeMessage.replace(/`/g, '\\`')}\`);
});

console.log('${botName} is running...');`;

      document.getElementById('outputCode').textContent = code;
      updateStats();
      hljs.highlightAll();
    }

    function updateStats() {
      document.getElementById('caseCount').textContent = cases.length;
      
      const code = document.getElementById('outputCode').textContent;
      document.getElementById('charCount').textContent = code.length;
      document.getElementById('lineCount').textContent = code.split('\n').length;
    }

    function copyToClipboard() {
      const code = document.getElementById('outputCode').textContent;
      navigator.clipboard.writeText(code).then(() => {
        showSuccess('Script copied to clipboard!');
      });
    }

    function downloadScript() {
      const blob = new Blob([document.getElementById('outputCode').textContent], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'icebot.js';
      a.click();
      showSuccess('Download started!');
    }

    function exportConfig() {
      const config = {
        botVar: document.getElementById('botVar').value.trim() || 'bot',
        botToken: document.getElementById('botToken').value.trim(),
        ownerName: document.getElementById('ownerName').value.trim(),
        ownerId: document.getElementById('ownerId').value.trim(),
        commands: cases
      };

      
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'icebot-config.json';
      a.click();
      showSuccess('Configuration exported!');
    }

function runBot() {
  const code = document.getElementById('outputCode').textContent;
  fetch('/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Bot response:', data);
    alert('Bot berhasil dijalankan!');
  })
  .catch(err => {
    console.error('Error saat menjalankan bot:', err);
    alert('Gagal menjalankan bot.');
  });
}   

    function resetAll() {
      if (confirm('Are you sure you want to reset everything?')) {
        cases.length = 0;
        document.getElementById('botVar').value = 'bot';
        document.getElementById('botToken').value = '';
        document.getElementById('ownerName').value = '';
        document.getElementById('ownerId').value = '';
        document.getElementById('caseInput').value = '';
        document.getElementById('responseInput').value = '';
        document.getElementById('manualCode').value = '';
        document.getElementById('chatPreview').innerHTML = `
          <div class="chat-message bot-message">
            <strong>🤖 Bot:</strong> Send a command to test the bot response
          </div>
        `;
        
        renderCasesList();
        renderCode();
        showSuccess('All settings reset');
      }
    }

    function simulateBot() {
      const input = document.getElementById('userInput').value.trim();
      const botVar = document.getElementById('botVar').value.trim() || 'bot';
      let reply = document.getElementById('errorMessage').value.trim() || 'Command not recognized';
      let matched = false;
      
      if (!input) {
        showError('Please enter a command to test');
        return;
      }
      
      // Check for /start specifically
      if (input === '/start') {
        reply = document.getElementById('welcomeMessage').value.trim() || 'Welcome to the bot!';
        matched = true;
      }
      
      // Check other commands
      for (const item of cases) {
        if (item.type === 'auto' && input === item.case) {
          reply = item.response;
          matched = true;
          break;
        } else if (item.type === 'manual' && item.code.includes(`case '${input}'`)) {
          reply = 'Custom command executed (simulated)';
          matched = true;
          break;
        }
      }
      
      const chatContainer = document.getElementById('chatPreview');
      chatContainer.innerHTML += `
        <div class="chat-message user-message">
          <strong>👤 You:</strong> ${input}
        </div>
        <div class="chat-message bot-message">
          <strong>🤖 ${botVar}:</strong> ${reply}
        </div>
      `;
      
      // Scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function clearChat() {
      document.getElementById('chatPreview').innerHTML = `
        <div class="chat-message bot-message">
          <strong>🤖 Bot:</strong> Send a command to test the bot response
        </div>
      `;
    }

    function testAllCommands() {
      clearChat();
      simulateCommand('/start');
      
      cases.forEach(item => {
        if (item.type === 'auto') {
          setTimeout(() => simulateCommand(item.case), 500);
        }
      });
    }

    function simulateCommand(command) {
      document.getElementById('userInput').value = command;
      simulateBot();
    }

    function validateCode() {
      const manualCode = document.getElementById('manualCode').value.trim();
      const botVar = document.getElementById('botVar').value.trim() || 'bot';
      
      if (!manualCode.includes('case')) {
        showError('Code must contain a case statement');
        return false;
      }
      
      if (!manualCode.includes(`${botVar}.`)) {
        showError(`Make sure to use '${botVar}.methodName()' for bot actions`);
        return false;
      }
      
      showSuccess('Code validation passed!');
      return true;
    }

    function previewCommand() {
      const caseText = document.getElementById('caseInput').value.trim();
      const responseText = document.getElementById('responseInput').value.trim();
      const commandType = document.getElementById('commandType').value;
      
      if (!caseText || !responseText) {
        showError('Please enter both command and response');
        return;
      }
      
      let preview;
      switch (commandType) {
        case 'text':
          preview = `case '${caseText}':\n  ${document.getElementById('botVar').value.trim() || 'bot'}.sendMessage(chatId, \`${responseText.replace(/`/g, '\\`')}\`);\n  break;`;
          break;
        case 'photo':
          preview = `case '${caseText}':\n  ${document.getElementById('botVar').value.trim() || 'bot'}.sendPhoto(chatId, '${responseText}');\n  break;`;
          break;
        case 'document':
          preview = `case '${caseText}':\n  ${document.getElementById('botVar').value.trim() || 'bot'}.sendDocument(chatId, '${responseText}');\n  break;`;
          break;
        case 'sticker':
          preview = `case '${caseText}':\n  ${document.getElementById('botVar').value.trim() || 'bot'}.sendSticker(chatId, '${responseText}');\n  break;`;
          break;
      }
      
      showSuccess('Command preview generated');
      document.getElementById('manualCode').value = preview;
      document.querySelector('.tab[data-tab="manual"]').click();
    }

    function showError(message) {
      const errorBox = document.getElementById('errorMsg');
      errorBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
      errorBox.style.display = 'block';
      document.getElementById('successMsg').style.display = 'none';
      
      setTimeout(() => {
        errorBox.style.display = 'none';
      }, 5000);
    }

    function showSuccess(message) {
      const successBox = document.getElementById('successMsg');
      successBox.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
      successBox.style.display = 'block';
      document.getElementById('errorMsg').style.display = 'none';
      
      setTimeout(() => {
        successBox.style.display = 'none';
      }, 3000);
    }