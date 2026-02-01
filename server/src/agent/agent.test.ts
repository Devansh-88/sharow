import agent from './base.agent';

async function testAgent() {
  const imageUrl = 'https://imgv2-1-f.scribdassets.com/img/document/325334324/original/4360bfeecd/1?v=1';
  const question = 'What is my total amount and shadow waste?';
  
  const appliances = [
    { name: 'Air Conditioner', avgUsageHours: 8, wattage: 1500 },
    { name: 'Refrigerator', avgUsageHours: 24, wattage: 150 },
    { name: 'TV', avgUsageHours: 5, wattage: 100 },
    { name: 'Washing Machine', avgUsageHours: 1, wattage: 500 },
  ];

  try {
    console.log('Step 1: Analyzing bill image...\n');
    const initialResult = await agent.run({ imageUrl, question, appliances });
    
    if (initialResult?.error) {
      console.error('Agent Error:', initialResult.error.message);
      if (initialResult.error.details) {
        console.error('Details:', initialResult.error.details);
      }
      return;
    }
    
    if (initialResult?.output) {
      console.log('Bill Analysis Result:\n');
      console.log(JSON.stringify(initialResult.output, null, 2));
      console.log('\n---\n');
    }

    if (initialResult?.history) {
      console.log('Step 2: Testing follow-up conversation...\n');
      
      const followUpQuestions = [
        'Which appliance is costing me the most?',
        'How can I reduce my electricity bill?',
        'What is my cost per unit of electricity?'
      ];

      let conversationHistory = initialResult.history;

      for (const followUpQuestion of followUpQuestions) {
        console.log(`User: ${followUpQuestion}`);
        
        const chatResult = await agent.run({
          message: followUpQuestion,
          history: conversationHistory
        });

        if (chatResult?.output) {
          console.log(`Assistant: ${chatResult.output}\n`);
          conversationHistory = chatResult.history || conversationHistory;
        }
      }
    }
    
  } catch (err) {
    console.error('Agent error:', err);
  }
}

testAgent();
