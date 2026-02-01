import 'package:flutter/material.dart';

class AnalyticsScreen extends StatelessWidget {
  final Map<String, dynamic>? newBill; // Data passed from the AI scan

  const AnalyticsScreen({super.key, this.newBill});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0221),
      appBar: AppBar(
        title: const Text("Spending Insights", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. THE TOTAL SPENDING CARD
              _buildSummaryCard(),
              
              const SizedBox(height: 30),
              const Text("Category Breakdown", 
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 15),
              
              // 2. MINI CATEGORY CHIPS
              _buildCategoryScroll(),

              const SizedBox(height: 30),
              const Text("Recent Scans", 
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 15),

              // 3. THE RECENT SCANS LIST
              _buildRecentScansList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFBD93F9), Color(0xFF8B5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: const Color(0xFFBD93F9).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Total Monthly Spend", style: TextStyle(color: Colors.white70, fontSize: 16)),
          const SizedBox(height: 8),
          const Text("₹12,450.00", style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.trending_up, color: Colors.white, size: 20),
              const SizedBox(width: 5),
              Text("12% more than last month", style: TextStyle(color: Colors.white.withOpacity(0.8))),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildCategoryScroll() {
    List<Map<String, dynamic>> categories = [
      {"name": "Food", "icon": Icons.fastfood, "color": Colors.orange},
      {"name": "Shopping", "icon": Icons.shopping_bag, "color": Colors.blue},
      {"name": "Bills", "icon": Icons.receipt, "color": Colors.green},
    ];
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          return Container(
            width: 90,
            margin: const EdgeInsets.only(right: 15),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(categories[index]['icon'], color: categories[index]['color']),
                const SizedBox(height: 8),
                Text(categories[index]['name'], style: const TextStyle(color: Colors.white, fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecentScansList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 3, // Logic: Add 1 if newBill != null
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 15),
          padding: const EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0xFFBD93F9),
                child: Icon(Icons.description, color: Colors.white),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(index == 0 && newBill != null ? newBill!['vendor'] : "Starbucks Coffee", 
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    const Text("Yesterday, 4:30 PM", style: TextStyle(color: Colors.white54, fontSize: 12)),
                  ],
                ),
              ),
              Text(index == 0 && newBill != null ? "₹${newBill!['total']}" : "₹450", 
                style: const TextStyle(color: Color(0xFFBD93F9), fontWeight: FontWeight.bold)),
            ],
          ),
        );
      },
    );
  }
}