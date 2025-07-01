console.log("Email Writer Extension - content Script Loaded");
function getEmailContent() {
    const selector = [
        '.a3s.ail',
        '.h7',
        '.gmail_quote',
        '[role="presentation"]', // Gmail email content
        '[role="textbox"][g_editable="true"]', // Gmail Compose Box
        '[role="article"]', // Outlook email content
        '[role="document"]', // Generic email content
        '.editable', // Yahoo Mail email content
        '.readable', // Yahoo Mail Compose Box
        '.email-body', // Generic email body
        '.email-content', // Generic email content
        '.message-body', // Generic message body                
    ];
    for (const sel of selector) {
        const content = document.querySelector(sel);
        if (content) {
            console.log(`Toolbar found with selector: ${sel}`);
            return content.innerText.trim();
        }

    }
    return '';
}
function findComposeToolbar() {
    const selector = [
        '.aDh', // Gmail Compose Toolbar
        '.btC', // Outlook Compose Toolbar
        '[role="toolbar"]', // Generic Toolbar
        '.gU.Up', // Yahoo Mail Compose Toolba

    ];
    for (const sel of selector) {
        const toolbar = document.querySelector(sel);
        if (toolbar) {
            console.log(`Toolbar found with selector: ${sel}`);
            return toolbar;
        }
        return null;
    }
}
function createAIButton() {
    const button = document.createElement('div');
    button.className =
        'T-I J-J5-Ji aoO v7 T-I-atl L3 ';
    button.style.marginRight = '8px';
    button.innerHTML = `AI Reply`;
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', 'AI Reply');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();
    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }
    console.log("toolbar found, injecting button");

    const button = createAIButton();
    button.classList.add('ai-reply-button');
    button.addEventListener('click', async () => {
        try {
            button.innerHTML = `Generating...`;
            button.disabled = true;

            const emailContent = getEmailContent()
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "emailContent": emailContent,
                    "tone": "professional",
                    "language": "en",
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);

            } else {
                console.error("Compose box not found");
            }
        } catch (error) {
            console.error("Error generating AI reply:", error);
            console.error("Error in AI Reply button click handler:", error);
        } finally {
            button.innerHTML = `AI Reply`;
            button.disabled = false;
        }
    });
    toolbar.insertBefore(button, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC,[role = "dialog"]') || node.querySelector('.aDh, .btC, [role = "dialog"]'))
        );
        if (hasComposeElements) {
            console.log("compose Window Detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});