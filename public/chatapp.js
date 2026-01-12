document.addEventListener('submit', (e) => {
    e.preventDefault()
    progressConversation()
})

const convHistory = []

async function progressConversation() {
    const userInput = document.getElementById('user-input')
    const chatbotConversation = document.getElementById('chatbot-conversation-container')
    const question = userInput.value
    userInput.value = ''

    // add human message
    const newHumanSpeechBubble = document.createElement('div')
    newHumanSpeechBubble.classList.add('speech', 'speech-human')
    chatbotConversation.appendChild(newHumanSpeechBubble)
    newHumanSpeechBubble.textContent = question
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight

    console.log("Sending request to server...")
    const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            question: question,
            conv_history: convHistory
        })
    });
    console.log("Response received from server:")
    console.log(response)

    const data = await response.json();

    convHistory.push(question)
    convHistory.push(data.reply)

    // add AI message
    const newAiSpeechBubble = document.createElement('div')
    newAiSpeechBubble.classList.add('speech', 'speech-ai')
    chatbotConversation.appendChild(newAiSpeechBubble)
    newAiSpeechBubble.innerHTML = marked.parse(data.reply)
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight
}