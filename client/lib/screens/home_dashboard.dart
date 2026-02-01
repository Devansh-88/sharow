import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shadowapp/providers/user_provider.dart';
import 'package:shadowapp/screens/scanner_screen.dart';
import 'package:shadowapp/widgets/spline_viewer.dart';
import '../providers/energy_provider.dart';

class HomeDashboard extends StatefulWidget {
  const HomeDashboard({super.key});

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  @override
  Widget build(BuildContext context) {
    // This connects to the 'Brain' we built earlier
    final energyData = context.watch<EnergyProvider>();
    final user = context.watch<UserProvider>().user;

    return Scaffold(
      backgroundColor: const Color(0xFF0D0221), // Midnight Black
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              _buildHeader(user),
              const SizedBox(height: 30),
              
              // 3D ROOM PLACEHOLDER
              _build3DContainer(),
              
              const SizedBox(height: 25),
              
              // MAIN BILL CARD
              _buildTotalBillCard(energyData.totalBillAmount.toString()),
              
              const SizedBox(height: 20),
              
              // SHADOW WASTE WARNING
              _buildShadowWarning(energyData.applianceBreakdown['Shadow Waste']?.toString() ?? "0.0"),
              
              const SizedBox(height: 20),
              
              // APPLIANCE GRID
              _buildApplianceGrid(energyData),
              
              const SizedBox(height: 100), // Space for the floating button
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFBD93F9), // Neon Purple
        onPressed: () {
           Navigator.push(
           context,
          MaterialPageRoute(builder: (context) => const ScannerScreen()),
    );
  },
        icon: const Icon(Icons.qr_code_scanner, color: Colors.black),
        label: const Text("SCAN BILL", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  // --- UI COMPONENTS ---
  Widget _buildHeader(user) {
  return Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween, // Pushes items to opposite ends
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // Left: App Title and Subtitle
       Column(
        
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Shadow Tracker",
            style: TextStyle(
              color: Color(0xFFBD93F9),
              fontSize: 26,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            "Welcome, ${user?.name ?? 'Agent'}", 
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
          ),
        ],
      ),

      // Right: Circular Profile Frame
      GestureDetector(
        onTap: () => print("Profile Tapped"),
        child: Container(
          padding: const EdgeInsets.all(2), // This creates the border thickness
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFFBD93F9), Color(0xFF0D0221)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFBD93F9).withOpacity(0.2),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: const CircleAvatar(
            radius: 24,
            backgroundColor: Color(0xFF1B1464),
            // Use a placeholder or your own asset
            child: Icon(
              Icons.person_outline_rounded,
              color: Color(0xFFBD93F9), 
              size: 28,
            ),
          ),
        ),
      ),
    ],
  );
}

  Widget _build3DContainer() {
    return Container(
      height: 280, // Giving the 3D room enough breathing space
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1B1464).withOpacity(0.1),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: const Color(0xFFBD93F9).withOpacity(0.2), 
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(25),
        child: const SplineViewerScreen(), // Calling your separate widget
      ),
    );
  }

  Widget _buildTotalBillCard(String amount) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1B1464), Color(0xFF0D0221)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(color: const Color(0xFFBD93F9).withOpacity(0.1), blurRadius: 20, spreadRadius: 2)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Estimated Total", style: TextStyle(color: Colors.white60, fontSize: 14)),
          const SizedBox(height: 5),
          Text("₹$amount", style: const TextStyle(color: Colors.white, fontSize: 38, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildShadowWarning(String waste) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFFFF5555).withOpacity(0.1),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFF5555).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Color(0xFFFF5555)),
          const SizedBox(width: 12),
          Text("Vampire Load detected: ₹$waste", 
            style: const TextStyle(color: Color(0xFFFF5555), fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildApplianceGrid(EnergyProvider data) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 15,
      mainAxisSpacing: 15,
      childAspectRatio: 1.5,
      children: [
        _miniCard("Air Conditioner", "₹${data.applianceBreakdown['Air Conditioner'] ?? '0'}", Icons.ac_unit),
        _miniCard("Refrigerator", "₹${data.applianceBreakdown['Refrigerator'] ?? '0'}", Icons.kitchen),
      ],
    );
  }

  Widget _miniCard(String title, String val, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1464).withOpacity(0.3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: const Color(0xFFBD93F9), size: 20),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(color: Colors.white54, fontSize: 11)),
          Text(val, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        ],
      ),
    );
  }
}