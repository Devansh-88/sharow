import 'package:flutter/material.dart';

class EnergyProvider with ChangeNotifier {
  // These names MUST match what the HomeDashboard is calling
  double totalBillAmount = 0.0;
  Map<String, double> applianceBreakdown = {
    "Air Conditioner": 0.0,
    "Refrigerator": 0.0,
    "Shadow Waste": 0.0,
  };

  bool isLoading = false;

  // This function will fix the red lines when you press the button
  void loadMockData() {
  if (isLoading) return; // 🛑 Agar pehle se load ho raha hai, toh ruk jao

  isLoading = true;
  // notifyListeners(); // Sirf tabhi call karein agar UI ko "Spinner" dikhana ho

  totalBillAmount = 4500.0;
  applianceBreakdown = {
    "Air Conditioner": 2200.0,
    "Refrigerator": 800.0,
    "Shadow Waste": 1500.0,
  };

  isLoading = false;
  notifyListeners(); // Data update hone ke baad notify karein
  }
}