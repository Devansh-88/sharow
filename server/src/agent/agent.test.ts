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
    const result = await agent.run({ imageUrl, question, appliances });
    if (result?.error) {
      console.error('Agent Error:', result.error.message);
      if (result.error.details) {
        console.error('Details:', result.error.details);
      }
    } else if (result?.output) {
      console.log('Bill Analysis Result:\n');
      console.log(JSON.stringify(result.output, null, 2));
    } else {
      console.log('Agent output:', result);
    }
  } catch (err) {
    console.error('Agent error:', err);
  }
}

testAgent();
