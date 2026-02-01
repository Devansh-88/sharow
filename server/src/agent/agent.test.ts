import agent from './base.agent';

async function testAgent() {
  const imageUrl = 'https://imgv2-1-f.scribdassets.com/img/document/325334324/original/4360bfeecd/1?v=1'; // Replace with a real image URL
  const question = 'What is my total amount and shadow waste?';
  
  // Optional: Pass appliance data for cost calculation
  const appliances = [
    { name: 'Air Conditioner', avgUsageHours: 8, wattage: 1500 },
    { name: 'Refrigerator', avgUsageHours: 24, wattage: 150 },
    { name: 'TV', avgUsageHours: 5, wattage: 100 },
    { name: 'Washing Machine', avgUsageHours: 1, wattage: 500 },
  ];

  try {
    const result = await agent.run({ imageUrl, question, appliances });
    if (result?.error) {
      console.error('Agent error:', result.error.message);
      if (result.error.details) {
        console.error('Details:', result.error.details);
      }
    } else if (result?.output) {
      console.log('--- Bill Extraction Result ---');
      for (const [key, value] of Object.entries(result.output)) {
        console.log(`${key}:`, value);
      }
    } else {
      console.log('Agent output:', result);
    }
  } catch (err) {
    console.error('Agent error:', err);
  }
}

testAgent();
